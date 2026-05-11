import { encodeCodeToUrl } from '@/utils/url';

const APP_ORIGIN_FALLBACK = 'https://archigram.me';

function getAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  const envOrigin = (import.meta as ImportMeta).env?.VITE_APP_URL;
  return typeof envOrigin === 'string' && envOrigin.length > 0 ? envOrigin : APP_ORIGIN_FALLBACK;
}

/**
 * Build the deep link that opens the editor with the given Mermaid code.
 * The editor reads the LZ-string-encoded payload from window.location.hash
 * (see hooks/useAppRouter.ts and utils/url.ts).
 */
export function buildForkUrl(code: string): string {
  const encoded = encodeCodeToUrl(code);
  if (!encoded) return getAppOrigin();
  return `${getAppOrigin()}/#${encoded}`;
}
