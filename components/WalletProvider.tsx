"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      dappConfig={{
        network: Network.CUSTOM,
        // Dùng đúng URL hiển thị trên ví Petra của bạn:
        customNetworkUrl: "https://api.shelbynet.shelby.xyz/v1",
        aptosApiKeys: {
          custom: process.env.NEXT_PUBLIC_SHELBY_API_KEY,
        },
      }}
      onError={(error) => {
        // Bắt lỗi nhẹ để không bắn màn hình đỏ ngắt kết nối
        console.log("Wallet connection status:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
