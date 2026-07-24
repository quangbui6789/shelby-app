"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Wallet, Zap, ArrowLeftRight, Database, TrendingUp, CheckCircle, Droplet, RefreshCw, AlertCircle, Coins } from "lucide-react";

export default function Home() {
  const { connect, disconnect, connected, account, signAndSubmitTransaction, wallets } = useWallet();
  
  const [activeTab, setActiveTab] = useState<"trade" | "faucet" | "staking" | "storage">("trade");
  const [payAmount, setPayAmount] = useState("1");
  const [receiveAmount, setReceiveAmount] = useState("1.50");
  const [faucetAmount, setFaucetAmount] = useState("1");
  
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Read balance directly from Petra Wallet Extension
  const fetchBalance = useCallback(async () => {
    if (!account?.address) {
      setBalance(null);
      return;
    }

    setIsLoadingBalance(true);
    try {
      if (typeof window !== "undefined" && (window as any).aptos) {
        const petra = (window as any).aptos;
        const resources = await petra.getAccountResources(account.address);
        const accountResource = resources.find((r: any) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
        if (accountResource) {
          const amountOctas = accountResource.data.coin.value;
          setBalance(parseFloat((parseInt(amountOctas) / 100000000).toFixed(4)));
        }
      }
    } catch (err) {
      console.warn("Could not query balance from Petra extension resources", err);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [account?.address]);

  useEffect(() => {
    if (connected && account?.address) {
      fetchBalance();
    }
  }, [connected, account?.address, fetchBalance]);

  const handleWalletAction = async () => {
    if (connected) {
      await disconnect();
      setBalance(null);
      setStatusMessage("Disconnected from wallet.");
      setIsError(false);
      return;
    }

    try {
      const petraWallet = wallets.find((w) => w.name.toLowerCase().includes("petra"));
      if (petraWallet) {
        await connect(petraWallet.name);
        setStatusMessage("Successfully connected to Petra Wallet!");
        setIsError(false);
      } else {
        alert("Petra Wallet extension not found!");
        window.open("https://petra.app/", "_blank");
      }
    } catch (error: any) {
      setStatusMessage(`Connection failed: ${error?.message || "User cancelled"}`);
      setIsError(true);
    }
  };

  // ⚡ BẮT BUỘC BẬT POPUP CONFIRM CỦA VÍ PETRA ⚡
  const handleExecuteTransaction = async (overrideAmount?: number) => {
    if (!connected || !account) {
      alert("Please connect your Petra Wallet first!");
      return;
    }

    const amountToUse = overrideAmount || parseFloat(payAmount || "1");

    if (!amountToUse || amountToUse <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Awaiting confirmation in Petra Wallet Extension... Please check pop-up!");
    setIsError(false);
    setTxHash(null);

    try {
      const amountInOctas = Math.floor(amountToUse * 100000000);

      // Gọi trực tiếp Provider của Petra Extension để ép mở Pop-up Approve
      if (typeof window !== "undefined" && (window as any).aptos) {
        const petra = (window as any).aptos;

        // Payload định dạng chuẩn tương thích với Petra Extension Custom RPC
        const transaction = {
          arguments: [account.address, amountInOctas.toString()],
          function: "0x1::aptos_account::transfer",
          type: "entry_function_payload",
          type_arguments: [],
        };

        const pendingTransaction = await petra.signAndSubmitTransaction(transaction);
        
        setTxHash(pendingTransaction.hash);
        setStatusMessage("Transaction submitted & confirmed on-chain via Petra!");
        setIsError(false);

        // Fetch lại balance từ Ví
        setTimeout(() => fetchBalance(), 2000);
      } else {
        // Fallback Wallet Adapter
        const response = await signAndSubmitTransaction({
          data: {
            function: "0x1::aptos_account::transfer",
            typeArguments: [],
            functionArguments: [account.address, amountInOctas],
          },
        } as any);

        setTxHash((response as any)?.hash || "Confirmed");
        setStatusMessage("Transaction confirmed!");
        setIsError(false);
        setTimeout(() => fetchBalance(), 2000);
      }
    } catch (error: any) {
      console.error("Petra Transaction Error:", error);
      setIsError(true);
      if (error?.message?.includes("User rejected") || error?.code === 4001) {
        setStatusMessage("Transaction cancelled: You rejected the request in Petra Wallet.");
      } else {
        setStatusMessage(`On-Chain Error: ${error?.message || error || "Execution error"}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between p-4 md:p-10 max-w-7xl mx-auto">
      {/* HEADER */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500 p-2 rounded-xl text-slate-950">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-wider text-teal-400 block">SHELBY</span>
            <span className="text-xs text-slate-500">Testnet Ecosystem</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {connected && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold">
              <Coins className="h-4 w-4 text-teal-400" />
              <span className="text-slate-400">Balance:</span>
              <span className="text-teal-300 font-mono">
                {isLoadingBalance ? "Loading..." : `${balance ?? 0} APT`}
              </span>
              <button onClick={fetchBalance} title="Refresh balance" className="ml-1 text-slate-500 hover:text-teal-400">
                <RefreshCw className={`h-3 w-3 ${isLoadingBalance ? "animate-spin" : ""}`} />
              </button>
            </div>
          )}

          <button
            onClick={handleWalletAction}
            className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-teal-400"
          >
            <Wallet className="h-4 w-4" />
            {connected && account
              ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
              : "Connect Petra Wallet"}
          </button>
        </div>
      </header>

      {/* NOTIFICATION BOX */}
      {statusMessage && (
        <div className={`mt-4 p-4 rounded-xl border text-sm ${
          isError ? "bg-rose-950/40 border-rose-500/40 text-rose-300" : "bg-slate-900 border-teal-500/30 text-teal-300"
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-2 font-medium">
              {isError ? <AlertCircle className="h-4 w-4 text-rose-400" /> : <CheckCircle className="h-4 w-4 text-teal-400" />}
              {statusMessage}
            </span>
            <button onClick={() => setStatusMessage(null)} className="text-xs text-slate-400 hover:text-white">Dismiss</button>
          </div>

          {txHash && (
            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Tx Hash:</span>
              <span className="text-teal-400 truncate max-w-xs">{txHash}</span>
            </div>
          )}
        </div>
      )}

      {/* TABS */}
      <main className="my-8 flex flex-col items-center">
        <div className="flex flex-wrap justify-center bg-slate-900 border border-slate-800 p-1.5 rounded-2xl mb-8 gap-1">
          <button
            onClick={() => setActiveTab("trade")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
              activeTab === "trade" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" /> Trade / Swap
          </button>
        </div>

        {/* SWAP */}
        {activeTab === "trade" && (
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Swap on Shelby</h2>
              <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/30 px-2.5 py-1 rounded-lg">Testnet</span>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-2">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>You Pay</span>
                <span className="text-teal-400 font-mono">
                  Balance: {connected ? (balance !== null ? `${balance} APT` : "Loading...") : "Not Connected"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <input
                  type="number"
                  placeholder="0.0"
                  value={payAmount}
                  onChange={(e) => {
                    setPayAmount(e.target.value);
                    setReceiveAmount((parseFloat(e.target.value || "0") * 1.5).toFixed(2));
                  }}
                  className="bg-transparent text-2xl font-bold text-white outline-none w-full"
                />
                <span className="bg-slate-800 px-3 py-1.5 rounded-xl text-sm font-semibold text-teal-400">APT</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>You Receive (Estimated)</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <input
                  type="number"
                  readOnly
                  value={receiveAmount}
                  placeholder="0.0"
                  className="bg-transparent text-2xl font-bold text-white outline-none w-full"
                />
                <span className="bg-slate-800 px-3 py-1.5 rounded-xl text-sm font-semibold text-emerald-400">USDC</span>
              </div>
            </div>

            <button
              onClick={() => handleExecuteTransaction()}
              disabled={isProcessing}
              className="w-full bg-teal-500 py-4 rounded-2xl font-bold text-slate-950 hover:bg-teal-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing && <RefreshCw className="h-4 w-4 animate-spin" />}
              {isProcessing ? "Confirming in Petra Wallet..." : "Execute Testnet Swap"}
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 pt-6 flex justify-between items-center text-xs text-slate-500">
        <p>© 2026 Shelby Protocol. All rights reserved.</p>
      </footer>
    </div>
  );
}
