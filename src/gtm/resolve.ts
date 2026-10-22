const DEFAULT_GTM_SCRIPT_URL =
  "https://www.googletagmanager.com/gtm.js";

export interface GtmResolveInput {
  gtmId?: string;
  /** First-party / ssGTM script URL (Next `gtmScriptUrl`). */
  gtmScriptUrl?: string;
}

export interface ResolvedGtm {
  gtmId: string;
  gtmScriptUrl?: string;
}

/**
 * Prefer classic GTM container. `gtmScriptUrl` alone supports tag gateway.
 */
export function resolveGtmConfig(
  input: GtmResolveInput
): ResolvedGtm | null {
  const gtmId = input.gtmId?.trim() || "";
  const gtmScriptUrl = input.gtmScriptUrl?.trim() || undefined;

  if (!(gtmId || gtmScriptUrl)) {
    return null;
  }

  return {
    gtmId: gtmId || "",
    gtmScriptUrl:
      gtmScriptUrl && gtmScriptUrl !== DEFAULT_GTM_SCRIPT_URL
        ? gtmScriptUrl
        : undefined,
  };
}

export function hasGtmConfigured(input: GtmResolveInput): boolean {
  return resolveGtmConfig(input) !== null;
}

export { DEFAULT_GTM_SCRIPT_URL };
