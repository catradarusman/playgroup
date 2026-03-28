"use client";

import { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";

// Privy 3.x renders SVG icons using the HTML attribute `clip-path` instead of
// React's camelCase `clipPath`, which triggers a React Console Error in dev.
// That error causes Next.js's dev overlay to appear on top of the login modal,
// making it look like sign-in is broken. Suppress this specific warning until
// Privy ships a fix upstream.
if (typeof console !== "undefined") {
  const _orig = console.error.bind(console);
  console.error = (...args: Parameters<typeof console.error>) => {
    if (typeof args[0] === "string" && args[0].includes("clip-path")) return;
    _orig(...args);
  };
}
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
