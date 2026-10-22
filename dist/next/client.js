"use client";
// src/next/client.ts
import { sendGTMEvent } from "@next/third-parties/google";

// src/next/SignalBridge.tsx
import { useEffect } from "react";

// src/consent/constants.ts
var SIGNAL_CONSENT_VERSION = 1;
var DEFAULT_STORAGE_KEY = "lemon-signal-consent";
var DEFAULT_COOKIE_NAME = "lemon_signal_consent";
var SIGNAL_CONSENT_CHANGED_EVENT = "lemon-signal:consent-changed";
var SIGNAL_CONSENT_OPEN_EVENT = "lemon-signal:consent-open";
var CONSENT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

// src/consent/map.ts
function consentToGoogleState(consent) {
  const analytics = consent.analytics ? "granted" : "denied";
  const marketing = consent.marketing ? "granted" : "denied";
  return {
    security_storage: "granted",
    functionality_storage: "granted",
    analytics_storage: analytics,
    personalization_storage: analytics,
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing
  };
}
function consentToCookiePayload(consent) {
  return {
    securityConsentGranted: true,
    functionalityConsentGranted: true,
    analyticsConsentGranted: consent.analytics,
    personalizationConsentGranted: consent.analytics,
    adConsentGranted: consent.marketing,
    adUserDataConsentGranted: consent.marketing,
    adPersonalizationConsentGranted: consent.marketing
  };
}
var DENIED_OPTIONAL = {
  ad_personalization: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  analytics_storage: "denied",
  personalization_storage: "denied",
  functionality_storage: "granted",
  security_storage: "granted"
};
var GRANTED_ALL = {
  ad_personalization: "granted",
  ad_storage: "granted",
  ad_user_data: "granted",
  analytics_storage: "granted",
  personalization_storage: "granted",
  functionality_storage: "granted",
  security_storage: "granted"
};

// src/consent/cookie-domain.ts
function resolveCookieDomain(cookieDomain, hostname) {
  if (!cookieDomain) {
    return;
  }
  const domain = cookieDomain.trim().toLowerCase().replace(/^\./, "");
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!(domain && host) || !domain.includes(".")) {
    return;
  }
  if (isBlockedHost(domain) || isBlockedHost(host)) {
    return;
  }
  if (host !== domain && !host.endsWith(`.${domain}`)) {
    return;
  }
  return domain;
}
function isBlockedHost(host) {
  return host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1" || host === "::1" || host === "[::1]" || host === "vercel.app" || host.endsWith(".vercel.app");
}

// src/consent/storage.ts
function keys(config = {}) {
  return {
    storageKey: config.storageKey ?? DEFAULT_STORAGE_KEY,
    cookieName: config.cookieName ?? DEFAULT_COOKIE_NAME,
    version: config.version ?? SIGNAL_CONSENT_VERSION,
    cookieDomain: resolveCookieDomain(config.cookieDomain, typeof window === "undefined" ? "" : window.location.hostname)
  };
}
function defaultConsent(options = {}, config = {}) {
  const { version } = keys(config);
  return {
    essential: true,
    analytics: options.analytics ?? false,
    marketing: options.marketing ?? false,
    updatedAt: new Date().toISOString(),
    version
  };
}
function cookieAttribute(domain) {
  return domain ? `; Domain=${domain}` : "";
}
function writeCookie(name, value, domain) {
  if (typeof document === "undefined") {
    return;
  }
  const encoded = encodeURIComponent(value);
  document.cookie = `${name}=${encoded}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${cookieAttribute(domain)}`;
}
function clearCookie(name, domain) {
  if (typeof document === "undefined") {
    return;
  }
  const base = `${name}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = base;
  if (domain) {
    document.cookie = `${base}${cookieAttribute(domain)}`;
  }
}
function readCookie(name) {
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
function consentFromStorageJson(raw, version) {
  const parsed = JSON.parse(raw);
  if (parsed.version !== version) {
    return null;
  }
  const hasAnalytics = parsed.analytics === true || parsed.analytics === false || parsed.optionalAnalytics === true;
  if (!hasAnalytics) {
    return null;
  }
  const analytics = parsed.analytics === true || parsed.optionalAnalytics === true;
  return {
    essential: true,
    analytics,
    marketing: parsed.marketing === true,
    updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    version
  };
}
function consentFromCookieJson(raw, version) {
  const parsed = JSON.parse(raw);
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
    version
  };
}
function mirrorLocal(storageKey, consent) {
  window.localStorage.setItem(storageKey, JSON.stringify(consent));
}
function storedCookieValue(consent) {
  const payload = {
    ...consentToCookiePayload(consent),
    version: consent.version
  };
  return JSON.stringify(payload);
}
function readConsent(config = {}) {
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
  } catch {}
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
function writeConsent(consent, config = {}) {
  if (typeof window === "undefined") {
    return;
  }
  const { storageKey, cookieName, cookieDomain } = keys(config);
  mirrorLocal(storageKey, consent);
  writeCookie(cookieName, storedCookieValue(consent), cookieDomain);
  window.dispatchEvent(new CustomEvent(SIGNAL_CONSENT_CHANGED_EVENT, { detail: consent }));
}
function clearConsent(config = {}) {
  if (typeof window === "undefined") {
    return;
  }
  const { storageKey, cookieName, cookieDomain } = keys(config);
  window.localStorage.removeItem(storageKey);
  clearCookie(cookieName, cookieDomain);
  window.dispatchEvent(new CustomEvent(SIGNAL_CONSENT_CHANGED_EVENT, { detail: null }));
}
function openConsentPreferences() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent("lemon-signal:consent-open"));
}

// src/bridge.ts
function listenerBucket() {
  if (typeof window === "undefined") {
    return [];
  }
  if (!window.__lemonSignalConsentListeners) {
    window.__lemonSignalConsentListeners = [];
  }
  return window.__lemonSignalConsentListeners;
}
function notify(consent) {
  if (!consent) {
    return;
  }
  const payload = consentToCookiePayload(consent);
  listenerBucket().forEach((cb) => {
    try {
      cb(payload);
    } catch {}
  });
}
function installLemonSignalBridge(config = {}) {
  if (typeof window === "undefined") {
    return {
      addConsentListener: () => {
        return;
      },
      getConsent: () => null
    };
  }
  const addConsentListener = (callback) => {
    listenerBucket().push(callback);
    const existing = readConsent(config);
    if (existing) {
      callback(consentToCookiePayload(existing));
    }
  };
  const bridge = {
    addConsentListener,
    getConsent: () => readConsent(config)
  };
  window.LemonSignalAddConsentListener = addConsentListener;
  window.LemonSignal = bridge;
  window.addEventListener(SIGNAL_CONSENT_CHANGED_EVENT, (event) => {
    const custom = event;
    notify(custom.detail ?? null);
  });
  window.addEventListener(SIGNAL_CONSENT_CHANGED_EVENT, (event) => {
    const custom = event;
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
        personalization_storage: "denied"
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
      security_storage: "granted"
    });
  });
  return bridge;
}

// src/next/SignalBridge.tsx

function SignalBridge({
  storage
}) {
  useEffect(() => {
    installLemonSignalBridge(storage);
  }, [storage]);
  return null;
}

// src/next/client.ts

export {
  sendGTMEvent,
  SignalBridge
};
