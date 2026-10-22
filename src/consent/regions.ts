/**
 * ISO 3166-1 alpha-2 regions where consent banners typically apply
 * and Consent Mode defaults should deny analytics/ads storage.
 */
export const CONSENT_DENIED_REGIONS: readonly string[] = [
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
  "SE",
] as const;

/** Consent types denied by default in CONSENT_DENIED_REGIONS. */
export const REGION_DENIED_TYPES = [
  "ad_storage",
  "ad_user_data",
  "ad_personalization",
  "analytics_storage",
  "personalization_storage",
] as const;
