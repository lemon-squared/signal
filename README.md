# `@lemon-squared/signal`

Cookie consent banner, Google Consent Mode v2, and the Next.js Google Tag Manager loader for Lemon Squared sites and client projects.

GTM tag templates live in their own repos. This package does not ship template files.

Consent Mode template: [lemon-squared/gtm-template-consent-mode](https://github.com/lemon-squared/gtm-template-consent-mode).

## Install

```bash
bun add @lemon-squared/signal
```

Peer deps for Next apps: `next`, `@next/third-parties`, `react`.

## Next.js App Router

```tsx
import { CookieBanner, SignalProvider } from "@lemon-squared/signal";
import { SignalGtm } from "@lemon-squared/signal/next";

const storage = {
  storageKey: "example-consent",
  cookieName: "lemon_signal_consent",
  version: 1,
  cookieDomain: ".example.com",
};

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <SignalGtm
          gtmId={process.env.NEXT_PUBLIC_GTM_ID}
          storage={storage}
          tag={{ cookieDomain: "example.com", contentGroup: "marketing" }}
        />
        <SignalProvider storage={storage}>
          {children}
          <CookieBanner
            enabled={Boolean(process.env.NEXT_PUBLIC_GTM_ID)}
            storage={storage}
            copy={{ /* site i18n */ }}
          />
        </SignalProvider>
      </body>
    </html>
  );
}
```

- Do not also mount `@next/third-parties` `GoogleAnalytics` when GTM is present. Fire GA4 from a tag inside the container.
- `cookieDomain` shares the consent cookie across subdomains of that parent. Omit it for a host-only cookie. It is ignored on `localhost` and `*.vercel.app`.
- `tag.cookieDomain` is the Google tag `cookie_domain` (no leading dot). `tag.contentGroup` is the GA4 content group. Both are set before the container. The cookie domain is skipped on `localhost` and `*.vercel.app`.
- `SignalGtm` does not load the container during `next dev` or on Vercel preview deployments. Production builds still load it.
- ssGTM: pass the first-party `gtm.js` URL as `gtmScriptUrl`.

## Google tag in GTM

Use one Google tag inside the container. Its tag ID is the GA4 measurement ID. Signal loads that container. The page does not also install `gtag.js` or `@next/third-parties` `GoogleAnalytics`.

Pass the parent domain and this host’s content group into `SignalGtm`:

```tsx
<SignalGtm
  gtmId="GTM-XXXX"
  storage={storage}
  tag={{ cookieDomain: "example.com", contentGroup: "marketing" }}
/>
```

Each public host uses the same `cookieDomain` and its own `contentGroup` (`marketing`, `shop`, `app`, and so on). Before `gtm.js` loads, Signal pushes:

- `content_group` with `gtag('set', …)` and `dataLayer.push({ content_group })`
- `cookie_domain` the same way, only when the hostname is that parent or one of its subdomains

`localhost` and `*.vercel.app` skip `cookie_domain`. `next dev` and Vercel preview do not load the container at all.

A configuration parameter on the Google tag replaces an earlier `gtag('set')`. Set the same cookie domain on the tag so the container keeps the page value. `content_group` changes per host, so the tag reads it from the data layer.

In the container:

1. **Variables → New → Data Layer Variable.** Name it `content_group`. Data Layer Variable Name: `content_group`. Data Layer Version: **Version 2**. Leave the default value empty. The name is case-sensitive. Version 2 reads the object Signal pushes.
2. **Variables → New → Google tag: Configuration Settings.** Name it `Google Tag Configuration Settings`. Add parameter `cookie_domain` = `example.com` with no leading dot.
3. Open the existing **Google tag**. Set **Configuration settings** to that variable. Under **Shared event settings**, add event parameter `content_group` = `{{content_group}}`. Trigger: **Initialization - All Pages**. Consent settings: require `analytics_storage`.
4. Keep the Lemon Signal Consent Mode tag on **Consent Initialization - All Pages** so it runs before the Google tag. Cookie name `lemon_signal_consent`.
5. **Preview** on each production host. After Accept all, the tag shows `cookie_domain` `example.com` and the host’s `content_group`. The `_ga` cookie domain is `.example.com`. Where the region defaults deny analytics, the tag stays blocked until Accept all.
6. **Submit** and **Publish**.

If the tag is still **Google Analytics: GA4 Configuration**, put `cookie_domain` under **Fields to Set** and `content_group` = `{{content_group}}` on that tag’s event parameters. Keep a single Google tag for that measurement ID.

Routes whose URL contains an identifier you must not send to ads should not mount `SignalGtm`. The container records the page location.

## Exports

| Path | Contents |
| --- | --- |
| `@lemon-squared/signal` | consent core, bridge, GTM helpers, React banner/provider |
| `@lemon-squared/signal/next` | `SignalGtm` (server). Skips the container in `next dev` and on Vercel preview |
| `@lemon-squared/signal/next-client` | `SignalBridge`, `sendGTMEvent` |
| `@lemon-squared/signal/react` | React-only entry |
