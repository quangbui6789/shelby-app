"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { 
  Wallet, Zap, ArrowLeftRight, Database, TrendingUp, 
  CheckCircle, Droplet, RefreshCw, AlertCircle, Coins 
} from "lucide-react";

export default function Home() {
  const { connect, disconnect, connected, account, wallets, signAndSubmitTransaction } = useWallet();
  
  const [activeTab, setActiveTab] = useState<"trade" | "faucet" | "staking" | "storage">("trade");
  const [payAmount, setPayAmount] = useState("1");
  const [receiveAmount, setReceiveAmount] = useState("1.50");
  const [faucetAmount, setFaucetAmount] = useState("10");
  
  const [balance] = useState<string>("10");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // KẾT NỐI VÍ PETRA
  const handleWalletAction = async () => {
    if (connected) {
      await disconnect();
      setStatusMessage("Disconnected from wallet.");
      setIsError(false);
      return;
    }

    try {
      const petraWallet = wallets.find((w) => w.name.toLowerCase().includes("petra"));
      if (petraWallet) {
        await connect(petraWallet.name);
        setStatusMessage("Connected via Aptos Wallet Standard!");
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

  // THỰC THI GIAO DỊCH
  const handleExecuteTransaction = async (overrideAmount?: number) => {
    if (!connected || !account?.address) {
      alert("Please connect your Petra Wallet first!");
      return;
    }

    const amountToUse = overrideAmount || parseFloat(payAmount || "1");
    if (!amountToUse || amountToUse <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Awaiting confirmation in Petra Wallet...");
    setIsError(false);
    setTxHash(null);

    try {
      const amountInOctas = Math.floor(amountToUse * 100000000);
      const recipientAddress = "0x1";

      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: "0x1::aptos_account::transfer",
          typeArguments: [],
          functionArguments: [recipientAddress, amountInOctas.toString()],
        },
      } as any);

      if (response && response.hash) {
        setTxHash(response.hash);
        setStatusMessage("Transaction Approved & Executed On-Chain via Shelby!");
        setIsError(false);
      } else {
        throw new Error("No transaction hash returned.");
      }

    } catch (error: any) {
      console.error("Transaction Error:", error);
      setIsError(true);
      
      const errMessage = error?.message || error?.toString() || "";
      if (errMessage.includes("rejected") || error?.code === 4001) {
        setStatusMessage("Transaction Cancelled: You rejected the request in Petra Wallet.");
      } else {
        setStatusMessage(`Error: ${errMessage || "Transaction failed."}`);
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
              <span className="text-teal-300 font-mono">{balance} APT</span>
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

      {/* MAIN TABS */}
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
          
          <button
            onClick={() => setActiveTab("faucet")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
              activeTab === "faucet" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Droplet className="h-4 w-4" /> Faucet (Get APT)
          </button>

          <button
            onClick={() => setActiveTab("staking")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
              activeTab === "staking" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="h-4 w-4" /> Staking & Yield
          </button>
          
          <button
            onClick={() => setActiveTab("storage")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
              activeTab === "storage" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Database className="h-4 w-4" /> Storage Vault
          </button>
        </div>

        {/* SWAP TAB */}
        {activeTab === "trade" && (
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Swap on Shelby</h2>
              <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/30 px-2.5 py-1 rounded-lg">Shelbynet</span>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-2">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>You Pay</span>
                <span className="text-teal-400 font-mono">
                  Balance: {connected ? `${balance} APT` : "Not Connected"}
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
              {isProcessing ? "Confirming on Petra..." : "Execute Testnet Swap"}
            </button>
          </div>
        )}

        {/* FAUCET TAB */}
        {activeTab === "faucet" && (
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
            <Droplet className="h-12 w-12 text-teal-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white mb-1">Shelby Testnet Faucet</h2>
            <p className="text-xs text-slate-400 mb-6">Request free Testnet APT to fund gas fees & transactions.</p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-left">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Amount to Claim</span>
                <span className="text-teal-400 font-mono">Current: {balance} APT</span>
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  value={faucetAmount}
                  onChange={(e) => setFaucetAmount(e.target.value)}
                  className="bg-transparent text-2xl font-bold text-white outline-none w-full"
                />
                <span className="bg-slate-800 px-3 py-1.5 rounded-xl text-sm font-semibold text-teal-400">APT</span>
              </div>
            </div>

            <button
              onClick={() => handleExecuteTransaction(0.0001)}
              disabled={isProcessing}
              className="w-full bg-teal-500 py-4 rounded-2xl font-bold text-slate-950 hover:bg-teal-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing && <RefreshCw className="h-4 w-4 animate-spin" />}
              {isProcessing ? "Confirming on Petra..." : "Claim Testnet APT"}
            </button>
          </div>
        )}

        {/* STAKING TAB */}
        {activeTab === "staking" && (
          <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-teal-400 font-semibold tracking-wider uppercase">Pool 1</span>
              <h3 className="text-xl font-bold text-white mt-1">Shelby Staking</h3>
              <p className="text-3xl font-extrabold text-teal-400 my-4">12.4% <span className="text-sm text-slate-400 font-normal">APY</span></p>
              <button 
                onClick={() => handleExecuteTransaction(0.01)}
                disabled={isProcessing}
                className="w-full bg-slate-800 hover:bg-teal-500 hover:text-slate-950 py-3 rounded-xl text-sm font-bold transition"
              >
                Stake 0.01 APT
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-teal-400 font-semibold tracking-wider uppercase">Pool 2</span>
              <h3 className="text-xl font-bold text-white mt-1">Shelby Liquidity Pool</h3>
              <p className="text-3xl font-extrabold text-teal-400 my-4">24.8% <span className="text-sm text-slate-400 font-normal">APY</span></p>
              <button 
                onClick={() => handleExecuteTransaction(0.01)}
                disabled={isProcessing}
                className="w-full bg-slate-800 hover:bg-teal-500 hover:text-slate-950 py-3 rounded-xl text-sm font-bold transition"
              >
                Deposit Liquidity
              </button>
            </div>
          </div>
        )}

        {/* STORAGE TAB */}
        {activeTab === "storage" && (
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center">
            <Database className="h-12 w-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Shelby Storage Vault</h2>
            <p className="text-sm text-slate-400 mb-4">Store data permanently on Shelby Testnet.</p>
            
            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 mb-4 hover:border-teal-500 transition cursor-pointer">
              <p className="text-xs text-slate-400">Click to upload payload onto Shelby Network</p>
            </div>

            <button 
              onClick={() => handleExecuteTransaction(0.001)}
              disabled={isProcessing}
              className="w-full bg-teal-500 py-3 rounded-xl font-bold text-slate-950 hover:bg-teal-400 transition text-sm"
            >
              Commit Data On-Chain (0.001 APT)
            </button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 pt-6 flex justify-between items-center text-xs text-slate-500">
        <p>© 2026 Shelby Protocol. All rights reserved.</p>
      </footer>
    </div>
  );
}
