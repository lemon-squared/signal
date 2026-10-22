import {
  DEFAULT_COOKIE_NAME,
  DEFAULT_STORAGE_KEY,
  SIGNAL_CONSENT_VERSION,
} from "./constants";
import { CONSENT_DENIED_REGIONS } from "./regions";
import type { StorageConfig } from "./storage";

/**
 * Inline JS that must run before GTM (Consent Initialization).
 *
 * 1. Installs Google's sample-style listener stub (`LemonSignalAddConsentListener`)
 *    so the GTM Consent API template can `callInWindow` before React hydrates.
 * 2. Sets Consent Mode defaults (GB+EEA denied) + restores prior Accept.
 *    Prefer the GTM template's setDefaultConsentState as source of truth once
 *    published; these gtag defaults remain as a safety net.
 */
export function buildConsentBootstrapScript(
  config: StorageConfig = {}
): string {
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

export { CONSENT_DENIED_REGIONS };
