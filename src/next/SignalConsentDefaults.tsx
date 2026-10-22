import Script from "next/script";
import type { ReactElement } from "react";
import { buildConsentBootstrapScript } from "../consent/bootstrap";
import type { StorageConfig } from "../consent/storage";

/**
 * Must be rendered from a Server Component layout (App Router).
 * Sets Consent Mode defaults before GTM hydrates.
 */
export function SignalConsentDefaults({
  storage,
}: {
  storage?: StorageConfig;
}): ReactElement {
  return (
    <Script id="lemon-signal-consent-default" strategy="beforeInteractive">
      {buildConsentBootstrapScript(storage)}
    </Script>
  );
}
