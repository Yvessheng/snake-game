export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  score: number;
  snakeLength: number;
  gameDuration: number;
  totalGames: number;
  rank: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: 'first_game', name: '首次游戏', description: '完成第一次游戏', check: (s) => s.totalGames >= 1 },
  { key: 'first_100', name: '百分达人', description: '单次得分达到100', check: (s) => s.score >= 100 },
  { key: 'first_500', name: '半千高手', description: '单次得分达到500', check: (s) => s.score >= 500 },
  { key: 'master_1000', name: '千分大师', description: '单次得分达到1000', check: (s) => s.score >= 1000 },
  { key: 'legend_5000', name: '传说玩家', description: '单次得分达到5000', check: (s) => s.score >= 5000 },
  { key: 'length_50', name: '蛇长百尺', description: '蛇长度达到50', check: (s) => s.snakeLength >= 50 },
  { key: 'length_100', name: '巨蛇传说', description: '蛇长度达到100', check: (s) => s.snakeLength >= 100 },
  { key: 'duration_5m', name: '持久战士', description: '游戏时长超过5分钟', check: (s) => s.gameDuration >= 300_000 },
  { key: 'duration_10m', name: '耐力王者', description: '游戏时长超过10分钟', check: (s) => s.gameDuration >= 600_000 },
  { key: 'games_10', name: '初出茅庐', description: '累计游戏10次', check: (s) => s.totalGames >= 10 },
  { key: 'games_50', name: '身经百战', description: '累计游戏50次', check: (s) => s.totalGames >= 50 },
  { key: 'games_100', name: '百炼成钢', description: '累计游戏100次', check: (s) => s.totalGames >= 100 },
  { key: 'top_10', name: '榜上有名', description: '排名进入Top10', check: (s) => s.rank <= 10 },
  { key: 'top_3', name: '三甲之列', description: '排名进入Top3', check: (s) => s.rank <= 3 },
  { key: 'champion', name: '冠军宝座', description: '排名达到#1', check: (s) => s.rank === 1 },
];
