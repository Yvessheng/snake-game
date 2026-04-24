import {
  BASE_TICK_MS,
  MIN_TICK_MS,
  COMBO_TIMEOUT_MS,
  MAX_FOOD_ON_SCREEN,
  MIN_FOOD_TO_SPAWN,
  FOOD_SPAWN_CHANCE,
  oppositeDirection,
  getZoneConfig,
  getFoodScore,
  getFoodGrowth,
  getFoodConfig,
  getZoneForPosition,
  isPunishmentFood,
  ZONES,
  FOOD_TYPES,
} from '../types/game';
import type {
  Direction,
  Position,
  SnakeState,
  FoodState,
  FoodTypeId,
  GameState,
  ZoneId,
  ZoneBounds,
  PendingEffect,
} from '../types/game';
import { checkWallCollision, checkSelfCollision, randomFoodPositionInZone } from '../utils/collision';

export type GameEventType = 'eat' | 'die' | 'start' | 'zone_unlock' | 'food_new'
  | 'pending_effect_start' | 'pending_effect_warning' | 'effect_trigger' | 'effect_end';
export type GameEventCallback = (type: GameEventType, data?: unknown) => void;
export type { GameState } from '../types/game';

const INITIAL_SNAKE: Position[] = [
  { x: 20, y: 20 },
  { x: 19, y: 20 },
  { x: 18, y: 20 },
];

// Current boundary based on unlocked zones
function getCurrentBounds(unlockedZones: ZoneId[]): ZoneBounds {
  // Find the largest unlocked zone
  let bounds: ZoneBounds = { minX: 10, minY: 10, maxX: 30, maxY: 30 };
  for (const zone of ZONES) {
    if (unlockedZones.includes(zone.id)) {
      bounds = zone.bounds;
    }
  }
  return bounds;
}

// Weighted random food type selection
function pickFoodType(currentZone: ZoneId, unlockedZones: ZoneId[]): FoodTypeId {
  const available = FOOD_TYPES.filter((f) =>
    unlockedZones.some((z) => f.availableZones.includes(z))
  );

  // Boost current zone foods
  const weighted = available.map((f) => ({
    ...f,
    weight: f.availableZones.includes(currentZone) ? f.weight * 1.5 : f.weight,
  }));

  const totalWeight = weighted.reduce((sum, f) => sum + f.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const f of weighted) {
    rand -= f.weight;
    if (rand <= 0) return f.id;
  }
  return weighted[weighted.length - 1].id;
}

export class GameEngine {
  private state: GameState;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private durationTimer: ReturnType<typeof setInterval> | null = null;
  private onStateChange?: (state: GameState) => void;
  private onEvent?: GameEventCallback;

  constructor(onStateChange?: (state: GameState) => void, onEvent?: GameEventCallback) {
    this.onStateChange = onStateChange;
    this.onEvent = onEvent;
    this.state = this.createInitialState();
  }

  getState(): GameState {
    return { ...this.state };
  }

  start(): void {
    if (this.state.status === 'running') return;
    this.state.status = 'running';
    this.onEvent?.('start');
    this.runTick();
    this.startDurationTimer();
    this.emit();
  }

  pause(): void {
    if (this.state.status !== 'running') return;
    this.state.status = 'paused';
    this.stopTickTimer();
    this.stopDurationTimer();
    this.emit();
  }

  resume(): void {
    if (this.state.status !== 'paused') return;
    this.state.status = 'running';
    this.runTick();
    this.startDurationTimer();
    this.emit();
  }

  reset(): void {
    this.stopTickTimer();
    this.stopDurationTimer();
    this.state = this.createInitialState();
    this.emit();
  }

  setDirection(dir: Direction): void {
    if (this.state.status !== 'running') return;
    if (dir === this.state.snake.direction) return;

    let actualDir = dir;
    if (this.state.reversedControls) {
      actualDir = oppositeDirection(dir);
    }

    if (actualDir === oppositeDirection(this.state.snake.direction)) return;
    this.state.snake.direction = actualDir;
  }

