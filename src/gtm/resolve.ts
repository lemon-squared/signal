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

/**
 * `next dev` and Vercel preview/dev deployments must not send hits.
 * A production build still loads the container.
 */
export function shouldLoadGtm(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "preview" || vercelEnv === "development") {
    return false;
  }

  return process.env.NODE_ENV !== "development";
}

export { DEFAULT_GTM_SCRIPT_URL };
