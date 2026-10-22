import type {
  ConsentState,
  SignalConsent,
  SignalConsentCookiePayload,
} from "./types";

export function consentToGoogleState(consent: SignalConsent): ConsentState {
  const analytics = consent.analytics ? "granted" : "denied";
  const marketing = consent.marketing ? "granted" : "denied";
  return {
    security_storage: "granted",
    functionality_storage: "granted",
    analytics_storage: analytics,
    personalization_storage: analytics,
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
  };
}

export function consentToCookiePayload(
  consent: SignalConsent
): SignalConsentCookiePayload {
  return {
    securityConsentGranted: true,
    functionalityConsentGranted: true,
    analyticsConsentGranted: consent.analytics,
    personalizationConsentGranted: consent.analytics,
    adConsentGranted: consent.marketing,
    adUserDataConsentGranted: consent.marketing,
    adPersonalizationConsentGranted: consent.marketing,
  };
}

/** Denied defaults for advanced Consent Mode (before choice). */
export const DENIED_OPTIONAL: ConsentState = {
  ad_personalization: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  analytics_storage: "denied",
  personalization_storage: "denied",
  functionality_storage: "granted",
  security_storage: "granted",
};

export const GRANTED_ALL: ConsentState = {
  ad_personalization: "granted",
  ad_storage: "granted",
  ad_user_data: "granted",
  analytics_storage: "granted",
  personalization_storage: "granted",
  functionality_storage: "granted",
  security_storage: "granted",
};