  // Execute one game tick
  private tick(): void {
    const { snake } = this.state;
    const head = { ...snake.segments[0] };

    // Apply random direction effect
    const randomDirEffect = this.state.activeEffects.find((e) => e.type === 'randomDir');
    if (randomDirEffect && randomDirEffect.remainingTicks > 0) {
      const dirs: Direction[] = ['up', 'down', 'left', 'right'];
      const opposite = oppositeDirection(snake.direction);
      const validDirs = dirs.filter((d) => d !== opposite);
      snake.direction = validDirs[Math.floor(Math.random() * validDirs.length)];
    }

    // Move head
    switch (snake.direction) {
      case 'up': head.y -= 1; break;
      case 'down': head.y += 1; break;
      case 'left': head.x -= 1; break;
      case 'right': head.x += 1; break;
    }

    // Get current zone boundary for collision
    const bounds = getCurrentBounds(this.state.unlockedZones);

    // Wall collision (with shield check)
    if (checkWallCollision(head, bounds)) {
      if (this.state.shieldActive) {
        // Shield absorbs the hit
        this.state.shieldActive = false;
        this.state.activeEffects = this.state.activeEffects.filter((e) => e.type !== 'shield');
        // Push back: keep old position
        this.emit();
        return;
      }
      this.state.status = 'gameover';
      this.stopTickTimer();
      this.stopDurationTimer();
      this.onEvent?.('die');
      this.emit();
      return;
    }

    // Self collision (with shield check)
    if (checkSelfCollision(head, snake.segments)) {
      if (this.state.shieldActive) {
        this.state.shieldActive = false;
        this.state.activeEffects = this.state.activeEffects.filter((e) => e.type !== 'shield');
        this.emit();
        return;
      }
      this.state.status = 'gameover';
      this.stopTickTimer();
      this.stopDurationTimer();
      this.onEvent?.('die');
      this.emit();
      return;
    }

    // Add new head
    snake.segments.unshift(head);

    // Check food collision
    let ate = false;
    let eatenFood: FoodState | null = null;
    this.state.foods = this.state.foods.filter((food) => {
      if (food.position.x === head.x && food.position.y === head.y) {
        ate = true;
        eatenFood = food;
        return false;
      }
      return true;
    });

    if (ate && eatenFood) {
      this.handleEat(eatenFood);
    }

    // Remove tail if no food eaten
    if (!ate) {
      snake.segments.pop();
    }

    // Update active effects (decrement timers)
    this.updateEffects();

    // Check and trigger pending effects
    this.checkPendingEffects();

    // Check temporary segment expiry
    this.checkTemporarySegments();

    // Check combo timeout
    if (Date.now() - this.state.lastEatTime > COMBO_TIMEOUT_MS && this.state.combo > 0) {
      this.state.combo = 0;
    }

    // Check zone unlocks
    this.checkZoneUnlocks();

    // Check and remove expired foods
    this.checkExpiredFoods();

    // Update current zone
    this.state.currentZone = getZoneForPosition(head, this.state.unlockedZones);

    // Spawn food if needed
    this.spawnFood();

    this.emit();
  }

