import { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, Copy, Check, Loader2, Wallet, X } from 'lucide-react';
import { useNostr } from '@nostrify/react';
import qrcode from 'qrcode';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAppContext } from '@/hooks/useAppContext';
import { PAYMENT_AMOUNT_SATS, PAYMENT_RECIPIENT } from '@/lib/gameConstants';
import { getGameInvoice, isWebLNAvailable, payWithWebLN } from '@/lib/lightning';
import type { GameInvoice } from '@/lib/lightning';

interface PaymentGateProps {
  open: boolean;
  onPaid: (lightningAddress: string, invoice: GameInvoice) => void;
  onClose: () => void;
}

const POLL_INTERVAL_MS = 2500;

export function PaymentGate({ open, onPaid, onClose }: PaymentGateProps) {
  const { nostr } = useNostr();
  const { config } = useAppContext();
  const [lightningAddress, setLightningAddress] = useState('');
  const [step, setStep] = useState<'address' | 'invoice'>('address');
  const [invoice, setInvoice] = useState<GameInvoice | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minute countdown for invoice

  const activeRef = useRef(false);

  const stopVerification = useCallback(() => {
    activeRef.current = false;
    setVerifying(false);
  }, []);

  useEffect(() => {
    if (open) {
      setStep('address');
      setInvoice(null);
      setQrDataUrl('');
      setError('');
      setCopied(false);
      setLoading(false);
      stopVerification();
      setTimeLeft(120);
    } else {
      stopVerification();
    }
  }, [open, stopVerification]);

  useEffect(() => {
    return () => { activeRef.current = false; };
  }, []);

  // Poll for zap receipt
  const startVerification = useCallback((gameInvoice: GameInvoice, address: string) => {
    stopVerification();
    activeRef.current = true;
    setVerifying(true);

    const onSettled = () => {
      if (!activeRef.current) return;
      activeRef.current = false;
      setVerifying(false);
      onPaid(address, gameInvoice);
    };

    const sinceTimestamp = Math.floor(Date.now() / 1000) - 90;
    const recipientPubkey = gameInvoice.recipientLnurlPubkey!;
    const senderPubkey = gameInvoice.senderPubkey;
    const zapRequestId = gameInvoice.zapRequest!.id;
    const bolt11 = gameInvoice.bolt11;

    const filters = senderPubkey
      ? [
          { kinds: [9735], '#p': [recipientPubkey], '#P': [senderPubkey], since: sinceTimestamp, limit: 30 },
          { kinds: [9735], '#p': [recipientPubkey], since: sinceTimestamp, limit: 80 },
        ]
      : [
          { kinds: [9735], '#p': [recipientPubkey], since: sinceTimestamp, limit: 80 },
        ];

    async function poll() {
      if (!activeRef.current) return;

      try {
        const [poolEvents, primalEvents] = await Promise.all([
          nostr.query(filters, { signal: AbortSignal.timeout(8000) }),
          nostr.relay('wss://relay.primal.net').query(filters, { signal: AbortSignal.timeout(8000) }),
        ]);

        const allEvents = [...poolEvents, ...primalEvents];

        for (const event of allEvents) {
          const bolt11Tag = event.tags.find(([n]) => n === 'bolt11')?.[1];
          if (bolt11Tag === bolt11) {
            onSettled();
            return;
          }

          const descTag = event.tags.find(([n]) => n === 'description')?.[1];
          if (descTag) {
            try {
              const embedded = JSON.parse(descTag);
              if (embedded.id === zapRequestId) {
                onSettled();
                return;
              }
            } catch { /* skip */ }
          }
        }
      } catch { /* ignore */ }

      if (activeRef.current) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    setTimeout(poll, 3000);
  }, [nostr, stopVerification, onPaid]);

  const handleSubmitAddress = useCallback(async () => {
    const trimmed = lightningAddress.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid address (e.g. name@wallet.com)');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const relays = config.relayMetadata.relays.map((r) => r.url);
      const gameInvoice = await getGameInvoice(relays);
      setInvoice(gameInvoice);

      const dataUrl = await qrcode.toDataURL(gameInvoice.bolt11.toUpperCase(), {
        width: 300,
        margin: 2,
        color: { dark: '#c4813d', light: '#1a0f0a' },
      });
      setQrDataUrl(dataUrl);

      // WebLN check
      if (isWebLNAvailable()) {
        const paid = await payWithWebLN(gameInvoice.bolt11);
        if (paid) {
          startVerification(gameInvoice, trimmed);
          setStep('invoice');
          return;
        }
      }

      setStep('invoice');
      startVerification(gameInvoice, trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Services unavailable. Try again.');
      // Keep loading false on error so they can retry
    } finally {
      setLoading(false);
    }
  }, [lightningAddress, config, onPaid, startVerification]);

  const handleCopyInvoice = useCallback(() => {
    if (!invoice) return;
    navigator.clipboard.writeText(invoice.bolt11);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [invoice]);

  const handleOpenChange = useCallback((o: boolean) => {
    if (!o && step === 'invoice') return;
    if (!o) onClose();
  }, [step, onClose]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`bg-[#0a0502] border-2 border-[#8b4513] max-w-sm mx-auto shadow-[0_0_50px_rgba(139,69,19,0.2)] ${step === 'invoice' ? '[&>button:last-of-type]:hidden' : ''}`}
        onEscapeKeyDown={(e) => { if (step === 'invoice') e.preventDefault(); }}
        onInteractOutside={(e) => { if (step === 'invoice') e.preventDefault(); }}
      >
        <DialogHeader>
          <div className="space-y-4">
            <DialogTitle className="font-pixel text-sm text-[#c4813d] text-center tracking-widest uppercase">
              COIN SLOT
            </DialogTitle>

            <a
              href="https://primal.net/downloads"
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto inline-flex items-center gap-2 rounded border border-[#8b4513]/30 bg-[#2c1e16]/50 px-3 py-2 text-[10px] font-pixel tracking-wide text-[#c4a882] hover:bg-[#3d2b1f] hover:text-[#eecfa1] transition-colors"
            >
              <Wallet className="size-3" />
              GET LIGHTNING WALLET
            </a>

            <DialogDescription className="text-center text-[#8b6914] text-xs font-pixel tracking-wider uppercase">
              PAY {PAYMENT_AMOUNT_SATS} SATS TO PLAY
            </DialogDescription>
          </div>
        </DialogHeader>

        {step === 'address' && (
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] text-[#8b4513] font-pixel tracking-widest uppercase block mb-1">
                LIGHTNING ADDRESS
              </label>
              <Input
                placeholder="satoshi@primal.net"
                value={lightningAddress}
                onChange={(e) => setLightningAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitAddress()}
                className="bg-[#1a0f0a] border-[#8b4513]/50 text-[#eecfa1] placeholder:text-[#8b4513]/40 focus:border-[#c4813d] h-12 font-mono text-sm"
                autoFocus
              />
              <p className="text-[9px] text-[#8b4513]/60 italic pl-1">
                Required for payout on the bounty board
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-xs font-pixel">
                {error}
              </div>
            )}

            <Button
              onClick={handleSubmitAddress}
              disabled={loading || !lightningAddress.trim()}
              className="w-full bg-[#c4813d] text-[#2c1e16] font-pixel text-xs hover:bg-[#d4a854] h-12 border-b-4 border-[#8b4513] active:border-b-0 active:translate-y-[4px] transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>FORGING INVOICE...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="size-4" />
                  <span>INSERT {PAYMENT_AMOUNT_SATS} SATS</span>
                </div>
              )}
            </Button>
          </div>
        )}

        {step === 'invoice' && invoice && (
          <div className="space-y-4 pt-2 animate-in fade-in zoom-in-95 duration-300">
            {qrDataUrl && (
              <div className="flex justify-center my-2">
                <div className="p-3 rounded bg-[#1a0f0a] border-2 border-[#c4813d]/30 shadow-[0_0_20px_rgba(196,129,61,0.1)]">
                  <img src={qrDataUrl} alt="Lightning Invoice QR" className="w-[240px] h-[240px] opacity-90" />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                readOnly
                value={invoice.bolt11}
                className="bg-[#1a0f0a] border-[#8b4513]/30 text-[#8b6914] text-[10px] font-mono h-9 truncate"
              />
              <Button
                onClick={handleCopyInvoice}
                variant="outline"
                size="icon"
                className="border-[#8b4513]/30 bg-[#2c1e16] text-[#c4813d] hover:bg-[#3d2b1f] shrink-0 size-9"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-center gap-3 py-3 rounded bg-[#2c1e16]/30 border border-[#c4813d]/20">
                <Loader2 className="size-4 text-[#c4813d] animate-spin" />
                <span className="font-pixel text-[10px] text-[#c4813d] tracking-widest uppercase animate-pulse">
                  AWAITING DEPOSIT...
                </span>
              </div>
              
              <div className="text-center">
                 <button 
                   onClick={() => { setStep('address'); stopVerification(); }}
                   className="text-[10px] text-[#8b4513] hover:text-[#c4813d] underline decoration-dotted underline-offset-4"
                 >
                   Cancel and return
                 </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
