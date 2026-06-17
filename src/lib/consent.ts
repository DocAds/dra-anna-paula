// Estado de consentimento de cookies, compartilhado entre o banner e os scripts
// de tracking. O banner (CookieConsent) escreve; TrackingScripts lê e reage.

export type ConsentState = { analytics: boolean; marketing: boolean };

export const CONSENT_EVENT = "anna:consent";

declare global {
  interface Window {
    __annaConsent?: ConsentState;
  }
}

export function getConsent(): ConsentState {
  if (typeof window === "undefined") return { analytics: false, marketing: false };
  return window.__annaConsent ?? { analytics: false, marketing: false };
}

export function setConsent(state: ConsentState) {
  if (typeof window === "undefined") return;
  window.__annaConsent = state;
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }));
}

export function onConsentChange(cb: (s: ConsentState) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<ConsentState>).detail);
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}
