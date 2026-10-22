"use client";

import { useEffect, type ReactElement } from "react";
import { installLemonSignalBridge } from "../bridge";
import type { StorageConfig } from "../consent/storage";

/** Client-only: installs `window.LemonSignal` for the GTM consent template. */
export function SignalBridge({
  storage,
}: {
  storage?: StorageConfig;
}): ReactElement | null {
  useEffect(() => {
    installLemonSignalBridge(storage);
  }, [storage]);
  return null;
}
