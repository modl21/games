import { useRef } from 'react';
import { Skull, RotateCcw, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface GameOverOverlayProps {
  score: number;
  isPublishing: boolean;
  onPlayAgain: () => void;
}

export function GameOverOverlay({ score, isPublishing, onPlayAgain }: GameOverOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80 backdrop-blur-sm rounded-lg border-2 border-[#8b4513]">
      <div className="text-center space-y-6 p-8 relative overflow-hidden w-full h-full flex flex-col items-center justify-center">
        {/* Background texture effect */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none" />

        <div className="relative z-10 space-y-2 animate-float">
          <Skull className="size-16 text-[#ef4444] mx-auto animate-pulse" />
          <h2 className="font-pixel text-2xl text-[#ef4444] tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            YOU DIED
          </h2>
          <p className="text-[#c4a882] text-xs font-pixel tracking-widest uppercase opacity-80">
            Lost to the sands
          </p>
        </div>

        <div className="space-y-1 py-4 border-y border-[#8b4513]/30 w-full bg-black/20">
          <p className="text-[10px] text-[#8b4513] font-pixel tracking-wider uppercase">BOUNTY COLLECTED</p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-pixel text-4xl text-[#ffd700] tabular-nums drop-shadow-md">
              {score.toLocaleString()}
            </span>
          </div>
        </div>

        {isPublishing && (
          <div className="flex items-center justify-center gap-2 text-[#c4a882] animate-pulse">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-[10px] font-pixel">ETCHING NAME IN STONE...</span>
          </div>
        )}

        <Button
          onClick={onPlayAgain}
          className="bg-[#ad3e1b] text-[#ffe4b5] border-2 border-[#8b4513] font-pixel text-xs hover:bg-[#8b4513] hover:text-white h-14 px-8 shadow-[0_4px_0_#5a2e0e] active:shadow-none active:translate-y-[4px] transition-all"
        >
          <RotateCcw className="size-4 mr-2" />
          TRY AGAIN (100 SATS)
        </Button>
      </div>
    </div>
  );
}
