import { sendGTMEvent } from "@next/third-parties/google";
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
/** Client-only: installs `window.LemonSignal` for the GTM consent template. */
declare function SignalBridge({ storage }: {
	storage?: StorageConfig;
}): ReactElement | null;
export { sendGTMEvent, SignalBridge };
