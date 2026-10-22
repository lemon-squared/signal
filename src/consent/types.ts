/** Google Consent Mode v2 storage / ads signals. */
export type ConsentType =
  | "ad_storage"
  | "ad_user_data"
  | "ad_personalization"
  | "analytics_storage"
  | "functionality_storage"
  | "personalization_storage"
  | "security_storage";

export type ConsentValue = "granted" | "denied";

export type ConsentState = Partial<Record<ConsentType, ConsentValue>>;

/**
 * Persisted visitor choice (app categories).
 * Essential is always true; analytics/marketing map to Google consent types.
 */
export interface SignalConsent {
  essential: true;
  /** Maps to analytics_storage (+ personalization_storage). */
  analytics: boolean;
  /** Maps to ad_storage, ad_user_data, ad_personalization. */
  marketing: boolean;
  updatedAt: string;
  version: number;
}

export interface SignalConsentOptions {
  analytics?: boolean;
  marketing?: boolean;
}

/** Cookie payload readable by the GTM Consent API template. */
export interface SignalConsentCookiePayload {
  analyticsConsentGranted: boolean;
  adConsentGranted: boolean;
  adUserDataConsentGranted: boolean;
  adPersonalizationConsentGranted: boolean;
  functionalityConsentGranted: boolean;
  personalizationConsentGranted: boolean;
  securityConsentGranted: boolean;
}
