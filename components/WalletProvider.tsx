import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.CUSTOM,
        aptosApiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY,
        customEndpoints: {
          custom: "https://rpc.shelbynet.shelby.xyz/v1",
        }
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
