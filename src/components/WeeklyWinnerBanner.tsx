import { Crown, Zap } from 'lucide-react';

import { usePreviousWeekWinner } from '@/hooks/useLeaderboard';

export function WeeklyWinnerBanner() {
  const { data: winner } = usePreviousWeekWinner();

  if (!winner) return null;

  return (
    <div className="w-full max-w-md mx-auto mb-4">
      <div className="relative overflow-hidden rounded-md border border-[#c4813d]/40 bg-gradient-to-r from-[#8b4513]/20 via-[#c4813d]/10 to-[#8b4513]/20 px-4 py-3 shadow-[0_0_10px_rgba(196,129,61,0.1)]">
        {/* Animated shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffd700]/5 to-transparent animate-pulse-glow pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center size-8 rounded-full bg-[#c4813d]/20 border border-[#c4813d]/30">
            <Crown className="size-4 text-[#ffd700]" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-pixel text-[8px] text-[#c4813d] tracking-widest uppercase">
              WASTELAND CHAMPION
            </p>
            <p className="text-sm text-[#eecfa1] truncate mt-0.5 font-bold tracking-wide">
              {winner.lightning}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0 bg-[#0a0502]/40 rounded px-2 py-1 border border-[#8b4513]/30">
            <Zap className="size-3 text-[#ffd700] fill-[#ffd700]" />
            <span className="font-pixel text-[10px] text-[#ffd700] tabular-nums tracking-widest">
              {winner.score.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
