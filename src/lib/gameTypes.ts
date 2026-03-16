export interface Position {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface SnakeSegment {
  x: number;
  y: number;
}

export interface Food {
  x: number;
  y: number;
  type: 'rat' | 'scorpion' | 'cactus_fruit' | 'gold_nugget';
  points: number;
  /** Lifetime in ticks before despawning (only for special items) */
  lifetime: number;
}

export interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Tumbleweed {
  x: number;
  y: number;
  speed: number;
  size: number;
  rotation: number;
}

export interface GameState {
  snake: SnakeSegment[];
  direction: Direction;
  nextDirection: Direction;
  food: Food[];
  tumbleweeds: Tumbleweed[];
  dustParticles: DustParticle[];
  score: number;
  tickCount: number;
  gameOver: boolean;
  /** Current speed (ticks per movement) — lower = faster */
  moveInterval: number;
  lastMoveAt: number;
  screenShake: number;
  /** Grid dimensions */
  gridWidth: number;
  gridHeight: number;
}

export type GamePhase = 'idle' | 'paying' | 'ready' | 'playing' | 'gameOver';

export interface LeaderboardEntry {
  lightning: string;
  score: number;
  timestamp: number;
  eventId: string;
}

export interface WeeklyWinner {
  lightning: string;
  score: number;
  weekStart: number;
  weekEnd: number;
}
