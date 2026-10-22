# `@lemonsquared/signal`

Cookie consent banner, Google Consent Mode v2, and the Next.js Google Tag Manager loader for Lemon Squared sites and client projects.

GTM tag templates live in their own repos. This package does not ship template files.

Consent Mode template: [lemon-squared/gtm-template-consent-mode](https://github.com/lemon-squared/gtm-template-consent-mode).

## Install

```bash
bun add @lemonsquared/signal
```

Peer deps for Next apps: `next`, `@next/third-parties`, `react`.

## Next.js App Router

```tsx
import { CookieBanner, SignalProvider } from "@lemonsquared/signal";
import { SignalGtm } from "@lemonsquared/signal/next";

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
        <SignalGtm gtmId={process.env.NEXT_PUBLIC_GTM_ID} storage={storage} />
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
- `SignalGtm` does not load the container during `next dev` or on Vercel preview deployments. Production builds still load it.
- ssGTM: pass the first-party `gtm.js` URL as `gtmScriptUrl`.

## Exports

| Path | Contents |
| --- | --- |
| `@lemonsquared/signal` | consent core, bridge, GTM helpers, React banner/provider |
| `@lemonsquared/signal/next` | `SignalGtm`, `sendGTMEvent` |
| `@lemonsquared/signal/react` | React-only entry |
