"use client";

import type { ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  SIGNAL_CONSENT_OPEN_EVENT,
} from "../consent/constants";
import {
  defaultConsent,
  readConsent,
  type StorageConfig,
  writeConsent,
} from "../consent/storage";

export interface CookieBannerCopy {
  title: string;
  description: ReactNode;
  acceptAll: string;
  essentialOnly: string;
}

export interface CookieBannerProps {
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
export function CookieBanner({
  copy,
  enabled = true,
  storage,
  className,
  acceptFirstOnMobile = true,
}: CookieBannerProps): ReactElement | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }

    const sync = () => {
      setVisible(readConsent(storage) === null);
    };
    sync();

    const onOpen = () => setVisible(true);
    window.addEventListener(SIGNAL_CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(SIGNAL_CONSENT_OPEN_EVENT, onOpen);
  }, [enabled, storage]);

  if (!visible) {
    return null;
  }

  const acceptAll = () => {
    writeConsent(
      defaultConsent({ analytics: true, marketing: true }, storage),
      storage
    );
    setVisible(false);
  };

  const essentialOnly = () => {
    writeConsent(
      defaultConsent({ analytics: false, marketing: false }, storage),
      storage
    );
    setVisible(false);
  };

  const acceptOrder = acceptFirstOnMobile
    ? "order-1 sm:order-2"
    : "order-2 sm:order-1";
  const essentialOrder = acceptFirstOnMobile
    ? "order-2 sm:order-1"
    : "order-1 sm:order-2";

  return (
    <div
      aria-describedby="lemon-signal-banner-desc"
      aria-labelledby="lemon-signal-banner-title"
      className={
        className ??
        "fixed inset-x-0 bottom-0 z-50 border-line border-t bg-surface/95 p-4 shadow-[0_-12px_40px_-24px_rgb(0_0_0/0.35)] backdrop-blur-md sm:p-5"
      }
      role="dialog"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="max-w-2xl">
          <p
            className="font-display font-semibold text-base text-ink"
            id="lemon-signal-banner-title"
          >
            {copy.title}
          </p>
          <p
            className="mt-2 text-mute text-sm leading-relaxed"
            id="lemon-signal-banner-desc"
          >
            {copy.description}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            className={`${acceptOrder} rounded-lg bg-accent px-4 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-accent-hover`}
            onClick={acceptAll}
            type="button"
          >
            {copy.acceptAll}
          </button>
          <button
            className={`${essentialOrder} rounded-lg border border-line px-4 py-2.5 font-semibold text-ink text-sm transition-colors hover:bg-canvas`}
            onClick={essentialOnly}
            type="button"
          >
            {copy.essentialOnly}
          </button>
        </div>
      </div>
    </div>
  );
}
