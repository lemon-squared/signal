import Script from "next/script";
import type { ReactElement } from "react";
import { buildConsentBootstrapScript } from "../consent/bootstrap";
import type { StorageConfig } from "../consent/storage";
import type { GoogleTagSettings } from "../gtm/resolve";

/**
 * Must be rendered from a Server Component layout (App Router).
 * Sets Consent Mode defaults before GTM hydrates.
 */
export function SignalConsentDefaults({
  storage,
  tag,
}: {
  storage?: StorageConfig;
  tag?: GoogleTagSettings;
}): ReactElement {
  return (
    <Script id="lemon-signal-consent-default" strategy="beforeInteractive">
      {buildConsentBootstrapScript(storage, tag)}
    </Script>
  );
}
