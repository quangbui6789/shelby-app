"use client";

import { useState, useEffect } from "react";
import { Wallet, ShieldCheck, Zap, ArrowLeftRight, Database, TrendingUp, CheckCircle, ExternalLink } from "lucide-react";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"trade" | "staking" | "storage">("trade");
  
  // Trade States
  const [payAmount, setPayAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Transaction Feedback
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Helper lấy Petra Provider chuẩn
  const getPetraProvider = () => {
    if (typeof window !== "undefined") {
      if ("petra" in window) {
        return (window as any).petra;
      }
      if ("aptos" in window) {
        return (window as any).aptos;
      }
    }
    return null;
  };

  // 1. Kiểm tra ví đã kết nối trước đó chưa
  useEffect(() => {
    const checkAutoConnect = async () => {
      const wallet = getPetraProvider();
      if (wallet) {
        try {
          const isConnected = await wallet.isConnected();
          if (isConnected) {
            const account = await wallet.account();
            setWalletAddress(account.address);
          }
        } catch (err) {
          console.error("Auto connect error:", err);
        }
      }
    };
    checkAutoConnect();
  }, []);

  // 2. Hàm Kết nối Ví Petra Thực tế
  const connectPetraWallet = async () => {
    const wallet = getPetraProvider();
    
    if (!wallet) {
      alert("Petra Wallet not detected! Redirecting to Petra installation...");
      window.open("https://petra.app/", "_blank");
      return;
    }

    try {
      const response = await wallet.connect();
      // Petra trả về object chứa address
      const accountAddress = response.address || (await wallet.account()).address;
      setWalletAddress(accountAddress);
      setStatusMessage("Petra Wallet connected successfully!");
    } catch (error: any) {
      console.error("Petra Connection Error:", error);
      setStatusMessage(`Connection failed: ${error?.message || "User rejected connection"}`);
    }
  };

  // 3. Hàm Thực hiện Giao dịch Thực tế trên Shelby Network
  const handleExecuteTransaction = async () => {
    const wallet = getPetraProvider();

    if (!walletAddress || !wallet) {
      alert("Please connect your Petra wallet first!");
      return;
    }
    if (!payAmount || parseFloat(payAmount) <= 0) {
      alert("Please enter a valid amount to swap.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Awaiting approval in Petra Wallet...");
    setTxHash(null);

    try {
      // Cấu hình Payload Giao dịch chuẩn Move VM cho Shelby / Aptos Core
      const payload = {
        type: "entry_function_payload",
        function: "0x1::coin::transfer", // Hàm chuyển Coin mặc định trên Shelby / Move VM
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: [
          walletAddress, // Gửi thử nghiệm về lại chính ví người dùng
          (parseFloat(payAmount) * 100000000).toString(), // Chuyển đổi sang Octas (decimals = 8)
        ],
      };

      // Gọi Petra ký và gửi Transaction lên On-Chain
      const pendingTransaction = await wallet.signAndSubmitTransaction(payload);
      
      // Nhận Transaction Hash thực
      const hash = pendingTransaction.hash || pendingTransaction;
      setTxHash(hash);
      setStatusMessage("Transaction submitted successfully to Shelby Network!");
    } catch (error: any) {
      console.error("Transaction Error:", error);
      setStatusMessage(`Transaction failed: ${error?.message || "User rejected transaction"}`);
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
            <span className="text-xs text-slate-500">Protocol Ecosystem</span>
          </div>
        </div>

        <button
          onClick={connectPetraWallet}
          className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-teal-400"
        >
          <Wallet className="h-4 w-4" />
          {walletAddress 
            ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
            : "Connect Petra Wallet"}
        </button>
      </header>

      {/* NOTIFICATION & TX HASH DISPLAY */}
      {statusMessage && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-teal-500/30 text-teal-300 text-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle className="h-4 w-4 text-teal-400" /> {statusMessage}
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

      {/* NAVIGATION TABS */}
      <main className="my-8 flex flex-col items-center">
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl mb-8">
          <button
            onClick={() => setActiveTab("trade")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition ${
              activeTab === "trade" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" /> Trade / Swap
          </button>
          <button
            onClick={() => setActiveTab("staking")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition ${
              activeTab === "staking" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="h-4 w-4" /> Staking & Yield
          </button>
          <button
            onClick={() => setActiveTab("storage")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition ${
              activeTab === "storage" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Database className="h-4 w-4" /> Storage Vault
          </button>
        </div>

        {/* TAB 1: SWAP & LIVE ON-CHAIN TRANSACTION */}
        {activeTab === "trade" && (
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Swap on Shelby</h2>
            
            {/* Pay Input */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-2">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>You Pay</span>
                <span>Balance: Connected</span>
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
                <span className="bg-slate-800 px-3 py-1.5 rounded-xl text-sm font-semibold text-teal-400">SBY</span>
              </div>
            </div>

            {/* Receive Input */}
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
              onClick={handleExecuteTransaction}
              disabled={isProcessing}
              className="w-full bg-teal-500 py-4 rounded-2xl font-bold text-slate-950 hover:bg-teal-400 transition disabled:opacity-50"
            >
              {isProcessing ? "Processing in Petra..." : "Execute Swap Transaction"}
            </button>
          </div>
        )}

        {/* TAB 2: STAKING */}
        {activeTab === "staking" && (
          <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-teal-400 font-semibold tracking-wider uppercase">Pool 1</span>
              <h3 className="text-xl font-bold text-white mt-1">Shelby Staking</h3>
              <p className="text-3xl font-extrabold text-teal-400 my-4">12.4% <span className="text-sm text-slate-400 font-normal">APY</span></p>
              <button 
                onClick={handleExecuteTransaction}
                className="w-full bg-slate-800 hover:bg-teal-500 hover:text-slate-950 py-3 rounded-xl text-sm font-bold transition"
              >
                Stake SBY
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-teal-400 font-semibold tracking-wider uppercase">Pool 2</span>
              <h3 className="text-xl font-bold text-white mt-1">Shelby Liquidity Vault</h3>
              <p className="text-3xl font-extrabold text-teal-400 my-4">24.8% <span className="text-sm text-slate-400 font-normal">APY</span></p>
              <button 
                onClick={handleExecuteTransaction}
                className="w-full bg-slate-800 hover:bg-teal-500 hover:text-slate-950 py-3 rounded-xl text-sm font-bold transition"
              >
                Deposit Liquidity
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: STORAGE */}
        {activeTab === "storage" && (
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center">
            <Database className="h-12 w-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Shelby Data Storage</h2>
            <p className="text-sm text-slate-400 mb-6">Permanent decentralized data storage on Shelby Network.</p>
            
            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 mb-4 hover:border-teal-500 transition cursor-pointer">
              <p className="text-xs text-slate-400">Click to upload file payload onto Shelby Chain</p>
            </div>

            <button 
              onClick={handleExecuteTransaction}
              className="w-full bg-teal-500 py-3 rounded-xl font-bold text-slate-950 hover:bg-teal-400 transition text-sm"
            >
              Commit Data On-Chain
            </button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 pt-6 flex justify-between items-center text-xs text-slate-500">
        <p>© 2026 Shelby Protocol. All rights reserved.</p>
        <div className="flex gap-4">
          <span className="hover:text-slate-400 cursor-pointer">Docs</span>
          <span className="hover:text-slate-400 cursor-pointer">Explorer</span>
        </div>
      </footer>
    </div>
  );
}
