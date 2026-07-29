"use client";

import React from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

const SHELBY_RPC = "https://api.shelbynet.shelby.xyz/v1";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false} // Tắt autoConnect để tránh tự động kết nối mạng lỗi lúc tải trang
      optInWallets={["Petra"]}
      dappConfig={{
        network: Network.DEVNET, // Dùng fallback network chuẩn của SDK để tránh crash
        aptosConfig: {
          network: Network.CUSTOM,
          fullnode: SHELBY_RPC,
        },
      }}
      onError={(error) => {
        // Bắt lỗi toàn cục của Wallet Adapter để chặn sập app React
        console.warn("Wallet Adapter caught error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
