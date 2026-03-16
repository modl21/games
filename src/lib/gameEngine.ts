import type { GameState, SnakeSegment, Food, Tumbleweed, DustParticle, Direction } from './gameTypes';
import {
  GRID_WIDTH,
  GRID_HEIGHT,
  INITIAL_SNAKE_LENGTH,
  INITIAL_MOVE_INTERVAL,
  MIN_MOVE_INTERVAL,
  SPEED_UP_EVERY,
  MAX_FOOD_ON_SCREEN,
  FOOD_SPAWN_CHANCE,
  SPECIAL_FOOD_CHANCE,
  SPECIAL_FOOD_LIFETIME,
  SCORE_RAT,
  SCORE_SCORPION,
  SCORE_CACTUS_FRUIT,
  SCORE_GOLD_NUGGET,
} from './gameConstants';

export function createInitialState(): GameState {
  const startX = Math.floor(GRID_WIDTH / 2);
  const startY = Math.floor(GRID_HEIGHT / 2);

  const snake: SnakeSegment[] = [];
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    snake.push({ x: startX - i, y: startY });
  }

  const state: GameState = {
    snake,
    direction: 'right',
    nextDirection: 'right',
    food: [],
    tumbleweeds: createTumbleweeds(),
    dustParticles: [],
    score: 0,
    tickCount: 0,
    gameOver: false,
    moveInterval: INITIAL_MOVE_INTERVAL,
    lastMoveAt: 0,
    screenShake: 0,
    gridWidth: GRID_WIDTH,
    gridHeight: GRID_HEIGHT,
  };

  // Spawn initial food
  spawnFood(state);

  return state;
}

function createTumbleweeds(): Tumbleweed[] {
  const weeds: Tumbleweed[] = [];
  for (let i = 0; i < 3; i++) {
    weeds.push({
      x: Math.random() * GRID_WIDTH * 16,
      y: Math.random() * GRID_HEIGHT * 16,
      speed: Math.random() * 0.3 + 0.1,
      size: Math.random() * 6 + 4,
      rotation: Math.random() * Math.PI * 2,
    });
  }
  return weeds;
}

function isOccupied(x: number, y: number, snake: SnakeSegment[], food: Food[]): boolean {
  for (const seg of snake) {
    if (seg.x === x && seg.y === y) return true;
  }
  for (const f of food) {
    if (f.x === x && f.y === y) return true;
  }
  return false;
}

function getRandomEmptyCell(snake: SnakeSegment[], food: Food[]): { x: number; y: number } | null {
  // Margin of 1 from walls
  const attempts = 100;
  for (let i = 0; i < attempts; i++) {
    const x = Math.floor(Math.random() * (GRID_WIDTH - 2)) + 1;
    const y = Math.floor(Math.random() * (GRID_HEIGHT - 2)) + 1;
    if (!isOccupied(x, y, snake, food)) {
      return { x, y };
    }
  }
  return null;
}

function spawnFood(state: GameState): void {
  if (state.food.length >= MAX_FOOD_ON_SCREEN) return;

  const pos = getRandomEmptyCell(state.snake, state.food);
  if (!pos) return;

  const isSpecial = Math.random() < SPECIAL_FOOD_CHANCE;

  if (isSpecial) {
    const roll = Math.random();
    if (roll < 0.4) {
      state.food.push({ ...pos, type: 'scorpion', points: SCORE_SCORPION, lifetime: SPECIAL_FOOD_LIFETIME });
    } else if (roll < 0.7) {
      state.food.push({ ...pos, type: 'cactus_fruit', points: SCORE_CACTUS_FRUIT, lifetime: SPECIAL_FOOD_LIFETIME });
    } else {
      state.food.push({ ...pos, type: 'gold_nugget', points: SCORE_GOLD_NUGGET, lifetime: SPECIAL_FOOD_LIFETIME });
    }
  } else {
    state.food.push({ ...pos, type: 'rat', points: SCORE_RAT, lifetime: -1 }); // rats don't despawn
  }
}

function createDustExplosion(x: number, y: number, color: string): DustParticle[] {
  const particles: DustParticle[] = [];
  const count = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = Math.random() * 2 + 0.5;
    particles.push({
      x: x * 16 + 8,
      y: y * 16 + 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color,
      size: Math.random() * 3 + 1,
    });
  }
  return particles;
}

function oppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case 'up': return 'down';
    case 'down': return 'up';
    case 'left': return 'right';
    case 'right': return 'left';
  }
}

export function changeDirection(state: GameState, newDir: Direction): GameState {
  // Prevent reversing into yourself
  if (newDir === oppositeDirection(state.direction)) {
    return state;
  }
  return { ...state, nextDirection: newDir };
}

export function updateGame(state: GameState): GameState {
  if (state.gameOver) return state;

  const newState = { ...state };
  newState.tickCount = state.tickCount + 1;

  // Update tumbleweeds
  newState.tumbleweeds = state.tumbleweeds.map((tw) => ({
    ...tw,
    x: (tw.x + tw.speed) % (GRID_WIDTH * 16 + 40) - 20,
    rotation: tw.rotation + tw.speed * 0.05,
  }));

  // Update dust particles
  newState.dustParticles = state.dustParticles
    .map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      life: p.life - 0.04,
      vy: p.vy + 0.01,
    }))
    .filter((p) => p.life > 0);

  // Reduce screen shake
  newState.screenShake = Math.max(0, (state.screenShake || 0) - 0.5);

  // Update food lifetimes (despawn specials)
  newState.food = state.food
    .map((f) => (f.lifetime > 0 ? { ...f, lifetime: f.lifetime - 1 } : f))
    .filter((f) => f.lifetime !== 0);

  // Check if it's time to move the snake
  if (newState.tickCount - state.lastMoveAt < state.moveInterval) {
    return newState;
  }

  newState.lastMoveAt = newState.tickCount;

  // Apply direction change
  newState.direction = state.nextDirection;

  // Calculate new head position
  const head = state.snake[0];
  let newX = head.x;
  let newY = head.y;

  switch (newState.direction) {
    case 'up': newY -= 1; break;
    case 'down': newY += 1; break;
    case 'left': newX -= 1; break;
    case 'right': newX += 1; break;
  }

  // Check wall collision
  if (newX < 0 || newX >= GRID_WIDTH || newY < 0 || newY >= GRID_HEIGHT) {
    newState.gameOver = true;
    newState.dustParticles = [
      ...newState.dustParticles,
      ...createDustExplosion(head.x, head.y, '#c4813d'),
      ...createDustExplosion(head.x, head.y, '#ff4500'),
    ];
    newState.screenShake = 8;
    return newState;
  }

  // Check self collision
  for (let i = 0; i < state.snake.length; i++) {
    if (state.snake[i].x === newX && state.snake[i].y === newY) {
      newState.gameOver = true;
      newState.dustParticles = [
        ...newState.dustParticles,
        ...createDustExplosion(head.x, head.y, '#c4813d'),
        ...createDustExplosion(head.x, head.y, '#8b0000'),
      ];
      newState.screenShake = 8;
      return newState;
    }
  }

  // Move snake
  const newHead: SnakeSegment = { x: newX, y: newY };
  const newSnake = [newHead, ...state.snake];

  // Check food collision
  let ate = false;
  let scoreGain = 0;
  const remainingFood: Food[] = [];

  for (const f of newState.food) {
    if (f.x === newX && f.y === newY) {
      ate = true;
      scoreGain += f.points;
      // Create dust particles where food was
      const foodColors: Record<string, string> = {
        rat: '#8b7355',
        scorpion: '#cc4444',
        cactus_fruit: '#6b8e23',
        gold_nugget: '#ffd700',
      };
      newState.dustParticles = [
        ...newState.dustParticles,
        ...createDustExplosion(f.x, f.y, foodColors[f.type] || '#c4a882'),
      ];
      newState.screenShake = 2;
    } else {
      remainingFood.push(f);
    }
  }

  newState.food = remainingFood;
  newState.score = state.score + scoreGain;

  // If we didn't eat, remove the tail (standard snake behavior)
  if (!ate) {
    newSnake.pop();
  } else {
    // Speed up
    const totalEaten = newSnake.length - INITIAL_SNAKE_LENGTH;
    const speedUps = Math.floor(totalEaten / SPEED_UP_EVERY);
    newState.moveInterval = Math.max(MIN_MOVE_INTERVAL, INITIAL_MOVE_INTERVAL - speedUps);
  }

  newState.snake = newSnake;

  // Spawn new food
  if (Math.random() < FOOD_SPAWN_CHANCE || newState.food.length === 0) {
    spawnFood(newState);
  }

  return newState;
}
