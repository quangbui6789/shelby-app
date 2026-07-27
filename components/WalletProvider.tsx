"use client";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      dappConfig={{
        network: Network.CUSTOM,
        aptosApiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY,
        customNetwork: {
          name: "shelbynet",
          chainId: <CHAIN_ID_CỦA_SHELBYNET>, // bắt buộc, số nguyên
          url: "https://rpc.shelbynet.shelby.xyz/v1",
          // indexer: "https://indexer.shelbynet.shelby.xyz/v1", // nếu Shelby có indexer riêng
        },
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
