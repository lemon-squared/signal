"use client";

import {
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { installLemonSignalBridge } from "../bridge";
import type { StorageConfig } from "../consent/storage";

const SignalContext = createContext<StorageConfig>({});

export interface SignalProviderProps {
  children: ReactNode;
  storage?: StorageConfig;
}

/**
 * Installs the LemonSignal bridge and provides storage config to descendants.
 */
export function SignalProvider({
  children,
  storage,
}: SignalProviderProps): ReactElement {
  const value = useMemo(() => storage ?? {}, [storage]);

  useEffect(() => {
    installLemonSignalBridge(value);
  }, [value]);

  return (
    <SignalContext.Provider value={value}>{children}</SignalContext.Provider>
  );
}

export function useSignalStorage(): StorageConfig {
  return useContext(SignalContext);
}
