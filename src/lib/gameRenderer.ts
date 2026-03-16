import type { GameState, SnakeSegment, Food, Tumbleweed, DustParticle, Direction } from './gameTypes';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  CELL_SIZE,
  GRID_WIDTH,
  GRID_HEIGHT,
  COLOR_BG,
  COLOR_GRID,
  COLOR_SAND,
  COLOR_SNAKE_HEAD,
  COLOR_SNAKE_BODY,
  COLOR_SNAKE_PATTERN,
  COLOR_SNAKE_BELLY,
  COLOR_SNAKE_RATTLE,
  COLOR_SNAKE_EYE,
  COLOR_FOOD_RAT,
  COLOR_FOOD_SCORPION,
  COLOR_FOOD_FRUIT,
  COLOR_FOOD_GOLD,
  COLOR_DUST,
  COLOR_BLOOD_SUN,
  COLOR_HORIZON,
} from './gameConstants';

// --- Helper Functions ---

function drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size / 2);
  ctx.lineTo(x + size / 2, y);
  ctx.lineTo(x, y + size / 2);
  ctx.lineTo(x - size / 2, y);
  ctx.closePath();
  ctx.fill();
}

function drawTumbleweed(ctx: CanvasRenderingContext2D, tw: Tumbleweed) {
  ctx.save();
  ctx.translate(tw.x, tw.y);
  ctx.rotate(tw.rotation);
  ctx.strokeStyle = '#5a4a2e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // Simple chaotic scribble
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const r = tw.size * (0.8 + Math.random() * 0.4);
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawSnakeSegment(
  ctx: CanvasRenderingContext2D,
  seg: SnakeSegment,
  prev: SnakeSegment | null, // Previous segment in array (closer to head)
  next: SnakeSegment | null, // Next segment in array (closer to tail)
  isHead: boolean,
  isTail: boolean
) {
  const x = seg.x * CELL_SIZE;
  const y = seg.y * CELL_SIZE;

  // Body Base
  drawRect(ctx, x, y, CELL_SIZE, CELL_SIZE, COLOR_SNAKE_BODY);

  // Diamond Pattern (center)
  if (!isHead && !isTail) {
    drawDiamond(ctx, x + CELL_SIZE / 2, y + CELL_SIZE / 2, 8, COLOR_SNAKE_PATTERN);
  }

  // Head Logic
  if (isHead) {
    drawRect(ctx, x, y, CELL_SIZE, CELL_SIZE, COLOR_SNAKE_HEAD);
    
    // Eyes: Orient based on direction relative to body (next segment)
    // If next is right (x+1), head is facing left.
    // If next is left (x-1), head is facing right.
    // If next is down (y+1), head is facing up.
    // If next is up (y-1), head is facing down.
    
    let eye1x = x + 3, eye1y = y + 3;
    let eye2x = x + 11, eye2y = y + 3;
    let tongueDir = { x: 0, y: 0 };

    if (next) {
      if (next.x > seg.x) { // Facing Left
        eye1x = x + 3; eye1y = y + 3;
        eye2x = x + 3; eye2y = y + 11;
        tongueDir = { x: -1, y: 0 };
      } else if (next.x < seg.x) { // Facing Right
        eye1x = x + 11; eye1y = y + 3;
        eye2x = x + 11; eye2y = y + 11;
        tongueDir = { x: 1, y: 0 };
      } else if (next.y > seg.y) { // Facing Up
        eye1x = x + 3; eye1y = y + 3;
        eye2x = x + 11; eye2y = y + 3;
        tongueDir = { x: 0, y: -1 };
      } else if (next.y < seg.y) { // Facing Down
        eye1x = x + 3; eye1y = y + 11;
        eye2x = x + 11; eye2y = y + 11;
        tongueDir = { x: 0, y: 1 };
      }
    }

    drawRect(ctx, eye1x - 1, eye1y - 1, 3, 3, COLOR_SNAKE_EYE);
    drawRect(ctx, eye2x - 1, eye2y - 1, 3, 3, COLOR_SNAKE_EYE);

    // Tongue flick occasionally
    if (Math.random() < 0.1) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + CELL_SIZE/2, y + CELL_SIZE/2);
      ctx.lineTo(x + CELL_SIZE/2 + tongueDir.x * 12, y + CELL_SIZE/2 + tongueDir.y * 12);
      ctx.stroke();
    }
  }

  // Tail Rattle
  if (isTail) {
    drawRect(ctx, x + 4, y + 4, 8, 8, COLOR_SNAKE_RATTLE);
    // Detail bands
    ctx.fillStyle = '#b8860b'; // dark gold
    drawRect(ctx, x + 6, y + 4, 1, 8, '#b8860b');
    drawRect(ctx, x + 9, y + 4, 1, 8, '#b8860b');
  }
}

