"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      dappConfig={{
        network: Network.CUSTOM,
        aptosApiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY,
        customNetwork: {
          name: "shelbynet",
          chainId: 0, // TODO: thay bằng chainId thật của Shelbynet
          url: "https://rpc.shelbynet.shelby.xyz/v1",
        },
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
