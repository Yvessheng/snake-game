// Game Type Definitions - Extended with Zones and Multi-Food System

export type Direction = 'up' | 'down' | 'left' | 'right';
export type GameStatus = 'idle' | 'running' | 'paused' | 'gameover';

export interface Position {
  x: number;
  y: number;
}

export interface SnakeState {
  segments: Position[];
  direction: Direction;
}

// --- Food Types ---

export type FoodTypeId = 'apple' | 'berry' | 'nut' | 'mushroom' | 'cactus' | 'chili';

export type FoodEffectType = 'none' | 'speedBoost' | 'shield' | 'randomDir';

export interface FoodTypeConfig {
  id: FoodTypeId;
  name: string;
  icon: string;
  score: number;
  lengthGrowth: number;
  color: string;
  effect: FoodEffectType;
  effectDuration: number;
  weight: number;
  availableZones: string[];
}

export interface FoodState {
  position: Position;
  type: FoodTypeId;
}

// --- Active Effects ---

export interface ActiveEffect {
  type: FoodEffectType;
  remainingTicks: number;
  value: number;
}

// --- Zone System ---

export type ZoneId = 'center' | 'forest' | 'desert' | 'lava';

export interface ZoneBounds {
  minX: number; minY: number;
  maxX: number; maxY: number;
}

export interface ZoneConfig {
  id: ZoneId;
  name: string;
  bounds: ZoneBounds;
  bgColor: string;
  borderColor: string;
  speedMod: number;
  scoreMultiplier: number;
  unlockLength: number;
  description: string;
}

// --- Game State ---

export interface GameState {
  snake: SnakeState;
  foods: FoodState[];
  score: number;
  status: GameStatus;
  speed: number;
  duration: number;
  currentZone: ZoneId;
  unlockedZones: ZoneId[];
  collectedFoodTypes: FoodTypeId[];
  activeEffects: ActiveEffect[];
  combo: number;
  lastEatTime: number;
  speedMultiplier: number;
  shieldActive: boolean;
  randomDirActive: boolean;
}

// --- Constants ---

export const GRID_SIZE = 15;
export const GRID_COUNT = 40;
export const CANVAS_SIZE = GRID_COUNT * GRID_SIZE;

export const BASE_TICK_MS = 120;
export const MIN_TICK_MS = 50;

export const COMBO_TIMEOUT_MS = 5000;
export const COMBO_BONUS = 5;

export const MAX_FOOD_ON_SCREEN = 5;
export const MIN_FOOD_TO_SPAWN = 3;
export const FOOD_SPAWN_CHANCE = 0.1;

// Zone definitions
export const ZONES: ZoneConfig[] = [
  {
    id: 'center', name: '中心区',
    bounds: { minX: 10, minY: 10, maxX: 30, maxY: 30 },
    bgColor: '#8899AA', borderColor: '#AABBCC',
    speedMod: 1.0, scoreMultiplier: 1.0, unlockLength: 1,
    description: '安全区域',
  },
  {
    id: 'forest', name: '森林区',
    bounds: { minX: 5, minY: 5, maxX: 35, maxY: 35 },
    bgColor: '#779977', borderColor: '#88AA88',
    speedMod: 0.95, scoreMultiplier: 1.2, unlockLength: 8,
    description: '速度-5%',
  },
  {
    id: 'desert', name: '沙漠区',
    bounds: { minX: 0, minY: 0, maxX: 39, maxY: 39 },
    bgColor: '#AA9966', borderColor: '#BBAA77',
    speedMod: 0.9, scoreMultiplier: 1.5, unlockLength: 15,
    description: '速度-10%',
  },
  {
    id: 'lava', name: '熔岩区',
    bounds: { minX: 0, minY: 0, maxX: 39, maxY: 39 },
    bgColor: '#994444', borderColor: '#AA5555',
    speedMod: 1.0, scoreMultiplier: 2.0, unlockLength: 25,
    description: '高风险高回报',
  },
];

// Food type definitions
export const FOOD_TYPES: FoodTypeConfig[] = [
  { id: 'apple', name: '苹果', icon: '🍎', score: 10, lengthGrowth: 1, color: '#CC3333', effect: 'none', effectDuration: 0, weight: 40, availableZones: ['center', 'forest', 'desert', 'lava'] },
  { id: 'berry', name: '双生莓', icon: '🫐', score: 20, lengthGrowth: 2, color: '#6633CC', effect: 'none', effectDuration: 0, weight: 20, availableZones: ['center', 'forest', 'desert', 'lava'] },
  { id: 'nut', name: '经验坚果', icon: '🌰', score: 30, lengthGrowth: 3, color: '#886633', effect: 'speedBoost', effectDuration: 42, weight: 15, availableZones: ['forest', 'desert', 'lava'] },
  { id: 'mushroom', name: '治疗蘑菇', icon: '🍄', score: 20, lengthGrowth: 2, color: '#CC6699', effect: 'shield', effectDuration: 0, weight: 10, availableZones: ['forest', 'desert', 'lava'] },
  { id: 'cactus', name: '仙人掌果', icon: '🌵', score: 30, lengthGrowth: 3, color: '#33AA33', effect: 'randomDir', effectDuration: 33, weight: 8, availableZones: ['desert', 'lava'] },
  { id: 'chili', name: '火焰辣椒', icon: '🌶️', score: 10, lengthGrowth: 1, color: '#CC6600', effect: 'speedBoost', effectDuration: 25, weight: 7, availableZones: ['lava'] },
];

// --- Helper Functions ---

export function getFoodConfig(type: FoodTypeId): FoodTypeConfig {
  return FOOD_TYPES.find((f) => f.id === type) ?? FOOD_TYPES[0];
}

export function getZoneConfig(id: ZoneId): ZoneConfig {
  return ZONES.find((z) => z.id === id) ?? ZONES[0];
}

export function getZoneForPosition(pos: Position, unlockedZones: ZoneId[]): ZoneId {
  const ordered = [...ZONES].reverse();
  for (const zone of ordered) {
    if (!unlockedZones.includes(zone.id)) continue;
    if (pos.x >= zone.bounds.minX && pos.x <= zone.bounds.maxX &&
        pos.y >= zone.bounds.minY && pos.y <= zone.bounds.maxY) {
      return zone.id;
    }
  }
  return 'center';
}

export function getFoodScore(type: FoodTypeId, combo: number, zoneMultiplier: number): number {
  const config = getFoodConfig(type);
  const comboBonus = Math.max(0, combo - 1) * COMBO_BONUS;
  return Math.round((config.score + comboBonus) * zoneMultiplier);
}

export function getFoodGrowth(type: FoodTypeId): number {
  return getFoodConfig(type).lengthGrowth;
}

export function oppositeDirection(dir: Direction): Direction {
  const map: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };
  return map[dir];
}
