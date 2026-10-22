import { resolveCookieDomain } from "./cookie-domain";
import {
  CONSENT_COOKIE_MAX_AGE_SECONDS,
  DEFAULT_COOKIE_NAME,
  DEFAULT_STORAGE_KEY,
  SIGNAL_CONSENT_CHANGED_EVENT,
  SIGNAL_CONSENT_VERSION,
} from "./constants";
import { consentToCookiePayload } from "./map";
import type {
  SignalConsent,
  SignalConsentCookiePayload,
  SignalConsentOptions,
} from "./types";

export interface StorageConfig {
  storageKey?: string;
  cookieName?: string;
  version?: number;
  /**
   * Share the consent cookie across subdomains (`Domain=example.com`).
   * Omit for a host-only cookie. Ignored on localhost, `*.vercel.app`,
   * and when the current host is not that domain or a subdomain of it.
   */
  cookieDomain?: string;
}

function keys(config: StorageConfig = {}) {
  return {
    storageKey: config.storageKey ?? DEFAULT_STORAGE_KEY,
    cookieName: config.cookieName ?? DEFAULT_COOKIE_NAME,
    version: config.version ?? SIGNAL_CONSENT_VERSION,
    cookieDomain: resolveCookieDomain(
      config.cookieDomain,
      typeof window === "undefined" ? "" : window.location.hostname
    ),
  };
}

export function defaultConsent(
  options: SignalConsentOptions = {},
  config: StorageConfig = {}
): SignalConsent {
  const { version } = keys(config);
  return {
    essential: true,
    analytics: options.analytics ?? false,
    marketing: options.marketing ?? false,
    updatedAt: new Date().toISOString(),
    version,
  };
}

type StoredCookie = SignalConsentCookiePayload & { version?: number };

function cookieAttribute(domain: string | undefined): string {
  return domain ? `; Domain=${domain}` : "";
}

function writeCookie(
  name: string,
  value: string,
  domain: string | undefined
): void {
  if (typeof document === "undefined") {
    return;
  }
  const encoded = encodeURIComponent(value);
  document.cookie = `${name}=${encoded}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${cookieAttribute(domain)}`;
}

function clearCookie(name: string, domain: string | undefined): void {
  if (typeof document === "undefined") {
    return;
  }
  const base = `${name}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = base;
  if (domain) {
    document.cookie = `${base}${cookieAttribute(domain)}`;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      try {
        return decodeURIComponent(trimmed.slice(prefix.length));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function consentFromStorageJson(
  raw: string,
  version: number
): SignalConsent | null {
  const parsed = JSON.parse(raw) as Partial<SignalConsent> & {
    optionalAnalytics?: boolean;
  };
  if (parsed.version !== version) {
    return null;
  }
  const hasAnalytics =
    parsed.analytics === true ||
    parsed.analytics === false ||
    parsed.optionalAnalytics === true;
  if (!hasAnalytics) {
    return null;
  }
  const analytics =
    parsed.analytics === true || parsed.optionalAnalytics === true;
  return {
    essential: true,
    analytics,
    marketing: parsed.marketing === true,
    updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    version,
  };
}

function consentFromCookieJson(
  raw: string,
  version: number
): SignalConsent | null {
  const parsed = JSON.parse(raw) as StoredCookie;
  if (parsed.version !== version) {
    return null;
  }
  if (typeof parsed.analyticsConsentGranted !== "boolean") {
    return null;
  }
  return {
    essential: true,
    analytics: parsed.analyticsConsentGranted,
    marketing: parsed.adConsentGranted === true,
    updatedAt: new Date().toISOString(),
    version,
  };
}

function mirrorLocal(storageKey: string, consent: SignalConsent): void {
  window.localStorage.setItem(storageKey, JSON.stringify(consent));
}

function storedCookieValue(consent: SignalConsent): string {
  const payload: StoredCookie = {
    ...consentToCookiePayload(consent),
    version: consent.version,
  };
  return JSON.stringify(payload);
}

export function readConsent(config: StorageConfig = {}): SignalConsent | null {
  if (typeof window === "undefined") {
    return null;
  }
  const { storageKey, cookieName, version, cookieDomain } = keys(config);

  try {
    const cookieRaw = readCookie(cookieName);
    if (cookieRaw) {
      const fromCookie = consentFromCookieJson(cookieRaw, version);
      if (fromCookie) {
        mirrorLocal(storageKey, fromCookie);
        return fromCookie;
      }
    }
  } catch {
    // fall through to localStorage
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    const fromStorage = consentFromStorageJson(raw, version);
    if (!fromStorage) {
      return null;
    }
    writeCookie(cookieName, storedCookieValue(fromStorage), cookieDomain);
    return fromStorage;
  } catch {
    return null;
  }
}

export function writeConsent(
  consent: SignalConsent,
  config: StorageConfig = {}
): void {
  if (typeof window === "undefined") {
    return;
  }
  const { storageKey, cookieName, cookieDomain } = keys(config);
  mirrorLocal(storageKey, consent);
  writeCookie(cookieName, storedCookieValue(consent), cookieDomain);
  window.dispatchEvent(
    new CustomEvent(SIGNAL_CONSENT_CHANGED_EVENT, { detail: consent })
  );
}

export function clearConsent(config: StorageConfig = {}): void {
  if (typeof window === "undefined") {
    return;
  }
  const { storageKey, cookieName, cookieDomain } = keys(config);
  window.localStorage.removeItem(storageKey);
  clearCookie(cookieName, cookieDomain);
  window.dispatchEvent(
    new CustomEvent(SIGNAL_CONSENT_CHANGED_EVENT, { detail: null })
  );
}

export function openConsentPreferences(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent("lemon-signal:consent-open"));
}
