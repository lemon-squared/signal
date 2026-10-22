"use client";
// src/react/CookieBanner.tsx
import { useEffect, useState } from "react";

// src/consent/constants.ts
var SIGNAL_CONSENT_VERSION = 1;
var DEFAULT_STORAGE_KEY = "lemon-signal-consent";
var DEFAULT_COOKIE_NAME = "lemon_signal_consent";
var SIGNAL_CONSENT_CHANGED_EVENT = "lemon-signal:consent-changed";
var SIGNAL_CONSENT_OPEN_EVENT = "lemon-signal:consent-open";
var CONSENT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

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

// src/react/CookieBanner.tsx
import { jsx, jsxs } from "react/jsx-runtime";

function CookieBanner({
  copy,
  enabled = true,
  storage,
  className,
  acceptFirstOnMobile = true
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }
    const sync = () => {
      setVisible(readConsent(storage) === null);
    };
    sync();
    const onOpen = () => setVisible(true);
    window.addEventListener(SIGNAL_CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(SIGNAL_CONSENT_OPEN_EVENT, onOpen);
  }, [enabled, storage]);
  if (!visible) {
    return null;
  }
  const acceptAll = () => {
    writeConsent(defaultConsent({ analytics: true, marketing: true }, storage), storage);
    setVisible(false);
  };
  const essentialOnly = () => {
    writeConsent(defaultConsent({ analytics: false, marketing: false }, storage), storage);
    setVisible(false);
  };
  const acceptOrder = acceptFirstOnMobile ? "order-1 sm:order-2" : "order-2 sm:order-1";
  const essentialOrder = acceptFirstOnMobile ? "order-2 sm:order-1" : "order-1 sm:order-2";
  return /* @__PURE__ */ jsx("div", {
    "aria-describedby": "lemon-signal-banner-desc",
    "aria-labelledby": "lemon-signal-banner-title",
    className: className ?? "fixed inset-x-0 bottom-0 z-50 border-line border-t bg-surface/95 p-4 shadow-[0_-12px_40px_-24px_rgb(0_0_0/0.35)] backdrop-blur-md sm:p-5",
    role: "dialog",
    children: /* @__PURE__ */ jsxs("div", {
      className: "mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8",
      children: [
        /* @__PURE__ */ jsxs("div", {
          className: "max-w-2xl",
          children: [
            /* @__PURE__ */ jsx("p", {
              className: "font-display font-semibold text-base text-ink",
              id: "lemon-signal-banner-title",
              children: copy.title
            }),
            /* @__PURE__ */ jsx("p", {
              className: "mt-2 text-mute text-sm leading-relaxed",
              id: "lemon-signal-banner-desc",
              children: copy.description
            })
          ]
        }),
        /* @__PURE__ */ jsxs("div", {
          className: "flex flex-col gap-2 sm:flex-row sm:items-center",
          children: [
            /* @__PURE__ */ jsx("button", {
              className: `${acceptOrder} rounded-lg bg-accent px-4 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-accent-hover`,
              onClick: acceptAll,
              type: "button",
              children: copy.acceptAll
            }),
            /* @__PURE__ */ jsx("button", {
              className: `${essentialOrder} rounded-lg border border-line px-4 py-2.5 font-semibold text-ink text-sm transition-colors hover:bg-canvas`,
              onClick: essentialOnly,
              type: "button",
              children: copy.essentialOnly
            })
          ]
        })
      ]
    })
  });
}
// src/react/SignalProvider.tsx
import {
  createContext,
  useContext,
  useEffect as useEffect2,
  useMemo
} from "react";

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

// src/react/SignalProvider.tsx
import { jsx as jsx2 } from "react/jsx-runtime";

var SignalContext = createContext({});
function SignalProvider({
  children,
  storage
}) {
  const value = useMemo(() => storage ?? {}, [storage]);
  useEffect2(() => {
    installLemonSignalBridge(value);
  }, [value]);
  return /* @__PURE__ */ jsx2(SignalContext.Provider, {
    value,
    children
  });
}
function useSignalStorage() {
  return useContext(SignalContext);
}
export {
  useSignalStorage,
  SignalProvider,
  CookieBanner
};