function drawFood(ctx: CanvasRenderingContext2D, food: Food, frame: number) {
  const cx = food.x * CELL_SIZE + CELL_SIZE / 2;
  const cy = food.y * CELL_SIZE + CELL_SIZE / 2;
  const pulse = Math.sin(frame * 0.1) * 2;

  switch (food.type) {
    case 'rat':
      // Brown body
      drawRect(ctx, cx - 4, cy - 2, 8, 5, COLOR_FOOD_RAT);
      // Pink tail
      ctx.fillStyle = '#ffb6c1';
      drawRect(ctx, cx + 4, cy, 4, 1, '#ffb6c1');
      // Black eye
      ctx.fillStyle = '#000';
      drawRect(ctx, cx - 2, cy - 1, 1, 1, '#000');
      break;
    case 'scorpion':
      // Red body
      drawCircle(ctx, cx, cy, 4, COLOR_FOOD_SCORPION);
      // Claws
      drawRect(ctx, cx - 6, cy - 4, 3, 3, COLOR_FOOD_SCORPION);
      drawRect(ctx, cx + 3, cy - 4, 3, 3, COLOR_FOOD_SCORPION);
      // Tail stinger
      drawRect(ctx, cx - 1, cy - 7 + pulse * 0.5, 2, 4, '#8b0000');
      break;
    case 'cactus_fruit':
      // Green prickly pear
      drawCircle(ctx, cx, cy, 5, COLOR_FOOD_FRUIT);
      // Pink flower
      drawCircle(ctx, cx, cy - 4, 2, '#ff69b4');
      break;
    case 'gold_nugget':
      ctx.shadowColor = COLOR_FOOD_GOLD;
      ctx.shadowBlur = 6 + pulse;
      drawRect(ctx, cx - 3, cy - 3, 7, 6, COLOR_FOOD_GOLD);
      ctx.shadowBlur = 0;
      // Sparkle
      if (Math.random() < 0.1) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - 4 + Math.random() * 8, cy - 4 + Math.random() * 8, 1, 1);
      }
      break;
  }
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, frame: number) {
  const shake = state.screenShake || 0;
  const shakeX = shake > 0 ? (Math.random() - 0.5) * shake * 2 : 0;
  const shakeY = shake > 0 ? (Math.random() - 0.5) * shake * 2 : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // 1. Background (Desert Gradient)
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, '#2c1e16'); // Dark brown sky
  gradient.addColorStop(0.4, '#4a3024'); // Lighter horizon
  gradient.addColorStop(0.4, '#1a0f0a'); // Ground horizon line (hard stop)
  gradient.addColorStop(1, '#0f0805'); // Dark ground foreground
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // 2. Apocalyptic Sun
  const sunY = GAME_HEIGHT * 0.35;
  ctx.fillStyle = COLOR_BLOOD_SUN;
  ctx.shadowColor = COLOR_HORIZON;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(GAME_WIDTH / 2, sunY, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 3. Grid Lines (Faint Overlay)
  ctx.strokeStyle = '#2a1a12';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  for (let x = 0; x <= GAME_WIDTH; x += CELL_SIZE) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GAME_HEIGHT);
  }
  for (let y = 0; y <= GAME_HEIGHT; y += CELL_SIZE) {
    ctx.moveTo(0, y);
    ctx.lineTo(GAME_WIDTH, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 4. Tumbleweeds
  state.tumbleweeds.forEach(tw => drawTumbleweed(ctx, tw));

  // 5. Food
  state.food.forEach(f => drawFood(ctx, f, frame));

  // 6. Snake
  state.snake.forEach((seg, i) => {
    const isHead = i === 0;
    const isTail = i === state.snake.length - 1;
    // previous = towards head (index - 1)
    const prev = i > 0 ? state.snake[i - 1] : null;
    // next = towards tail (index + 1)
    const next = i < state.snake.length - 1 ? state.snake[i + 1] : null;

    drawSnakeSegment(ctx, seg, prev, next, isHead, isTail);
  });

  // 7. Dust Particles
  state.dustParticles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1;

  // 8. HUD
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${state.score}`, 10, 20);

  ctx.textAlign = 'right';
  // Optional: show difficulty or speed
  // ctx.fillText(`SPEED ${10 - state.moveInterval}`, GAME_WIDTH - 10, 20);

  ctx.restore();
}
