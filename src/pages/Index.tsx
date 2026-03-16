import { useState, useCallback, useRef, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Zap, Gamepad2, Smartphone, Keyboard, Play, Skull } from 'lucide-react';
import type { NSecSigner } from '@nostrify/nostrify';

import { Button } from '@/components/ui/button';
import { GameCanvas } from '@/components/GameCanvas';
import { TouchControls } from '@/components/TouchControls';
import { PaymentGate } from '@/components/PaymentGate';
import { Leaderboard } from '@/components/Leaderboard';
import { WeeklyWinnerBanner } from '@/components/WeeklyWinnerBanner';
import { GameOverOverlay } from '@/components/GameOverOverlay';
import { usePublishScore } from '@/hooks/usePublishScore';
import { useAllTimePlayCount } from '@/hooks/useLeaderboard';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { GamePhase, Direction } from '@/lib/gameTypes';
import type { GameInvoice } from '@/lib/lightning';

const Index = () => {
  useSeoMeta({
    title: 'Sats Rattler - Pay Sats. Eat Rats. Survive the Wasteland.',
    description: 'A post-apocalyptic western snake game powered by Bitcoin Lightning. Pay 100 sats for one life, grow your rattlesnake, and claim glory on the Nostr-powered leaderboard.',
    ogTitle: 'Sats Rattler',
    ogDescription: '100 Sats. One Life. Weekly Leaderboard.',
    // ogImage is set in index.html, but we can override if needed
    ogType: 'website',
    ogSiteName: 'Sats Rattler',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Sats Rattler', 
    twitterDescription: '100 Sats. One Life. Weekly Leaderboard.',
  });

  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [showPayment, setShowPayment] = useState(false);
  const [lightningAddress, setLightningAddress] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const signerRef = useRef<NSecSigner | null>(null);
  
  // Changed keysRef to store Direction or null
  const keysRef = useRef<Direction | null>(null);
  
  const { mutateAsync: publishScore, isPending: isPublishing } = usePublishScore();
  const { data: allTimePlayCount } = useAllTimePlayCount();

  const handleStartGame = useCallback(() => {
    setShowPayment(true);
  }, []);

  const handlePaid = useCallback((address: string, gameInvoice: GameInvoice) => {
    setLightningAddress(address);
    setShowPayment(false);
    setPhase('ready');
    signerRef.current = gameInvoice.signer;
  }, []);

  const handleLaunchGame = useCallback(() => {
    setPhase('playing');
  }, []);

  // Allow keyboard start from READY screen with Space / Enter
  useEffect(() => {
    if (phase !== 'ready') return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleLaunchGame();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, handleLaunchGame]);

  const handleGameOver = useCallback(async (score: number) => {
    setFinalScore(score);
    setPhase('gameOver');

    if (signerRef.current && lightningAddress) {
      try {
        await publishScore({
          score,
          lightning: lightningAddress,
          signer: signerRef.current,
        });
      } catch (error) {
        console.error('Failed to publish score:', error);
      }
    }
  }, [lightningAddress, publishScore]);

  const handlePlayAgain = useCallback(() => {
    setPhase('idle');
    setFinalScore(0);
    setShowPayment(true);
  }, []);

  return (
    <div className="min-h-full bg-[#0a0502] text-[#eecfa1] overflow-y-auto font-sans selection:bg-[#8b4513] selection:text-white">
      {/* Texture overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      {/* Scanline overlay (subtle) */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.02]">
        <div className="w-full h-[200%] bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(255,200,100,0.05)_2px,rgba(255,200,100,0.05)_4px)] animate-scanline" />
      </div>

      <div className="relative z-10 flex flex-col items-center min-h-full px-4 py-6 gap-6">
        {/* Header */}
        <header className="w-full max-w-lg flex flex-col sm:flex-row items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <Skull className="size-5 text-[#8b4513]" />
            <span className="text-xs font-[900] tracking-[0.2em] text-[#8b4513] uppercase">
              CITADEL WASTELAND
            </span>
          </div>

          <a
            href="https://primal.net/odell"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b4513]/60 hover:text-[#c4813d] transition-colors"
          >
            CURATED BY ODELL
          </a>
        </header>

        {/* Weekly Winner Banner */}
        <WeeklyWinnerBanner />

        {/* Title */}
        <div className="text-center space-y-2 relative">
          <h1 className="font-pixel text-3xl md:text-4xl text-[#c4813d] tracking-widest drop-shadow-[2px_2px_0_#3d2b1f] animate-float">
            SATS RATTLER
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#8b4513] max-w-xs mx-auto font-bold">
            Pay sats. Eat rats. Survive.
          </p>
        </div>

        {/* Game Area */}
        <div className="relative">
          <GameCanvas
            onGameOver={handleGameOver}
            isPlaying={phase === 'playing'}
            isMobile={isMobile}
            keysRef={keysRef}
          />

          {/* Idle overlay */}
          {phase === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 backdrop-blur-[2px] rounded-lg border-2 border-[#8b4513]/30">
              <div className="text-center space-y-6 p-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <Gamepad2 className="size-14 text-[#c4813d] animate-float drop-shadow-[0_0_15px_rgba(196,129,61,0.3)]" />
                    <div className="absolute -top-2 -right-2 size-5 bg-[#8b0000] rounded-full flex items-center justify-center border border-[#3d1f1f]">
                      <Zap className="size-3 text-[#ffaa00] fill-[#ffaa00]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="font-pixel text-xs text-[#eecfa1] tracking-widest uppercase">
                    100 SATS = 1 LIFE
                  </p>
                  <p className="text-[10px] text-[#8b6914] max-w-[200px] mx-auto italic">
                    "Only the hunger grows in the wasteland."
                  </p>
                </div>

                <Button
                  onClick={handleStartGame}
                  className="bg-[#c4813d] text-[#2c1e16] font-pixel text-xs hover:bg-[#d4a854] h-14 px-8 border-b-4 border-[#8b4513] active:border-b-0 active:translate-y-[4px] transition-all"
                >
                  <Zap className="size-4 mr-2" />
                  INSERT COIN
                </Button>

                {/* Controls hint */}
                <div className="flex items-center justify-center gap-6 text-[#8b6914]/60 pt-2">
                  <div className="flex items-center gap-2">
                    <Keyboard className="size-3" />
                    <span className="text-[8px] font-pixel">ARROWS / WASD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="size-3" />
                    <span className="text-[8px] font-pixel">TOUCH D-PAD</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ready overlay — payment received, waiting to start */}
          {phase === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/70 backdrop-blur-[3px] rounded-lg border-2 border-[#22c55e]/30">
              <div className="text-center space-y-6 p-6">
                <div className="space-y-2">
                  <p className="font-pixel text-[10px] text-[#22c55e] tracking-wider animate-pulse">
                    PAYMENT CONFIRMED
                  </p>
                  <p className="font-pixel text-sm text-[#eecfa1] tracking-widest uppercase">
                    PREPARE TO STRIKE
                  </p>
                </div>

                <Button
                  onClick={handleLaunchGame}
                  className="bg-[#22c55e] text-[#0a2f1b] font-pixel text-sm hover:bg-[#4ade80] h-16 px-12 border-b-4 border-[#15803d] active:border-b-0 active:translate-y-[4px] transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  <Play className="size-5 mr-2 fill-current" />
                  START GAME
                </Button>

                <p className="text-[9px] text-[#8b6914] font-pixel uppercase tracking-wide">
                  {isMobile ? 'TAP ARROWS TO TURN' : 'PRESS SPACE TO BEGIN'}
                </p>
              </div>
            </div>
          )}

          {/* Game Over overlay */}
          {phase === 'gameOver' && (
            <GameOverOverlay
              score={finalScore}
              isPublishing={isPublishing}
              onPlayAgain={handlePlayAgain}
            />
          )}
        </div>

        {/* Touch controls — visible on mobile while playing */}
        {isMobile && phase === 'playing' && (
          <TouchControls keysRef={keysRef} />
        )}

        {/* Discrete all-time play counter */}
        <div className="w-full max-w-md mx-auto text-right -mt-2">
          <span className="text-[9px] font-pixel text-[#8b4513]/60 tracking-wider">
            TOTAL VICTIMS: {(allTimePlayCount ?? 0).toLocaleString()}
          </span>
        </div>

        {/* Leaderboard */}
        <div className="w-full max-w-md space-y-4">
            <div className="flex items-center gap-2 mb-1 px-1">
                <div className="h-px bg-[#8b4513]/30 flex-1" />
                <span className="text-[10px] font-pixel text-[#8b4513] tracking-widest uppercase">Wasteland Legends</span>
                <div className="h-px bg-[#8b4513]/30 flex-1" />
            </div>
            <Leaderboard />
        </div>

        {/* Footer */}
        <footer className="text-center text-[10px] text-[#8b4513]/50 pb-8 space-y-2 pt-8">
          <p>
            Scores etched on{' '}
            <span className="text-[#8b4513]">Nostr</span>
            {' '}&middot;{' '}
            Tribute via{' '}
            <span className="text-[#c4813d]">Lightning</span>
          </p>
          <p>
            Forged with{' '}
            <a
              href="https://shakespeare.diy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8b4513] hover:text-[#c4813d] transition-colors font-bold"
            >
              Shakespeare
            </a>
          </p>
        </footer>
      </div>

      {/* Payment Dialog */}
      <PaymentGate
        open={showPayment}
        onPaid={handlePaid}
        onClose={() => setShowPayment(false)}
      />
    </div>
  );
};

export default Index;
