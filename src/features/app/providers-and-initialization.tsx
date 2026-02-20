"use client";

import { ReactNode, useState, lazy, Suspense } from "react";
import { Provider as JotaiProvider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  InitializeFarcasterMiniApp,
  useInitializeFarcasterApp,
} from "@/neynar-farcaster-sdk/mini";

// Check if Privy is configured at build time
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
const isPrivyConfigured = Boolean(PRIVY_APP_ID);

// Lazy load Privy only when configured to avoid loading broken dependencies
const PrivyWrapper = isPrivyConfigured
  ? lazy(() => import("./privy-wrapper"))
  : null;

export function ProvidersAndInitialization({
  children,
}: {
  children: ReactNode;
}) {
  useInitializeFarcasterApp();
  const [queryClient] = useState(() => new QueryClient());

  // Wrap content with Privy if configured
  const content = (
    <>
      {/* LLMs: Do not remove, initialization must be last, before children */}
      <InitializeFarcasterMiniApp />
      {children}
      {/* End Do not remove */}
    </>
  );

  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        {/* LLMs: Add additional providers between here */}
        {PrivyWrapper ? (
          <Suspense fallback={content}>
            <PrivyWrapper>{content}</PrivyWrapper>
          </Suspense>
        ) : (
          content
        )}
        {/* and here */}
      </QueryClientProvider>
    </JotaiProvider>
  );
}