  private handleEat(food: FoodState): void {
    const foodConfig = getFoodConfig(food.type);
    const zoneConfig = getZoneConfig(this.state.currentZone);
    const score = getFoodScore(food.type, this.state.combo, zoneConfig.scoreMultiplier);

    // Add score
    this.state.score += score;

    // Add length
    const growth = getFoodGrowth(food.type);
    for (let i = 1; i < growth; i++) {
      const tail = this.state.snake.segments[this.state.snake.segments.length - 1];
      this.state.snake.segments.push({ ...tail });
    }

    // Update combo
    this.state.combo += 1;
    this.state.lastEatTime = Date.now();

    // Track collected food types
    if (!this.state.collectedFoodTypes.includes(food.type)) {
      this.state.collectedFoodTypes.push(food.type);
      this.onEvent?.('food_new', { type: food.type });
    }

    // Apply food effect
    if (foodConfig.effect !== 'none') {
      if (isPunishmentFood(food.type)) {
        // Punishment food: create pending effect with 5-15s random delay
        const delay = 5000 + Math.random() * 10000;
        const now = Date.now();
        const effectTicks = foodConfig.effect === 'reverseControls'
          ? Math.round(10000 / this.state.speed)
          : 0;
        this.state.pendingEffects.push({
          type: foodConfig.effect,
          triggerAt: now + delay,
          warningAt: now + delay - 3000,
          effect: {
            type: foodConfig.effect,
            remainingTicks: effectTicks,
            value: foodConfig.effect === 'temporaryLength' ? 5
              : foodConfig.effect === 'scorePenalty' ? 200
              : 0,
          },
          sourceFood: food.type,
          warningShown: false,
          triggered: false,
        });
        this.onEvent?.('pending_effect_start', { type: food.type, triggerAt: now + delay });
      } else if (foodConfig.effect === 'shield') {
        this.state.shieldActive = true;
        this.state.activeEffects.push({
          type: 'shield',
          remainingTicks: 1,
          value: 1,
        });
      } else {
        this.state.activeEffects.push({
          type: foodConfig.effect,
          remainingTicks: foodConfig.effectDuration,
          value: foodConfig.effect === 'speedBoost' ? 1.5 : 1,
        });
      }
    }

    // Update speed based on effects
    this.updateSpeed();

    // Emit eat event with food type
    this.onEvent?.('eat', { type: food.type });
  }

  private updateEffects(): void {
    this.state.activeEffects = this.state.activeEffects
      .map((e) => ({ ...e, remainingTicks: e.remainingTicks - 1 }))
      .filter((e) => e.remainingTicks > 0);

    // Update shield flag
    this.state.shieldActive = this.state.activeEffects.some((e) => e.type === 'shield');

    // Update random dir flag
    this.state.randomDirActive = this.state.activeEffects.some((e) => e.type === 'randomDir');

    // Update speed multiplier from effects
    const speedBoost = this.state.activeEffects.find((e) => e.type === 'speedBoost');
    this.state.speedMultiplier = speedBoost ? speedBoost.value : 1;

    // Update reversed controls flag from effects
    const reverseActive = this.state.activeEffects.some((e) => e.type === 'reverseControls');
    if (!reverseActive) {
      this.state.reversedControls = false;
    }
  }

  private updateSpeed(): void {
    const zoneConfig = getZoneConfig(this.state.currentZone);
    const zoneSpeedMod = zoneConfig.speedMod;
    const effectiveSpeedMod = zoneSpeedMod * this.state.speedMultiplier;

    // Base speed decreases with length
    const lengthBasedSpeed = Math.max(
      MIN_TICK_MS,
      BASE_TICK_MS - Math.floor(this.state.snake.segments.length / 5) * 5,
    );

    // Apply speed modifier (lower speed = faster)
    this.state.speed = Math.max(MIN_TICK_MS, Math.round(effectiveSpeedMod * lengthBasedSpeed));

    // Restart tick timer with new speed
    if (this.tickTimer) {
      this.stopTickTimer();
      this.runTick();
    }
  }

  private checkZoneUnlocks(): void {
    const length = this.state.snake.segments.length;
    for (const zone of ZONES) {
      if (this.state.unlockedZones.includes(zone.id)) continue;
      if (length >= zone.unlockLength) {
        this.state.unlockedZones.push(zone.id);
        this.onEvent?.('zone_unlock', { zone: zone.id });
      }
    }
  }

  private checkExpiredFoods(): void {
    const now = Date.now();
    this.state.foods = this.state.foods.filter((food) => food.expireTime > now);
  }

  private checkPendingEffects(): void {
    const now = Date.now();

    for (const pending of this.state.pendingEffects) {
      if (pending.triggered) continue;

      if (!pending.warningShown && now >= pending.warningAt) {
        pending.warningShown = true;
        this.onEvent?.('pending_effect_warning', {
          type: pending.type,
          countdown: 3,
          sourceFood: pending.sourceFood,
        });
      }

      if (now >= pending.triggerAt) {
        pending.triggered = true;
        this.applyPendingEffect(pending);
      }
    }

    this.state.pendingEffects = this.state.pendingEffects.filter(
      (p) => !p.triggered || now < p.triggerAt + 10000,
    );
  }

