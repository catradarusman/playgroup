"use client";

import { ReactNode, useState } from "react";
import { Provider as JotaiProvider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import {
  InitializeFarcasterMiniApp,
  useInitializeFarcasterApp,
} from "@/neynar-farcaster-sdk/mini";
import {
  PRIVY_APP_ID,
  PRIVY_APPEARANCE,
  PRIVY_LOGIN_METHODS,
  PRIVY_WALLET_CONFIG,
  isPrivyConfigured,
} from "@/lib/privy";

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
        {isPrivyConfigured() ? (
          <PrivyProvider
            appId={PRIVY_APP_ID}
            config={{
              appearance: PRIVY_APPEARANCE,
              loginMethods: PRIVY_LOGIN_METHODS as unknown as string[],
              embeddedWallets: PRIVY_WALLET_CONFIG,
              // Support Base chain for future $PLAY token
              defaultChain: {
                id: 8453,
                name: 'Base',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: {
                  default: { http: ['https://mainnet.base.org'] },
                },
              } as any,
            }}
          >
            {content}
          </PrivyProvider>
        ) : (
          content
        )}
        {/* and here */}
      </QueryClientProvider>
    </JotaiProvider>
  );
}
