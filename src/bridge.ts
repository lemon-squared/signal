import { SIGNAL_CONSENT_CHANGED_EVENT } from "./consent/constants";
import { consentToCookiePayload } from "./consent/map";
import { readConsent, type StorageConfig } from "./consent/storage";
import type {
  SignalConsent,
  SignalConsentCookiePayload,
} from "./consent/types";

export type ConsentListener = (payload: SignalConsentCookiePayload) => void;

export interface LemonSignalBridge {
  addConsentListener: (callback: ConsentListener) => void;
  getConsent: () => SignalConsent | null;
}

declare global {
  interface Window {
    LemonSignal?: LemonSignalBridge;
    /** Flat alias for GTM `callInWindow` (Google Consent APIs sample pattern). */
    LemonSignalAddConsentListener?: (callback: ConsentListener) => void;
    __lemonSignalConsentListeners?: ConsentListener[];
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function listenerBucket(): ConsentListener[] {
  if (typeof window === "undefined") {
    return [];
  }
  if (!window.__lemonSignalConsentListeners) {
    window.__lemonSignalConsentListeners = [];
  }
  return window.__lemonSignalConsentListeners;
}

function notify(consent: SignalConsent | null): void {
  if (!consent) {
    return;
  }
  const payload = consentToCookiePayload(consent);
  listenerBucket().forEach((cb) => {
    try {
      cb(payload);
    } catch {
      // ignore listener errors
    }
  });
}

/**
 * Installs `window.LemonSignal` + flat `LemonSignalAddConsentListener`
 * for the GTM Consent API template (`callInWindow`).
 * Safe to call after the early bootstrap stub — reuses the same listener array.
 */
export function installLemonSignalBridge(
  config: StorageConfig = {}
): LemonSignalBridge {
  if (typeof window === "undefined") {
    return {
      addConsentListener: () => undefined,
      getConsent: () => null,
    };
  }

  const addConsentListener = (callback: ConsentListener) => {
    listenerBucket().push(callback);
    const existing = readConsent(config);
    if (existing) {
      callback(consentToCookiePayload(existing));
    }
  };

  const bridge: LemonSignalBridge = {
    addConsentListener,
    getConsent: () => readConsent(config),
  };

  window.LemonSignalAddConsentListener = addConsentListener;
  window.LemonSignal = bridge;

  window.addEventListener(SIGNAL_CONSENT_CHANGED_EVENT, (event) => {
    const custom = event as CustomEvent<SignalConsent | null>;
    notify(custom.detail ?? null);
  });

  // Page-level gtag update backup (GTM template prefers updateConsentState).
  window.addEventListener(SIGNAL_CONSENT_CHANGED_EVENT, (event) => {
    const custom = event as CustomEvent<SignalConsent | null>;
    const consent = custom.detail;
    if (typeof window.gtag !== "function") {
      return;
    }
    if (!consent) {
      window.gtag("consent", "update", {
        ad_personalization: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        analytics_storage: "denied",
        personalization_storage: "denied",
      });
      return;
    }
    const analytics = consent.analytics ? "granted" : "denied";
    const marketing = consent.marketing ? "granted" : "denied";
    window.gtag("consent", "update", {
      ad_personalization: marketing,
      ad_storage: marketing,
      ad_user_data: marketing,
      analytics_storage: analytics,
      personalization_storage: analytics,
      functionality_storage: "granted",
      security_storage: "granted",
    });
  });

  return bridge;
}
