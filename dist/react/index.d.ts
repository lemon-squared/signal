import { ReactElement, ReactNode } from "react";
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
export { useSignalStorage, SignalProviderProps, SignalProvider, CookieBannerProps, CookieBannerCopy, CookieBanner };
