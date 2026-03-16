// Canvas dimensions
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 400;

// Grid
export const CELL_SIZE = 16;
export const GRID_WIDTH = Math.floor(GAME_WIDTH / CELL_SIZE);   // 25
export const GRID_HEIGHT = Math.floor(GAME_HEIGHT / CELL_SIZE);  // 25

// Snake
export const INITIAL_SNAKE_LENGTH = 4;
export const INITIAL_MOVE_INTERVAL = 8; // ticks between moves (lower = faster)
export const MIN_MOVE_INTERVAL = 3;     // fastest speed
export const SPEED_UP_EVERY = 5;        // speed up every N food eaten

// Food
export const MAX_FOOD_ON_SCREEN = 2;
export const FOOD_SPAWN_CHANCE = 0.02;  // per tick when below max
export const SPECIAL_FOOD_CHANCE = 0.15; // chance of special food type
export const SPECIAL_FOOD_LIFETIME = 200; // ticks before special food despawns

// Scoring
export const SCORE_RAT = 10;
export const SCORE_SCORPION = 25;
export const SCORE_CACTUS_FRUIT = 15;
export const SCORE_GOLD_NUGGET = 50;

// Colors - Western Apocalypse palette
export const COLOR_BG = '#1a0f0a';           // Deep burnt earth
export const COLOR_GRID = '#2a1a12';          // Faint grid lines
export const COLOR_SAND = '#3d2b1f';          // Dark sand
export const COLOR_SNAKE_HEAD = '#c4813d';    // Dusty gold (rattlesnake head)
export const COLOR_SNAKE_BODY = '#8b6914';    // Dark rattlesnake tan
export const COLOR_SNAKE_PATTERN = '#5a4a2e'; // Diamond pattern dark
export const COLOR_SNAKE_BELLY = '#d4a854';   // Lighter underbelly
export const COLOR_SNAKE_RATTLE = '#f5d06e';  // Bright rattle
export const COLOR_SNAKE_EYE = '#ff3333';     // Menacing red eyes
export const COLOR_FOOD_RAT = '#8b7355';      // Desert rat brown
export const COLOR_FOOD_SCORPION = '#cc4444';  // Dangerous red
export const COLOR_FOOD_FRUIT = '#6b8e23';     // Cactus green
export const COLOR_FOOD_GOLD = '#ffd700';      // Gold nugget
export const COLOR_DUST = '#c4a882';           // Dust/sand particle
export const COLOR_BLOOD_SUN = '#8b0000';      // Horizon glow
export const COLOR_HORIZON = '#ff4500';        // Sunset orange

// Payment
export const PAYMENT_AMOUNT_SATS = 100;
export const PAYMENT_RECIPIENT = 'claw@primal.net';

// Nostr
export const GAME_SCORE_KIND = 1447;
export const GAME_TAG = 'citadel-snake';
