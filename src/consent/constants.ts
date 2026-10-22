/** Bump when the consent shape or policy changes (forces re-prompt). */
export const SIGNAL_CONSENT_VERSION = 1;

/** localStorage key (overridable per site). */
export const DEFAULT_STORAGE_KEY = "lemon-signal-consent";

/** First-party cookie for GTM Consent API template `getCookieValues`. */
export const DEFAULT_COOKIE_NAME = "lemon_signal_consent";

export const SIGNAL_CONSENT_CHANGED_EVENT = "lemon-signal:consent-changed";
export const SIGNAL_CONSENT_OPEN_EVENT = "lemon-signal:consent-open";

/** Cookie max-age (1 year). */
export const CONSENT_COOKIE_MAX_AGE_SECONDS: number = 60 * 60 * 24 * 365;
