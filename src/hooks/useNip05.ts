import { useQuery } from '@tanstack/react-query';
import { nip19 } from 'nostr-tools';

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

interface Nip05Result {
  pubkey: string;
  npub: string;
}

async function lookupNip05(identifier: string): Promise<Nip05Result | null> {
  const [name, domain] = identifier.split('@');
  if (!name || !domain) return null;

  const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;

  let data: { names?: Record<string, string> } | null = null;

  // Try direct fetch first (CORS may be allowed)
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      data = await res.json();
    }
  } catch {
    // CORS blocked — try proxy
  }

  // Fallback to CORS proxy
  if (!data) {
    try {
      const res = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        data = await res.json();
      }
    } catch {
      return null;
    }
  }

  if (!data?.names) return null;

  const pubkey = data.names[name];
  if (!pubkey || !/^[0-9a-f]{64}$/.test(pubkey)) return null;

  const npub = nip19.npubEncode(pubkey);
  return { pubkey, npub };
}

export function useNip05(lightningAddress: string) {
  return useQuery({
    queryKey: ['nip05', lightningAddress],
    queryFn: () => lookupNip05(lightningAddress),
    staleTime: 1000 * 60 * 60, // cache for 1 hour
    retry: false,
  });
}
