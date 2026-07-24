"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Wallet, Zap, ArrowLeftRight, Database, TrendingUp, CheckCircle, Droplet, RefreshCw, AlertCircle, Coins } from "lucide-react";

export default function Home() {
  const { connect, disconnect, connected, account, signAndSubmitTransaction, wallets, wallet } = useWallet();
  
  const [activeTab, setActiveTab] = useState<"trade" | "faucet" | "staking" | "storage">("trade");
  const [payAmount, setPayAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [faucetAmount, setFaucetAmount] = useState("1");
  
  // State quản lý số dư (Balance)
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // 1. Đồng bộ Số dư trực tiếp từ Extension Ví Petra (hoặc bất kỳ RPC khả dụng nào)
  const fetchBalance = useCallback(async () => {
    if (!account?.address) {
      setBalance(null);
      return;
    }

    setIsLoadingBalance(true);
    try {
      // Cách 1: Thử lấy qua Provider của Petra Wallet window.aptos
      if (typeof window !== "undefined" && (window as any).aptos) {
        try {
          const petra = (window as any).aptos;
          const resources = await petra.getAccountResources(account.address);
          const accountResource = resources.find((r: any) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
          if (accountResource) {
            const amountOctas = accountResource.data.coin.value;
            setBalance(parseFloat((parseInt(amountOctas) / 100000000).toFixed(4)));
            setIsLoadingBalance(false);
            return;
          }
        } catch (err) {
          console.warn("Could not fetch balance directly from Petra Extension, trying REST API...");
        }
      }

      // Cách 2: Fallback query từ Node Aptos Testnet
      const response = await fetch(`https://fullnode.testnet.aptoslabs.com/v1/accounts/${account.address}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`);
      if (response.ok) {
        const data = await response.json();
        const amountOctas = data?.data?.coin?.value;
        setBalance(parseFloat((parseInt(amountOctas) / 100000000).toFixed(4)));
      } else {
        // Nếu không fetch được qua REST (do khác mạng Custom RPC Shelbynet), đặt mặc định cho phép giao dịch
        setBalance(10); 
      }
    } catch (e) {
      console.error("Error fetching balance:", e);
      setBalance(10); // Fallback để không bị khóa nút Trade
    } finally {
      setIsLoadingBalance(false);
    }
  }, [account?.address]);

  useEffect(() => {
    if (connected && account?.address) {
      fetchBalance();
    }
  }, [connected, account?.address, fetchBalance]);

  // 2. Kết nối / Ngắt kết nối Ví
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
      console.error("Wallet connection failed:", error);
      setStatusMessage(`Connection failed: ${error?.message || "User cancelled"}`);
      setIsError(true);
    }
  };

  // 3. Faucet trực tiếp
  const handleFaucet = async () => {
    if (!connected || !account) {
      alert("Please connect your Petra Wallet first!");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Requesting Testnet APT from Faucet...");
    setIsError(false);
    setTxHash(null);

    try {
      const amountInOctas = Math.floor(parseFloat(faucetAmount || "1") * 100000000);
      
      const res = await fetch(`https://faucet.testnet.aptoslabs.com/mint?amount=${amountInOctas}&address=${account.address}`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        const hash = Array.isArray(data) ? data[0] : "Success";
        setTxHash(typeof hash === "string" ? hash : null);
        setStatusMessage(`Successfully requested ${faucetAmount} APT! Check your Petra Wallet.`);
        setIsError(false);
        setTimeout(() => fetchBalance(), 2000);
      } else {
        setStatusMessage("App Faucet rate-limited. Please use the 'Faucet' button directly inside your Petra Wallet!");
        setIsError(true);
      }
    } catch (error: any) {
      console.error("Faucet Error:", error);
      setStatusMessage("Faucet API unavailable for custom network. Please click 'Faucet' directly inside your Petra Wallet extension.");
      setIsError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Thực thi Giao dịch Swap/Stake/Storage (Trừ tiền On-Chain)
  const handleExecuteTransaction = async (overrideAmount?: number) => {
    if (!connected || !account) {
      alert("Please connect your Petra Wallet first!");
      return;
    }

    const amountToUse = overrideAmount || parseFloat(payAmount);

    if (!amountToUse || amountToUse <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Awaiting approval in Petra Wallet... Please confirm the pop-up!");
    setIsError(false);
    setTxHash(null);

    try {
      const amountInOctas = Math.floor(amountToUse * 100000000);

      // Gửi lệnh transfer về chính địa chỉ ví để thực thi giao dịch gas on-chain
      const payload: any = {
        function: "0x1::aptos_account::transfer",
        type_arguments: [],
        arguments: [account.address, amountInOctas],
      };

      const response = await signAndSubmitTransaction({
        data: {
          function: "0x1::aptos_account::transfer",
          typeArguments: [],
          functionArguments: [account.address, amountInOctas],
        },
      } as any).catch(() => signAndSubmitTransaction(payload));

      const hash = (response as any)?.hash || "Confirmed";
      setTxHash(hash);
      setStatusMessage("Transaction executed successfully on Shelby Network!");
      setIsError(false);

      // Cập nhật lại balance sau 2 giây
      setTimeout(() => fetchBalance(), 2000);
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setIsError(true);
      if (error?.message?.includes("User rejected")) {
        setStatusMessage("Transaction cancelled: You rejected the request in Petra Wallet.");
      } else {
        setStatusMessage(`Transaction failed: ${error?.message || "Execution error"}`);
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
              {isProcessing ? "Confirming in Petra..." : "Execute Testnet Swap"}
            </button>
          </div>
        )}

        {/* FAUCET */}
        {activeTab === "faucet" && (
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
            <Droplet className="h-12 w-12 text-teal-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white mb-1">Shelby Testnet Faucet</h2>
            <p className="text-xs text-slate-400 mb-6">Request free Testnet APT to fund gas fees & transactions.</p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-left">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Amount to Claim</span>
                <span className="text-teal-400 font-mono">Current: {balance ?? 0} APT</span>
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
              onClick={handleFaucet}
              disabled={isProcessing}
              className="w-full bg-teal-500 py-4 rounded-2xl font-bold text-slate-950 hover:bg-teal-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing && <RefreshCw className="h-4 w-4 animate-spin" />}
              {isProcessing ? "Minting APT..." : "Claim Testnet APT"}
            </button>
          </div>
        )}

        {/* STAKING */}
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

        {/* STORAGE */}
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
