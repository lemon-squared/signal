// src/next/SignalConsentDefaults.tsx
import Script from "next/script";

// src/consent/constants.ts
var SIGNAL_CONSENT_VERSION = 1;
var DEFAULT_STORAGE_KEY = "lemon-signal-consent";
var DEFAULT_COOKIE_NAME = "lemon_signal_consent";
var SIGNAL_CONSENT_CHANGED_EVENT = "lemon-signal:consent-changed";
var SIGNAL_CONSENT_OPEN_EVENT = "lemon-signal:consent-open";
var CONSENT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

// src/consent/regions.ts
var CONSENT_DENIED_REGIONS = [
  "GB",
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IS",
  "IT",
  "LV",
  "LI",
  "LT",
  "LU",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE"
];
var REGION_DENIED_TYPES = [
  "ad_storage",
  "ad_user_data",
  "ad_personalization",
  "analytics_storage",
  "personalization_storage"
];

// src/consent/bootstrap.ts
function buildConsentBootstrapScript(config = {}) {
  const storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;
  const cookieName = config.cookieName ?? DEFAULT_COOKIE_NAME;
  const version = config.version ?? SIGNAL_CONSENT_VERSION;
  const regions = JSON.stringify([...CONSENT_DENIED_REGIONS]);
  return `
(function(){
  var listeners = window.__lemonSignalConsentListeners = window.__lemonSignalConsentListeners || [];
  function addConsentListener(cb) {
    if (typeof cb === 'function') {
      listeners.push(cb);
    }
  }
  window.LemonSignalAddConsentListener = addConsentListener;
  window.LemonSignal = window.LemonSignal || {
    addConsentListener: addConsentListener,
    getConsent: function(){ return null; }
  };

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = window.gtag || gtag;

  gtag('consent', 'default', {
    ad_personalization: 'granted',
    ad_storage: 'granted',
    ad_user_data: 'granted',
    analytics_storage: 'granted',
    personalization_storage: 'granted',
    functionality_storage: 'granted',
    security_storage: 'granted'
  });
  gtag('consent', 'default', {
    ad_personalization: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    analytics_storage: 'denied',
    personalization_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    region: ${regions},
    wait_for_update: 500
  });

  function applyChoice(analytics, marketing) {
    gtag('consent', 'update', {
      ad_personalization: marketing ? 'granted' : 'denied',
      ad_storage: marketing ? 'granted' : 'denied',
      ad_user_data: marketing ? 'granted' : 'denied',
      analytics_storage: analytics ? 'granted' : 'denied',
      personalization_storage: analytics ? 'granted' : 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted'
    });
  }

  function readCookie(name) {
    var parts = document.cookie ? document.cookie.split(';') : [];
    var prefix = name + '=';
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].replace(/^\\s+/, '');
      if (part.indexOf(prefix) === 0) {
        try { return decodeURIComponent(part.slice(prefix.length)); } catch (e) { return null; }
      }
    }
    return null;
  }

  try {
    var applied = false;
    var cookieRaw = readCookie(${JSON.stringify(cookieName)});
    if (cookieRaw) {
      var cookie = JSON.parse(cookieRaw);
      if (cookie && cookie.version === ${version} && typeof cookie.analyticsConsentGranted === 'boolean') {
        var cookieAnalytics = cookie.analyticsConsentGranted === true;
        var cookieMarketing = cookie.adConsentGranted === true;
        applyChoice(cookieAnalytics, cookieMarketing);
        localStorage.setItem(${JSON.stringify(storageKey)}, JSON.stringify({
          essential: true,
          analytics: cookieAnalytics,
          marketing: cookieMarketing,
          updatedAt: new Date().toISOString(),
          version: ${version}
        }));
        applied = true;
      }
    }
    if (!applied) {
      var raw = localStorage.getItem(${JSON.stringify(storageKey)});
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === ${version}) {
          var analytics = parsed.analytics === true || parsed.optionalAnalytics === true;
          var marketing = parsed.marketing === true;
          applyChoice(analytics, marketing);
        }
      }
    }
  } catch (e) {}
})();
`.trim();
}

// src/next/SignalConsentDefaults.tsx
import { jsx } from "react/jsx-runtime";
function SignalConsentDefaults({
  storage
}) {
  return /* @__PURE__ */ jsx(Script, {
    id: "lemon-signal-consent-default",
    strategy: "beforeInteractive",
    children: buildConsentBootstrapScript(storage)
  });
}
// src/next/SignalGtm.tsx
import { GoogleTagManager } from "@next/third-parties/google";

// src/gtm/resolve.ts
var DEFAULT_GTM_SCRIPT_URL = "https://www.googletagmanager.com/gtm.js";
function resolveGtmConfig(input) {
  const gtmId = input.gtmId?.trim() || "";
  const gtmScriptUrl = input.gtmScriptUrl?.trim() || undefined;
  if (!(gtmId || gtmScriptUrl)) {
    return null;
  }
  return {
    gtmId: gtmId || "",
    gtmScriptUrl: gtmScriptUrl && gtmScriptUrl !== DEFAULT_GTM_SCRIPT_URL ? gtmScriptUrl : undefined
  };
}
function hasGtmConfigured(input) {
  return resolveGtmConfig(input) !== null;
}
function runtimeEnv(name) {
  return process.env[name];
}
function shouldLoadGtm() {
  const vercelEnv = runtimeEnv("VERCEL_ENV");
  if (vercelEnv === "preview" || vercelEnv === "development") {
    return false;
  }
  return runtimeEnv("NODE_ENV") !== "development";
}

// src/next/SignalGtm.tsx
import { SignalBridge } from "@lemon-squared/signal/next-client";
import { jsx as jsx2, jsxs, Fragment } from "react/jsx-runtime";
function SignalGtm({
  gtmId,
  gtmScriptUrl,
  dataLayerName,
  auth,
  preview,
  storage
}) {
  if (!hasGtmConfigured({ gtmId, gtmScriptUrl })) {
    return null;
  }
  const resolved = resolveGtmConfig({ gtmId, gtmScriptUrl });
  if (!resolved) {
    return null;
  }
  const shared = {
    auth,
    dataLayerName,
    preview
  };
  let container = null;
  if (shouldLoadGtm()) {
    container = resolved.gtmScriptUrl ? /* @__PURE__ */ jsx2(GoogleTagManager, {
      ...shared,
      gtmId: resolved.gtmId || undefined,
      gtmScriptUrl: resolved.gtmScriptUrl
    }) : /* @__PURE__ */ jsx2(GoogleTagManager, {
      ...shared,
      gtmId: resolved.gtmId
    });
  }
  return /* @__PURE__ */ jsxs(Fragment, {
    children: [
      /* @__PURE__ */ jsx2(SignalConsentDefaults, {
        storage
      }),
      /* @__PURE__ */ jsx2(SignalBridge, {
        storage
      }),
      container
    ]
  });
}
export {
  SignalGtm,
  SignalConsentDefaults
};