  private applyPendingEffect(pending: PendingEffect): void {
    switch (pending.type) {
      case 'temporaryLength':
        this.applyTemporaryLength(pending.effect.value);
        break;
      case 'scorePenalty':
        this.state.score = Math.max(0, this.state.score - pending.effect.value);
        this.onEvent?.('effect_trigger', { type: 'scorePenalty', value: pending.effect.value });
        break;
      case 'reverseControls':
        this.state.reversedControls = true;
        this.state.activeEffects.push({
          type: 'reverseControls',
          remainingTicks: pending.effect.remainingTicks,
          value: 1,
        });
        this.onEvent?.('effect_trigger', { type: 'reverseControls' });
        break;
    }
  }

  private applyTemporaryLength(count: number): void {
    const tail = this.state.snake.segments[this.state.snake.segments.length - 1];
    for (let i = 0; i < count; i++) {
      this.state.snake.segments.push({ ...tail });
    }
    this.state.temporarySegments.push({ count, expiresAt: Date.now() + 20000 });
    this.onEvent?.('effect_trigger', { type: 'temporaryLength', count });
  }

  private checkTemporarySegments(): void {
    const now = Date.now();
    this.state.temporarySegments = this.state.temporarySegments.filter((batch) => {
      if (now >= batch.expiresAt) {
        const toRemove = Math.min(batch.count, this.state.snake.segments.length - 3);
        if (toRemove > 0) {
          this.state.snake.segments.splice(this.state.snake.segments.length - toRemove, toRemove);
        }
        this.onEvent?.('effect_end', { type: 'temporaryLength' });
        return false;
      }
      return true;
    });
  }

  private spawnFood(): void {
    while (this.state.foods.length < MIN_FOOD_TO_SPAWN) {
      this.addFood();
    }
    if (this.state.foods.length < MAX_FOOD_ON_SCREEN && Math.random() < FOOD_SPAWN_CHANCE) {
      this.addFood();
    }
  }

  private addFood(): void {
    const type = pickFoodType(this.state.currentZone, this.state.unlockedZones);
    // Pick zone based on 70% current zone, 30% random unlocked
    let zoneId: string | null = this.state.currentZone;
    if (Math.random() < 0.3 && this.state.unlockedZones.length > 1) {
      const others = this.state.unlockedZones.filter((z) => z !== this.state.currentZone);
      zoneId = others[Math.floor(Math.random() * others.length)];
    }
    const now = Date.now();
    const expireMs = (5000 + Math.random() * 5000); // 5-10 seconds
    this.state.foods.push({
      position: randomFoodPositionInZone(zoneId, this.state.snake.segments),
      type,
      spawnTime: now,
      expireTime: now + expireMs,
    });
  }

  private runTick(): void {
    this.tickTimer = setInterval(() => this.tick(), this.state.speed);
  }

  private stopTickTimer(): void {
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
  }

  private startDurationTimer(): void {
    this.durationTimer = setInterval(() => { this.state.duration += 100; }, 100);
  }

  private stopDurationTimer(): void {
    if (this.durationTimer) { clearInterval(this.durationTimer); this.durationTimer = null; }
  }

  private createInitialState(): GameState {
    const snake: SnakeState = { segments: [...INITIAL_SNAKE], direction: 'right' };
    return {
      snake,
      foods: [{ position: randomFoodPositionInZone('center', snake.segments), type: 'apple', spawnTime: Date.now(), expireTime: Date.now() + 10000 }],
      score: 0,
      status: 'idle',
      speed: BASE_TICK_MS,
      duration: 0,
      currentZone: 'center',
      unlockedZones: ['center'],
      collectedFoodTypes: [],
      activeEffects: [],
      pendingEffects: [],
      temporarySegments: [],
      combo: 0,
      lastEatTime: 0,
      speedMultiplier: 1,
      shieldActive: false,
      randomDirActive: false,
      reversedControls: false,
    };
  }

  private emit(): void { this.onStateChange?.(this.getState()); }

  destroy(): void { this.stopTickTimer(); this.stopDurationTimer(); }
}
