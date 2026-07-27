"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { AptosConfig, Network } from "@aptos-labs/ts-sdk";

const shelbyNetworkConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: "https://rpc.shelbynet.shelby.xyz/v1",
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      dappConfig={shelbyNetworkConfig}
      onError={(error) => {
        console.log("Wallet connection error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
