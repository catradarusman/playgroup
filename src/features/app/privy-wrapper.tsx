"use client";

import { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import {
  PRIVY_APP_ID,
  PRIVY_APPEARANCE,
  PRIVY_LOGIN_METHODS,
  PRIVY_WALLET_CONFIG,
} from "@/lib/privy";

export default function PrivyWrapper({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: PRIVY_APPEARANCE,
        loginMethods: [...PRIVY_LOGIN_METHODS],
        embeddedWallets: PRIVY_WALLET_CONFIG,
        // Support Base chain for future $PLAY token
        defaultChain: {
          id: 8453,
          name: "Base",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: {
            default: { http: ["https://mainnet.base.org"] },
          },
        } as any,
      }}
    >
      {children}
    </PrivyProvider>
  );
}
