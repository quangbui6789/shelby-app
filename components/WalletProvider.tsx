"use client";

import React from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

const SHELBY_RPC = "https://api.shelbynet.shelby.xyz/v1";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      optInWallets={["Petra"]}
      dappConfig={{
        network: Network.DEVNET, // Dùng DEVNET làm fallback định danh mạng ví để không bị Petra crash
        aptosConfig: {
          network: Network.CUSTOM,
          fullnode: SHELBY_RPC,
        },
      }}
      onError={(error) => {
        // Bắt và bỏ qua lỗi Network mismatch background từ ví Petra
        console.warn("Wallet adapter background error suppressed:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
