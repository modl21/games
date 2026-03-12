import { NSecSigner, type NostrEvent } from '@nostrify/nostrify';
import { generateSecretKey } from 'nostr-tools';

import { PAYMENT_AMOUNT_SATS, PAYMENT_RECIPIENT } from './gameConstants';

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

interface LNURLPayResponse {
  callback: string;
  minSendable: number;
  maxSendable: number;
  tag: string;
  allowsNostr?: boolean;
  nostrPubkey?: string;
}

interface LNURLInvoiceResponse {
  pr: string;
  verify?: string;
  routes: string[];
}

export interface GameInvoice {
  bolt11: string;
  verifyUrl: string | null;
  zapRequest: NostrEvent | null;
  signer: NSecSigner;
  /** The nostr pubkey of the LNURL server (signs zap receipts) */
  recipientLnurlPubkey: string | null;
  /** The pubkey our ephemeral signer used (sender of the zap) */
  senderPubkey: string | null;
}

/**
 * Fetch JSON from a URL, trying direct first then falling back to the CORS proxy.
 */
async function fetchJSON<T>(url: string): Promise<T> {
  try {
    const direct = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (direct.ok) {
      return await direct.json() as T;
    }
  } catch {
    // CORS or network error — fall through to proxy
  }

  const proxied = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!proxied.ok) {
    throw new Error(`Request failed: ${proxied.status} ${proxied.statusText}`);
  }
  return await proxied.json() as T;
}

/**
 * Resolve a lightning address to an LNURL-pay endpoint
 */
export async function resolveLightningAddress(address: string): Promise<LNURLPayResponse> {
  const [name, domain] = address.split('@');
  if (!name || !domain) {
    throw new Error('Invalid lightning address format');
  }

  const url = `https://${domain}/.well-known/lnurlp/${name}`;
  const data = await fetchJSON<LNURLPayResponse>(url);

  if (data.tag !== 'payRequest') {
    throw new Error('Invalid LNURL-pay response');
  }

  return data;
}

/**
 * Get a zap-formatted invoice for the game payment.
 */
export async function getGameInvoice(relays: string[]): Promise<GameInvoice> {
  const lnurlPay = await resolveLightningAddress(PAYMENT_RECIPIENT);

  const amountMsat = PAYMENT_AMOUNT_SATS * 1000;

  if (amountMsat < lnurlPay.minSendable || amountMsat > lnurlPay.maxSendable) {
    throw new Error(
      `Amount ${PAYMENT_AMOUNT_SATS} sats is outside the allowed range ` +
      `(${lnurlPay.minSendable / 1000}-${lnurlPay.maxSendable / 1000} sats)`,
    );
  }

  const sk = generateSecretKey();
  const signer = new NSecSigner(sk);
  const senderPubkey = await signer.getPublicKey();

  if (!lnurlPay.allowsNostr || !lnurlPay.nostrPubkey) {
    throw new Error('Payment recipient does not support zaps');
  }

  const recipientPubkey = lnurlPay.nostrPubkey;

  // Build and sign a NIP-57 zap request (kind 9734)
  const zapRequestUnsigned = {
    kind: 9734 as const,
    content: '',
    tags: [
      ['relays', ...relays],
      ['amount', String(amountMsat)],
      ['p', recipientPubkey],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };

  const zapRequest = await signer.signEvent(zapRequestUnsigned);

  // Build callback URL with the zap request
  const separator = lnurlPay.callback.includes('?') ? '&' : '?';
  const callbackUrl = `${lnurlPay.callback}${separator}amount=${amountMsat}&nostr=${encodeURI(JSON.stringify(zapRequest))}`;

  const data = await fetchJSON<LNURLInvoiceResponse>(callbackUrl);

  if (!data.pr) {
    throw new Error('No payment request in response');
  }

  return {
    bolt11: data.pr,
    verifyUrl: data.verify || null,
    zapRequest,
    signer,
    recipientLnurlPubkey: recipientPubkey,
    senderPubkey,
  };
}

/**
 * Check if WebLN is available for direct payment
 */
export function isWebLNAvailable(): boolean {
  return typeof window !== 'undefined' && 'webln' in window && window.webln != null;
}

/**
 * Pay an invoice using WebLN
 */
export async function payWithWebLN(invoice: string): Promise<boolean> {
  if (!isWebLNAvailable()) return false;

  try {
    await window.webln!.enable();
    await window.webln!.sendPayment(invoice);
    return true;
  } catch {
    return false;
  }
}
