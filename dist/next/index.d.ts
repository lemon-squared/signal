import { ReactElement } from "react";
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
/**
* Must be rendered from a Server Component layout (App Router).
* Sets Consent Mode defaults before GTM hydrates.
*/
declare function SignalConsentDefaults({ storage }: {
	storage?: StorageConfig;
}): ReactElement;
import { ReactElement as ReactElement2 } from "react";
interface SignalGtmProps {
	gtmId?: string;
	/** ssGTM / first-party gtm.js URL (Next `gtmScriptUrl`). */
	gtmScriptUrl?: string;
	dataLayerName?: string;
	auth?: string;
	preview?: string;
	storage?: StorageConfig;
}
/**
* Consent Mode defaults + Next.js `GoogleTagManager` + LemonSignal bridge.
* Render from a Server Component layout. Do not also mount `GoogleAnalytics`.
*/
declare function SignalGtm({ gtmId, gtmScriptUrl, dataLayerName, auth, preview, storage }: SignalGtmProps): ReactElement2 | null;
export { SignalGtmProps, SignalGtm, SignalConsentDefaults };
