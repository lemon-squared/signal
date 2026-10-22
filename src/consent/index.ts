export {
  CONSENT_COOKIE_MAX_AGE_SECONDS,
  DEFAULT_COOKIE_NAME,
  DEFAULT_STORAGE_KEY,
  SIGNAL_CONSENT_CHANGED_EVENT,
  SIGNAL_CONSENT_OPEN_EVENT,
  SIGNAL_CONSENT_VERSION,
} from "./constants";
export {
  buildConsentBootstrapScript,
} from "./bootstrap";
export {
  consentToCookiePayload,
  consentToGoogleState,
  DENIED_OPTIONAL,
  GRANTED_ALL,
} from "./map";
export {
  CONSENT_DENIED_REGIONS,
  REGION_DENIED_TYPES,
} from "./regions";
export { resolveCookieDomain } from "./cookie-domain";
export {
  clearConsent,
  defaultConsent,
  openConsentPreferences,
  readConsent,
  writeConsent,
  type StorageConfig,
} from "./storage";
export type {
  ConsentState,
  ConsentType,
  ConsentValue,
  SignalConsent,
  SignalConsentCookiePayload,
  SignalConsentOptions,
} from "./types";
