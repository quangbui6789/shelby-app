"use client";

import { useState } from "react";
import { Wallet, ShieldCheck, Zap, ArrowLeftRight, Database, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"trade" | "staking" | "storage">("trade");
  
  // Trade Form States
  const [payAmount, setPayAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  
  // Status States
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Connect Wallet Function
  const connectWallet = async () => {
    try {
      if (typeof window !== "undefined" && (window as any).aptos) {
        const response = await (window as any).aptos.connect();
        setWalletAddress(response.address || response.account);
        setStatusMessage("Wallet connected successfully!");
      } else {
        // Fallback demo connection if extension is not installed
        const demoAddress = "0x7a8b...9c0d";
        setWalletAddress(demoAddress);
        setStatusMessage("Connected with Demo Wallet (Install Petra Wallet for live transactions).");
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      setStatusMessage("Failed to connect wallet.");
    }
  };

  // Handle Trade Action
  const handleTrade = () => {
    if (!walletAddress) {
      alert("Please connect your wallet first!");
      return;
    }
    if (!payAmount) {
      alert("Please enter an amount to trade.");
      return;
    }
    setStatusMessage(`Trade Order Submitted: Swapping ${payAmount} SBY for ${receiveAmount || '0'} USDC...`);
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
          onClick={connectWallet}
          className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-teal-400"
        >
          <Wallet className="h-4 w-4" />
          {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
        </button>
      </header>

      {/* NOTIFICATION BAR */}
      {statusMessage && (
        <div className="mt-4 p-3 rounded-xl bg-teal-950/60 border border-teal-500/30 text-teal-300 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-teal-400" /> {statusMessage}
          </span>
          <button onClick={() => setStatusMessage(null)} className="text-xs text-slate-400 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* MAIN NAVIGATION TABS */}
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

        {/* TAB 1: TRADE / SWAP */}
        {activeTab === "trade" && (
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Swap Tokens</h2>
            
            {/* Pay Input */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-2">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>You Pay</span>
                <span>Balance: 1,250.00 SBY</span>
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
                <span>Balance: 0.00 USDC</span>
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
              onClick={handleTrade}
              className="w-full bg-teal-500 py-4 rounded-2xl font-bold text-slate-950 hover:bg-teal-400 transition"
            >
              Execute Swap
            </button>
          </div>
        )}

        {/* TAB 2: STAKING */}
        {activeTab === "staking" && (
          <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-teal-400 font-semibold tracking-wider uppercase">Pool 1</span>
              <h3 className="text-xl font-bold text-white mt-1">Shelby Liquid Staking</h3>
              <p className="text-3xl font-extrabold text-teal-400 my-4">12.4% <span className="text-sm text-slate-400 font-normal">APY</span></p>
              <button 
                onClick={() => alert("Staking Pool Activated")}
                className="w-full bg-slate-800 hover:bg-teal-500 hover:text-slate-950 py-3 rounded-xl text-sm font-bold transition"
              >
                Stake SBY
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-teal-400 font-semibold tracking-wider uppercase">Pool 2</span>
              <h3 className="text-xl font-bold text-white mt-1">SBY / USDC LP Vault</h3>
              <p className="text-3xl font-extrabold text-teal-400 my-4">24.8% <span className="text-sm text-slate-400 font-normal">APY</span></p>
              <button 
                onClick={() => alert("LP Vault Activated")}
                className="w-full bg-slate-800 hover:bg-teal-500 hover:text-slate-950 py-3 rounded-xl text-sm font-bold transition"
              >
                Provide Liquidity
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: STORAGE */}
        {activeTab === "storage" && (
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center">
            <Database className="h-12 w-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Shelby Decentralized Storage</h2>
            <p className="text-sm text-slate-400 mb-6">Store files and smart contract states permanently on Shelby Network.</p>
            
            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 mb-4 hover:border-teal-500 transition cursor-pointer">
              <p className="text-xs text-slate-400">Click or drag file here to upload to Shelby Vault</p>
            </div>

            <button 
              onClick={() => alert("Storage upload feature ready")}
              className="w-full bg-teal-500 py-3 rounded-xl font-bold text-slate-950 hover:bg-teal-400 transition text-sm"
            >
              Upload Data
            </button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 pt-6 flex justify-between items-center text-xs text-slate-500">
        <p>© 2026 Shelby Protocol Ecosystem. All rights reserved.</p>
        <div className="flex gap-4">
          <span className="hover:text-slate-400 cursor-pointer">Docs</span>
          <span className="hover:text-slate-400 cursor-pointer">Explorer</span>
        </div>
      </footer>
    </div>
  );
}
