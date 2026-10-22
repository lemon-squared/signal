import { ReactElement, ReactNode } from "react";
/** Google Consent Mode v2 storage / ads signals. */
type ConsentType = "ad_storage" | "ad_user_data" | "ad_personalization" | "analytics_storage" | "functionality_storage" | "personalization_storage" | "security_storage";
type ConsentValue = "granted" | "denied";
type ConsentState = Partial<Record<ConsentType, ConsentValue>>;
/**
* Persisted visitor choice (app categories).
* Essential is always true; analytics/marketing map to Google consent types.
*/
interface SignalConsent {
	essential: true;
	/** Maps to analytics_storage (+ personalization_storage). */
	analytics: boolean;
	/** Maps to ad_storage, ad_user_data, ad_personalization. */
	marketing: boolean;
	updatedAt: string;
	version: number;
}
interface SignalConsentOptions {
	analytics?: boolean;
	marketing?: boolean;
}
/** Cookie payload readable by the GTM Consent API template. */
interface SignalConsentCookiePayload {
	analyticsConsentGranted: boolean;
	adConsentGranted: boolean;
	adUserDataConsentGranted: boolean;
	adPersonalizationConsentGranted: boolean;
	functionalityConsentGranted: boolean;
	personalizationConsentGranted: boolean;
	securityConsentGranted: boolean;
}
interface StorageConfig {
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
declare function defaultConsent(options?: SignalConsentOptions, config?: StorageConfig): SignalConsent;
declare function readConsent(config?: StorageConfig): SignalConsent | null;
declare function writeConsent(consent: SignalConsent, config?: StorageConfig): void;
declare function clearConsent(config?: StorageConfig): void;
declare function openConsentPreferences(): void;
interface CookieBannerCopy {
	title: string;
	description: ReactNode;
	acceptAll: string;
	essentialOnly: string;
}
interface CookieBannerProps {
	copy: CookieBannerCopy;
	/** When false, banner never shows. */
	enabled?: boolean;
	storage?: StorageConfig;
	className?: string;
	/** Accept All is first on mobile (order-1); Essential second. */
	acceptFirstOnMobile?: boolean;
}
/**
* Copy-agnostic consent banner. Wire i18n / policy links via `copy.description`.
*/
declare function CookieBanner({ copy, enabled, storage, className, acceptFirstOnMobile }: CookieBannerProps): ReactElement | null;
import { ReactElement as ReactElement2, ReactNode as ReactNode2 } from "react";
interface SignalProviderProps {
	children: ReactNode2;
	storage?: StorageConfig;
}
/**
* Installs the LemonSignal bridge and provides storage config to descendants.
*/
declare function SignalProvider({ children, storage }: SignalProviderProps): ReactElement2;
declare function useSignalStorage(): StorageConfig;
type ConsentListener = (payload: SignalConsentCookiePayload) => void;
interface LemonSignalBridge {
	addConsentListener: (callback: ConsentListener) => void;
	getConsent: () => SignalConsent | null;
}
/**
* Installs `window.LemonSignal` + flat `LemonSignalAddConsentListener`
* for the GTM Consent API template (`callInWindow`).
* Safe to call after the early bootstrap stub — reuses the same listener array.
*/
declare function installLemonSignalBridge(config?: StorageConfig): LemonSignalBridge;
/** Bump when the consent shape or policy changes (forces re-prompt). */
declare const SIGNAL_CONSENT_VERSION = 1;
/** localStorage key (overridable per site). */
declare const DEFAULT_STORAGE_KEY = "lemon-signal-consent";
/** First-party cookie for GTM Consent API template `getCookieValues`. */
declare const DEFAULT_COOKIE_NAME = "lemon_signal_consent";
declare const SIGNAL_CONSENT_CHANGED_EVENT = "lemon-signal:consent-changed";
declare const SIGNAL_CONSENT_OPEN_EVENT = "lemon-signal:consent-open";
/** Cookie max-age (1 year). */
declare const CONSENT_COOKIE_MAX_AGE_SECONDS: number;
/**
* ISO 3166-1 alpha-2 regions where consent banners typically apply
* and Consent Mode defaults should deny analytics/ads storage.
*/
declare const CONSENT_DENIED_REGIONS: readonly string[];
/** Consent types denied by default in CONSENT_DENIED_REGIONS. */
declare const REGION_DENIED_TYPES: readonly ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage", "personalization_storage"];
declare const DEFAULT_GTM_SCRIPT_URL = "https://www.googletagmanager.com/gtm.js";
/** Values set before the container so the Google tag can share a client id. */
interface GoogleTagSettings {
	/** `cookie_domain` without a leading dot, for example `runur.co.uk`. */
	cookieDomain?: string;
	/** GA4 content group for this host, for example `shop`. */
	contentGroup?: string;
}
interface GtmResolveInput {
	gtmId?: string;
	/** First-party / ssGTM script URL (Next `gtmScriptUrl`). */
	gtmScriptUrl?: string;
}
interface ResolvedGtm {
	gtmId: string;
	gtmScriptUrl?: string;
}
/**
* Prefer classic GTM container. `gtmScriptUrl` alone supports tag gateway.
*/
declare function resolveGtmConfig(input: GtmResolveInput): ResolvedGtm | null;
declare function hasGtmConfigured(input: GtmResolveInput): boolean;
/**
* `next dev` and Vercel preview/dev deployments must not send hits.
* A production build still loads the container.
*/
declare function shouldLoadGtm(): boolean;
/**
* Inline JS that must run before GTM (Consent Initialization).
*
* 1. Installs Google's sample-style listener stub (`LemonSignalAddConsentListener`)
*    so the GTM Consent API template can `callInWindow` before React hydrates.
* 2. Sets Consent Mode defaults (GB+EEA denied) + restores prior Accept.
*    Prefer the GTM template's setDefaultConsentState as source of truth once
*    published; these gtag defaults remain as a safety net.
*/
declare function buildConsentBootstrapScript(config?: StorageConfig, tag?: GoogleTagSettings): string;
declare function consentToGoogleState(consent: SignalConsent): ConsentState;
declare function consentToCookiePayload(consent: SignalConsent): SignalConsentCookiePayload;
/** Denied defaults for advanced Consent Mode (before choice). */
declare const DENIED_OPTIONAL: ConsentState;
declare const GRANTED_ALL: ConsentState;
/**
* Parent domain for a shared consent cookie (`Domain=`).
* Unset means host-only. Never apply on localhost or Vercel previews,
* and never when the current host is outside the configured parent.
*/
declare function resolveCookieDomain(cookieDomain: string | undefined, hostname: string): string | undefined;
export { writeConsent, useSignalStorage, shouldLoadGtm, resolveGtmConfig, resolveCookieDomain, readConsent, openConsentPreferences, installLemonSignalBridge, hasGtmConfigured, defaultConsent, consentToGoogleState, consentToCookiePayload, clearConsent, buildConsentBootstrapScript, StorageConfig, SignalProviderProps, SignalProvider, SignalConsentOptions, SignalConsentCookiePayload, SignalConsent, SIGNAL_CONSENT_VERSION, SIGNAL_CONSENT_OPEN_EVENT, SIGNAL_CONSENT_CHANGED_EVENT, ResolvedGtm, REGION_DENIED_TYPES, LemonSignalBridge, GtmResolveInput, GoogleTagSettings, GRANTED_ALL, DENIED_OPTIONAL, DEFAULT_STORAGE_KEY, DEFAULT_GTM_SCRIPT_URL, DEFAULT_COOKIE_NAME, CookieBannerProps, CookieBannerCopy, CookieBanner, ConsentValue, ConsentType, ConsentState, ConsentListener, CONSENT_DENIED_REGIONS, CONSENT_COOKIE_MAX_AGE_SECONDS };
