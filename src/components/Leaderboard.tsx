import { Trophy, Clock, Zap, ExternalLink, Skull } from 'lucide-react';

import { useCurrentWeekLeaderboard } from '@/hooks/useLeaderboard';
import { useNip05 } from '@/hooks/useNip05';
import { getTimeUntilReset } from '@/lib/weekUtils';
import { Skeleton } from '@/components/ui/skeleton';
import type { LeaderboardEntry } from '@/lib/gameTypes';

export function Leaderboard() {
  const { data: entries, isLoading } = useCurrentWeekLeaderboard();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="border border-[#8b4513]/40 rounded-sm bg-[#1a0f0a]/80 backdrop-blur overflow-hidden relative shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#8b4513]/30 flex items-center justify-between bg-[#2c1e16]/50">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-[#ffd700]" />
            <h2 className="font-pixel text-[10px] text-[#eecfa1] tracking-widest uppercase">TOP BOUNTIES</h2>
          </div>
          <div className="flex items-center gap-1.5 text-[#8b6914] font-pixel text-[10px]">
            <Clock className="size-3" />
            <span className="tracking-wider">
              {getTimeUntilReset()}
            </span>
          </div>
        </div>

        {/* Entries */}
        <div className="divide-y divide-[#8b4513]/20">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <Skeleton className="w-5 h-4 bg-[#3d2b1f]" />
                <Skeleton className="flex-1 h-4 bg-[#3d2b1f]" />
                <Skeleton className="w-16 h-4 bg-[#3d2b1f]" />
              </div>
            ))
          ) : entries && entries.length > 0 ? (
            entries.map((entry, i) => (
              <LeaderboardRow key={entry.eventId} entry={entry} rank={i} />
            ))
          ) : (
            <div className="px-4 py-8 text-center space-y-2">
              <Skull className="size-6 text-[#8b4513]/40 mx-auto" />
              <p className="text-[#8b6914] text-xs font-pixel uppercase tracking-wide">ZERO SURVIVORS</p>
              <p className="text-[#8b6914]/60 text-[10px]">Will you serve the first bounty?</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const { data: nip05 } = useNip05(entry.lightning);

  const rankColor =
    rank === 0 ? 'text-[#ffd700]' :
    rank === 1 ? 'text-[#c0c0c0]' :
    rank === 2 ? 'text-[#cd7f32]' :
    'text-[#8b6914]';

  return (
    <div className={`px-4 py-2.5 flex items-center gap-3 transition-colors ${rank === 0 ? 'bg-[#ffd700]/5' : 'hover:bg-[#3d2b1f]/30'}`}>
      <span className={`font-pixel text-[10px] w-5 text-center shrink-0 ${rankColor}`}>
        {rank + 1}
      </span>

      <div className="flex-1 min-w-0">
        {nip05 ? (
          <a
            href={`https://primal.net/p/${nip05.npub}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 group min-w-0"
          >
            <span className="text-sm text-[#c4813d] truncate group-hover:underline underline-offset-2 font-pixel tracking-wide">
              {entry.lightning}
            </span>
            <ExternalLink className="size-3 text-[#8b4513]/50 shrink-0 group-hover:text-[#c4813d] transition-colors" />
          </a>
        ) : (
          <span className="text-sm text-[#9ca3af] truncate block font-pixel tracking-wide">
            {entry.lightning}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Zap className="size-3 text-[#ffd700] fill-[#ffd700]" />
        <span className="font-pixel text-[10px] text-[#ffd700] tabular-nums tracking-widest">
          {entry.score.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
