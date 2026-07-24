"use client";

import { useState } from "react";
import { Wallet, ShieldCheck, Zap, Layers, Database } from "lucide-react";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).aptos) {
      try {
        const response = await (window as any).aptos.connect();
        setWalletAddress(response.address);
      } catch (error) {
        console.error("Connection failed", error);
      }
    } else {
      setWalletAddress("0x1a2b...3c4d");
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between p-6 md:p-12 max-w-7xl mx-auto">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500 p-2 rounded-xl text-slate-950">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-wider text-teal-400">SHELBY APP</span>
        </div>
        <button
          onClick={connectWallet}
          className="flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-2.5 font-medium text-slate-950 transition hover:bg-teal-400"
        >
          <Wallet className="h-4 w-4" />
          {walletAddress ? `${walletAddress}` : "Connect Wallet"}
        </button>
      </header>

      <main className="my-16 flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold text-teal-400 mb-6">
          <ShieldCheck className="h-4 w-4" /> Built on Shelby Protocol
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
          The Next Generation <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
            Decentralized Dashboard
          </span>
        </h1>
        <p className="max-w-2xl text-slate-400 text-base md:text-lg mb-8">
          Seamlessly manage assets, audit smart contracts, and interact with Web3 infrastructure on Shelby.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8 text-left">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 transition">
            <Layers className="h-8 w-8 text-teal-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">High Throughput</h3>
            <p className="text-sm text-slate-400">Optimized for ultra-low latency and scalable smart contract execution.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 transition">
            <ShieldCheck className="h-8 w-8 text-teal-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Security First</h3>
            <p className="text-sm text-slate-400">Verified security patterns and real-time threat monitoring integrated.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 transition">
            <Database className="h-8 w-8 text-teal-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Decentralized Data</h3>
            <p className="text-sm text-slate-400">Direct state management and fast indexing straight from the chain.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 pt-6 flex justify-between items-center text-xs text-slate-500">
        <p>© 2026 Shelby Project. All rights reserved.</p>
      </footer>
    </div>
  );
}
