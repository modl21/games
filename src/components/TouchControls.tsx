// Ensure TouchControls is written (I might have mixed it up in previous tool calls) but the previous write seemed successful.
// No content change needed for TouchControls unless logic was wrong.
import { useCallback, useRef } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Crosshair } from 'lucide-react';
import type { Direction } from '@/lib/gameTypes';

interface TouchControlsProps {
  keysRef: React.MutableRefObject<Direction | null>;
}

export function TouchControls({ keysRef }: TouchControlsProps) {
  // We use ref to avoid re-renders while touching
  const touchInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTurning = useCallback((dir: Direction) => {
    // Set direction immediately
    keysRef.current = dir;
    
    // Optional: could allow holding to keep turning, but Snake turns once per block usually.
    // So just setting it once is enough if GameCanvas clears it after use.
  }, [keysRef]);

  const handleTouchStart = (dir: Direction) => (e: React.TouchEvent) => {
    e.preventDefault(); // prevent scroll/zoom
    startTurning(dir);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pb-8 pt-4 select-none bg-gradient-to-t from-black via-black/80 to-transparent"
      style={{ touchAction: 'none' }}
    >
      <div className="grid grid-cols-3 gap-3">
        {/* Row 1 */}
        <div />
        <button
          onTouchStart={handleTouchStart('up')}
          className="size-20 rounded-2xl bg-orange-950/60 border-2 border-orange-800/60 active:bg-orange-700/60 active:scale-95 transition-transform flex items-center justify-center shadow-lg shadow-orange-900/20"
          aria-label="Up"
        >
          <ChevronUp className="size-10 text-orange-200" />
        </button>
        <div />

        {/* Row 2 */}
        <button
          onTouchStart={handleTouchStart('left')}
          className="size-20 rounded-2xl bg-orange-950/60 border-2 border-orange-800/60 active:bg-orange-700/60 active:scale-95 transition-transform flex items-center justify-center shadow-lg shadow-orange-900/20"
          aria-label="Left"
        >
          <ChevronLeft className="size-10 text-orange-200" />
        </button>
        
        {/* Center decorative */}
        <div className="size-20 flex items-center justify-center">
          <div className="size-8 rounded-full bg-orange-900/20 border border-orange-800/30 flex items-center justify-center">
            <Crosshair className="size-4 text-orange-800/40" />
          </div>
        </div>

        <button
          onTouchStart={handleTouchStart('right')}
          className="size-20 rounded-2xl bg-orange-950/60 border-2 border-orange-800/60 active:bg-orange-700/60 active:scale-95 transition-transform flex items-center justify-center shadow-lg shadow-orange-900/20"
          aria-label="Right"
        >
          <ChevronRight className="size-10 text-orange-200" />
        </button>

        {/* Row 3 */}
        <div />
        <button
          onTouchStart={handleTouchStart('down')}
          className="size-20 rounded-2xl bg-orange-950/60 border-2 border-orange-800/60 active:bg-orange-700/60 active:scale-95 transition-transform flex items-center justify-center shadow-lg shadow-orange-900/20"
          aria-label="Down"
        >
          <ChevronDown className="size-10 text-orange-200" />
        </button>
        <div />
      </div>
    </div>
  );
}
