import { GoogleTagManager } from "@next/third-parties/google";
import type { ReactElement } from "react";
import type { StorageConfig } from "../consent/storage";
import {
  hasGtmConfigured,
  resolveGtmConfig,
  shouldLoadGtm,
} from "../gtm/resolve";
import { SignalBridge } from "@lemon-squared/signal/next-client";
import { SignalConsentDefaults } from "./SignalConsentDefaults";

export interface SignalGtmProps {
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
export function SignalGtm({
  gtmId,
  gtmScriptUrl,
  dataLayerName,
  auth,
  preview,
  storage,
}: SignalGtmProps): ReactElement | null {
  if (!hasGtmConfigured({ gtmId, gtmScriptUrl })) {
    return null;
  }

  const resolved = resolveGtmConfig({ gtmId, gtmScriptUrl });
  if (!resolved) {
    return null;
  }

  const shared = {
    auth,
    dataLayerName,
    preview,
  };
  let container: ReactElement | null = null;
  if (shouldLoadGtm()) {
    container = resolved.gtmScriptUrl ? (
      <GoogleTagManager
        {...shared}
        gtmId={resolved.gtmId || undefined}
        gtmScriptUrl={resolved.gtmScriptUrl}
      />
    ) : (
      <GoogleTagManager {...shared} gtmId={resolved.gtmId} />
    );
  }

  return (
    <>
      <SignalConsentDefaults storage={storage} />
      <SignalBridge storage={storage} />
      {container}
    </>
  );
}
