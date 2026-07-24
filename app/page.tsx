"use client";

import { useState, useEffect } from "react";
import { Wallet, ShieldCheck, Zap, Layers, Database, Send, RefreshCw } from "lucide-react";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isTransacting, setIsTransacting] = useState(false);

  // Check and retrieve wallet address if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && (window as any).aptos) {
        try {
          const isConnected = await (window as any).aptos.isConnected();
          if (isConnected) {
            const account = await (window as any).aptos.account();
            setWalletAddress(account.address);
          }
        } catch (e) {
          console.error("Error checking wallet connection:", e);
        }
      }
    };
    checkConnection();
  }, []);

  // 1. Connect Real Wallet (Petra / Aptos-compatible Wallet)
  const connectWallet = async () => {
    setIsConnecting(true);
    if (typeof window !== "undefined" && (window as any).aptos) {
      try {
        const response = await (window as any).aptos.connect();
        setWalletAddress(response.address);
      } catch (error) {
        console.error("User cancelled connection or error occurred:", error);
      }
    } else {
      alert("Aptos/Shelby wallet not found! Please install the Petra Wallet extension on Chrome.");
      window.open("https://petra.app/", "_blank");
    }
    setIsConnecting(false);
  };

  // 2. Execute Transaction on Shelby Protocol
  const handleExecuteTransaction = async () => {
    if (!walletAddress) {
      alert("Please connect your wallet first!");
      return;
    }

    setIsTransacting(true);
    setTxHash(null);

    try {
      // Transaction Payload aligned with Shelby / Move VM standard
      const payload = {
        type: "entry_function_payload",
        function: "0x1::coin::transfer", // Replace with Shelby Protocol's smart contract address if needed
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: [
          walletAddress, // Test transfer back to connected wallet
          "1000" // Amount in Octas (0.00001 Token)
        ],
      };

      // Request wallet to sign and submit transaction to chain
      const pendingTransaction = await (window as any).aptos.signAndSubmitTransaction(payload);
      
      // Receive Transaction Hash
      setTxHash(pendingTransaction.hash);
      alert("Transaction submitted successfully!");
    } catch (error) {
      console.error("Transaction execution failed:", error);
      alert("Transaction rejected or failed!");
    } finally {
      setIsTransacting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between p-6 md:p-12 max-w-7xl mx-auto">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500 p-2 rounded-xl text-slate-950">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-wider text-teal-400">SHELBY DAPP</span>
        </div>

        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-2.5 font-medium text-slate-950 transition hover:bg-teal-400 disabled:opacity-50"
        >
          <Wallet className="h-4 w-4" />
          {walletAddress 
            ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
            : isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      </header>

      <main className="my-12 flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold text-teal-400 mb-6">
          <ShieldCheck className="h-4 w-4" /> Live on Shelby Network
        </span>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
          Shelby Protocol Interactor
        </h1>
        
        <p className="max-w-2xl text-slate-400 text-base md:text-lg mb-8">
          Interact directly with smart contracts and execute Web3 transactions on Shelby infrastructure.
        </p>

        {/* Transaction Panel */}
        <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 mb-12">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-center gap-2">
            <Send className="h-5 w-5 text-teal-400" /> Execute Transaction
          </h3>
          
          <button
            onClick={handleExecuteTransaction}
            disabled={!walletAddress || isTransacting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 font-semibold text-slate-950 transition hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {isTransacting ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" /> Processing on Chain...
              </>
            ) : (
              "Send Test Transaction"
            )}
          </button>

          {txHash && (
            <div className="mt-4 p-3 rounded-lg bg-teal-950/50 border border-teal-500/30 text-xs text-left overflow-hidden">
              <p className="text-teal-400 font-semibold mb-1">Transaction Hash (Tx Hash):</p>
              <p className="font-mono text-slate-300 truncate">{txHash}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <Layers className="h-8 w-8 text-teal-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">High Throughput</h3>
            <p className="text-sm text-slate-400">Parallel transaction execution with ultra-low latency.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <ShieldCheck className="h-8 w-8 text-teal-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Move Smart Contract</h3>
            <p className="text-sm text-slate-400">Safe and verifiable smart contract execution powered by Move language.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <Database className="h-8 w-8 text-teal-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">On-Chain Data</h3>
            <p className="text-sm text-slate-400">Direct real-time state reads and contract storage updates.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 pt-6 flex justify-between items-center text-xs text-slate-500">
        <p>© 2026 Shelby Project. All rights reserved.</p>
      </footer>
    </div>
  );
}
