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
 * Runtime env read. The bundle defines `process.env.NODE_ENV` as
 * "production", so a direct read is compiled away.
 */
function runtimeEnv(name: string): string | undefined {
  return process.env[name];
}

/**
 * `next dev` and Vercel preview/dev deployments must not send hits.
 * A production build still loads the container.
 */
export function shouldLoadGtm(): boolean {
  const vercelEnv = runtimeEnv("VERCEL_ENV");
  if (vercelEnv === "preview" || vercelEnv === "development") {
    return false;
  }

  return runtimeEnv("NODE_ENV") !== "development";
}

export { DEFAULT_GTM_SCRIPT_URL };
