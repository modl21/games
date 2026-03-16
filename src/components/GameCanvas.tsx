// Fix GameCanvas.tsx logic: keysRef check logic was clearing it too agressively or not correctly.
// Also update TouchControls logic.
import { useRef, useEffect, useCallback, useState } from 'react';

import { createInitialState, updateGame, changeDirection } from '@/lib/gameEngine';
import { renderGame } from '@/lib/gameRenderer';
import { GAME_WIDTH, GAME_HEIGHT } from '@/lib/gameConstants';
import type { GameState, Direction } from '@/lib/gameTypes';

interface GameCanvasProps {
  onGameOver: (score: number) => void;
  isPlaying: boolean;
  isMobile: boolean;
  /** Shared ref so external touch controls can drive input */
  keysRef: React.MutableRefObject<Direction | null>;
}

export function GameCanvas({ onGameOver, isPlaying, isMobile, keysRef }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>(createInitialState());
  const frameRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const gameOverCalledRef = useRef(false);
  const [canvasScale, setCanvasScale] = useState(1);

  // Calculate scale to fit screen
  useEffect(() => {
    function handleResize() {
      // Base game is 400x400
      const maxW = Math.min(window.innerWidth - 32, 600);
      const reserveBottom = isMobile ? 320 : 60; // MORE space for touch controls
      const reserveTop = 100;

      const availH = window.innerHeight - reserveTop - reserveBottom;
      
      const scaleW = maxW / GAME_WIDTH;
      const scaleH = availH / GAME_HEIGHT;
      
      let scale = Math.min(scaleW, scaleH);
      if (scale < 0.5) scale = 0.5;
      
      // On desktop, limit max size
      if (!isMobile && scale > 1.5) scale = 1.5;

      setCanvasScale(scale);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // Reset game function
  const resetGame = useCallback(() => {
    if (isPlaying) {
      gameStateRef.current = createInitialState();
      gameOverCalledRef.current = false;
      keysRef.current = null;
    }
  }, [isPlaying, keysRef]);

  // Initial reset
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Keyboard controls
  useEffect(() => {
    if (!isPlaying) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Prevent default scrolling for arrows
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      let newDir: Direction | null = null;
      if (e.key === 'ArrowUp' || e.key === 'w') newDir = 'up';
      if (e.key === 'ArrowDown' || e.key === 's') newDir = 'down';
      if (e.key === 'ArrowLeft' || e.key === 'a') newDir = 'left';
      if (e.key === 'ArrowRight' || e.key === 'd') newDir = 'right';

      if (newDir) {
        // Apply direction immediately to current state
        gameStateRef.current = changeDirection(gameStateRef.current, newDir);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Game Loop
  const gameLoop = useCallback(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check touch controls once per frame
    if (keysRef.current) {
      gameStateRef.current = changeDirection(gameStateRef.current, keysRef.current);
      // Clear specific key press to avoid spam (though changeDirection handles invalid moves)
      keysRef.current = null; 
    }

    const state = gameStateRef.current;

    if (!state.gameOver) {
      gameStateRef.current = updateGame(state);
    } else if (!gameOverCalledRef.current) {
      gameOverCalledRef.current = true;
      onGameOver(state.score);
    }

    frameRef.current++;
    renderGame(ctx, gameStateRef.current, frameRef.current);

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, onGameOver, keysRef]);

  // Start/Stop Loop
  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, gameLoop]);

  // Idle Animation Loop (only when NOT playing)
  useEffect(() => {
    if (isPlaying) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    // We keep a consistent idle state so tumbleweeds don't reset every frame
    let idleState = createInitialState(); 
    let idleAnimRequest: number;

    function animateIdle() {
      frame++;
      
      // Animate background elements
      idleState = {
        ...idleState,
        tickCount: frame,
        screenShake: Math.sin(frame * 0.005) * 1.5,
        tumbleweeds: idleState.tumbleweeds.map((tw) => ({
            ...tw,
            x: (tw.x + tw.speed) % (GAME_WIDTH * 16 + 100) - 50,
            rotation: tw.rotation + tw.speed * 0.05,
        }))
      };

      if (!isPlaying) {
        renderGame(ctx!, idleState, frame);
        idleAnimRequest = requestAnimationFrame(animateIdle);
      }
    }

    idleAnimRequest = requestAnimationFrame(animateIdle);
    return () => cancelAnimationFrame(idleAnimRequest);
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="block mx-auto rounded-lg shadow-[0_0_40px_rgba(255,69,0,0.15)] border-4 border-[#3d2b1f] bg-[#1a0f0a]"
      style={{
        width: `${GAME_WIDTH * canvasScale}px`,
        height: `${GAME_HEIGHT * canvasScale}px`,
        imageRendering: 'pixelated',
      }}
    />
  );
}
