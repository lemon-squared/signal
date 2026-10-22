/**
 * Parent domain for a shared consent cookie (`Domain=`).
 * Unset means host-only. Never apply on localhost or Vercel previews,
 * and never when the current host is outside the configured parent.
 */
export function resolveCookieDomain(
  cookieDomain: string | undefined,
  hostname: string
): string | undefined {
  if (!cookieDomain) {
    return undefined;
  }

  const domain = cookieDomain.trim().toLowerCase().replace(/^\./, "");
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");

  if (!(domain && host) || !domain.includes(".")) {
    return undefined;
  }

  if (isBlockedHost(domain) || isBlockedHost(host)) {
    return undefined;
  }

  if (host !== domain && !host.endsWith(`.${domain}`)) {
    return undefined;
  }

  return domain;
}

function isBlockedHost(host: string): boolean {
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]" ||
    host === "vercel.app" ||
    host.endsWith(".vercel.app")
  );
}
