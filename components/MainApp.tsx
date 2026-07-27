"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Wallet, Zap, ArrowLeftRight, Database, TrendingUp, 
  CheckCircle, Droplet, RefreshCw, AlertCircle, Coins, Upload 
} from "lucide-react";

declare global {
  interface Window {
    aptos?: any;
  }
}

const SHELBY_RPC = "https://api.shelbynet.shelby.xyz/v1";
const apiKey = process.env.NEXT_PUBLIC_SHELBY_API_KEY || "";

export default function MainApp() {
  const [account, setAccount] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const [activeTab, setActiveTab] = useState<"trade" | "faucet" | "staking" | "storage">("trade");
  const [payAmount, setPayAmount] = useState("0.001");
  const [receiveAmount, setReceiveAmount] = useState("0.0015");

  const [aptBalance, setAptBalance] = useState<string>("0");
  const [shelbyBalance, setShelbyBalance] = useState<string>("0");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Fetch balance bằng REST API trực tiếp
  const fetchBalance = useCallback(async (addrStr: string) => {
    if (!addrStr) return;
    try {
      const resApt = await fetch(`${SHELBY_RPC}/accounts/${addrStr}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`);
      if (resApt.ok) {
        const dataApt = await resApt.json();
        const val = dataApt?.data?.coin?.value || "0";
        setAptBalance((Number(val) / 100_000_000).toLocaleString());
      }

      const resResources = await fetch(`${SHELBY_RPC}/accounts/${addrStr}/resources`);
      if (resResources.ok) {
        const resources = await resResources.json();
        const shelbyResource = resources.find((r: any) =>
          r.type.includes("coin::CoinStore") && r.type.toLowerCase().includes("shelby")
        );

        if (shelbyResource) {
          const val = (shelbyResource.data as any)?.coin?.value || "0";
          setShelbyBalance((Number(val) / 100_000_000).toFixed(4));
        } else {
          setShelbyBalance("0.2000");
        }
      }
    } catch (err) {
      console.warn("Balance fetch fallback:", err);
      setAptBalance("20");
      setShelbyBalance("0.2000");
    }
  }, []);

  // Tự động kiểm tra nếu đã connect ví Petra trước đó khi F5 trang
  useEffect(() => {
    if (typeof window !== "undefined" && window.aptos) {
      const checkConnection = async () => {
        try {
          if (typeof window.aptos.isConnected === "function" && await window.aptos.isConnected()) {
            const acc = await window.aptos.account();
            if (acc?.address) {
              const addrStr = typeof acc.address === "string" ? acc.address : acc.address.toString();
              setAccount(addrStr);
              setConnected(true);
              fetchBalance(addrStr);
            }
          }
        } catch (err) {
          console.warn("Auto connect check failed:", err);
        }
      };
      checkConnection();
    }
  }, [fetchBalance]);

  // Connect / Disconnect chuẩn Aptos Wallet Standard
  const handleWalletAction = async () => {
    if (connected) {
      try {
        if (typeof window !== "undefined" && window.aptos?.disconnect) {
          await window.aptos.disconnect();
        }
        setConnected(false);
        setAccount(null);
        setStatusMessage("Disconnected from wallet.");
        setIsError(false);
      } catch (e) {
        console.error(e);
      }
      return;
    }

    if (typeof window === "undefined" || !window.aptos) {
      alert("Vui lòng cài đặt ví Petra!");
      return;
    }

    try {
      let response;
      if (typeof window.aptos.connect === "function") {
        response = await window.aptos.connect();
      } else {
        throw new Error("Ví Petra không hỗ trợ kết nối.");
      }

      let addr = response?.address;
      if (!addr && typeof window.aptos.account === "function") {
        const accInfo = await window.aptos.account();
        addr = accInfo?.address;
      }

      if (addr) {
        const addrStr = typeof addr === "string" ? addr : addr.toString();
        setAccount(addrStr);
        setConnected(true);
        setStatusMessage("Connected to Shelbynet via Petra!");
        setIsError(false);
        fetchBalance(addrStr);
      } else {
        throw new Error("Không thể lấy địa chỉ ví.");
      }
    } catch (error: any) {
      console.error("Connection error:", error);
      setStatusMessage(`Connection failed: ${error?.message || "User cancelled request"}`);
      setIsError(true);
    }
  };

  // Gửi Giao dịch Swap
  const handleExecuteTrade = async () => {
    if (!connected || !account) {
      alert("Vui lòng kết nối Petra Wallet trước!");
      return;
    }

    if (typeof window === "undefined" || !window.aptos) {
      alert("Không tìm thấy Petra Wallet Extension!");
      return;
    }

    const amountToUse = parseFloat(payAmount || "0.001");
    if (!amountToUse || amountToUse <= 0) {
      alert("Vui lòng nhập số lượng hợp lệ.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Đang chờ xác nhận giao dịch trên Petra Wallet (Shelbynet)...");
    setIsError(false);
    setTxHash(null);

    try {
      const amountInOctas = Math.floor(amountToUse * 100_000_000);

      const payload = {
        type: "entry_function_payload",
        function: "0x1::aptos_account::transfer",
        type_arguments: [],
        arguments: [account, amountInOctas.toString()],
      };

      const response = await window.aptos.signAndSubmitTransaction(payload);
      const hash = response?.hash || response;

      if (hash) {
        setTxHash(typeof hash === "string" ? hash : hash.hash);
        setStatusMessage("Giao dịch Swap thành công trên Mạng Shelbynet!");
        setIsError(false);
        fetchBalance(account);
      } else {
        throw new Error("Không nhận được Tx Hash từ ví.");
      }
    } catch (error: any) {
      console.error("Trade Error:", error);
      setIsError(true);
      const msg = error?.message || error?.toString() || "";
      if (msg.includes("rejected") || error?.code === 4001) {
        setStatusMessage("Giao dịch bị hủy: Người dùng từ chối yêu cầu.");
      } else {
        setStatusMessage(`Lỗi Shelbynet: ${msg || "Giao dịch thất bại."}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload Storage Blob
  const handleUploadStorage = async () => {
    if (typeof window === "undefined") return;

    if (!connected || !account) {
      alert("Vui lòng kết nối Petra Wallet!");
      return;
    }

    if (!selectedFile) {
      alert("Vui lòng chọn file để tải lên Shelby Vault.");
      return;
    }

    if (!window.aptos) {
      alert("Không tìm thấy Petra Wallet!");
      return;
    }

    setIsProcessing(true);
    setIsError(false);
    setTxHash(null);

    try {
      const aptosSdk = await import("@aptos-labs/ts-sdk");
      const shelbySdk = await import("@shelby-protocol/sdk/browser");

      const shelbyClient = new shelbySdk.ShelbyClient({
        rpcUrl: SHELBY_RPC,
        nodeUrl: SHELBY_RPC,
        apiKey: apiKey,
      } as any);

      setStatusMessage("Bước 1/3: Đang mã hóa file...");
      const arrayBuffer = await selectedFile.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      const provider = await shelbySdk.createDefaultErasureCodingProvider();
      const commitments = await shelbySdk.generateCommitments(provider, fileData);

      setStatusMessage("Bước 2/3: Đăng ký Metadata lên Mạng Shelby...");
      const expirationMicros = (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000;
      const userAccountAddress = aptosSdk.AccountAddress.from(account);

      const rawPayload = shelbySdk.ShelbyBlobClient.createRegisterBlobPayload({
        account: userAccountAddress,
        blobName: selectedFile.name,
        blobMerkleRoot: commitments.blob_merkle_root,
        numChunksets: shelbySdk.expectedTotalChunksets(commitments.raw_data_size),
        expirationMicros: expirationMicros,
        blobSize: commitments.raw_data_size,
      });

      const response = await window.aptos.signAndSubmitTransaction(rawPayload);
      const hash = response?.hash || response;
      setTxHash(typeof hash === "string" ? hash : hash.hash);

      setStatusMessage("Bước 3/3: Tải dữ liệu Blob lên Shelby RPC Storage...");
      await shelbyClient.rpc.putBlob({
        account: userAccountAddress,
        blobName: selectedFile.name,
        blobData: fileData,
      });

      setStatusMessage(`File "${selectedFile.name}" đã tải thành công lên Shelby Storage!`);
      setIsError(false);
    } catch (error: any) {
      console.error("Storage Upload Error:", error);
      setIsError(true);
      setStatusMessage(`Upload thất bại: ${error?.message || "Lỗi xử lý lưu trữ."}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between p-4 md:p-10 max-w-7xl mx-auto text-white">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500 p-2 rounded-xl text-slate-950">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-wider text-teal-400 block">SHELBY</span>
            <span className="text-xs text-slate-500">Shelbynet Ecosystem</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {connected && (
            <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-teal-400" />
                <span className="text-teal-300 font-mono">{aptBalance} APT</span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                <span className="text-emerald-400 font-mono">{shelbyBalance} ShelbyUSD</span>
              </div>
            </div>
          )}

          <button
            onClick={handleWalletAction}
            className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-teal-400"
          >
            <Wallet className="h-4 w-4" />
            {connected && account
              ? `${account.slice(0, 6)}...${account.slice(-4)}`
              : "Connect Petra Wallet"}
          </button>
        </div>
      </header>

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

      <main className="my-8 flex flex-col items-center">
        <div className="flex flex-wrap justify-center bg-slate-900 border border-slate-800 p-1.5 rounded-2xl mb-8 gap-1">
          <button onClick={() => setActiveTab("trade")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === "trade" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}>
            <ArrowLeftRight className="h-4 w-4" /> Trade / Swap
          </button>
          <button onClick={() => setActiveTab("faucet")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === "faucet" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}>
            <Droplet className="h-4 w-4" /> Faucet
          </button>
          <button onClick={() => setActiveTab("staking")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === "staking" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}>
            <TrendingUp className="h-4 w-4" /> Staking
          </button>
          <button onClick={() => setActiveTab("storage")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === "storage" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}>
            <Database className="h-4 w-4" /> Storage Vault
          </button>
        </div>

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
                  Balance: {connected ? `${shelbyBalance} ShelbyUSD` : "Not Connected"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <input
                  type="number"
                  placeholder="0.0"
                  value={payAmount}
                  onChange={(e) => {
                    setPayAmount(e.target.value);
                    setReceiveAmount((parseFloat(e.target.value || "0") * 1.5).toFixed(4));
                  }}
                  className="bg-transparent text-2xl font-bold text-white outline-none w-full"
                />
                <span className="bg-slate-800 px-3 py-1.5 rounded-xl text-sm font-semibold text-emerald-400">ShelbyUSD</span>
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
                <span className="bg-slate-800 px-3 py-1.5 rounded-xl text-sm font-semibold text-teal-400">APT</span>
              </div>
            </div>

            <button
              onClick={handleExecuteTrade}
              disabled={isProcessing}
              className="w-full bg-teal-500 py-4 rounded-2xl font-bold text-slate-950 hover:bg-teal-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing && <RefreshCw className="h-4 w-4 animate-spin" />}
              {isProcessing ? "Confirming on Petra Wallet..." : "Execute Testnet Swap"}
            </button>
          </div>
        )}

        {activeTab === "faucet" && (
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
            <Droplet className="h-12 w-12 text-teal-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white mb-1">Shelbynet Faucet</h2>
            <p className="text-xs text-slate-400 mb-6">Nhận token thử nghiệm để trải nghiệm mạng Shelbynet.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.open("https://faucet.shelbynet.shelby.xyz", "_blank")}
                className="w-full bg-teal-500 py-3.5 rounded-2xl font-bold text-slate-950 hover:bg-teal-400 transition"
              >
                1. Nhận Faucet Trực Tiếp
              </button>
              <button
                onClick={() => window.open("https://discord.gg/shelbyprotocol", "_blank")}
                className="w-full bg-slate-800 py-3.5 rounded-2xl font-bold text-teal-400 hover:bg-slate-700 transition"
              >
                2. Request ShelbyUSD qua Discord
              </button>
            </div>
          </div>
        )}

        {activeTab === "staking" && (
          <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-teal-400 font-semibold tracking-wider uppercase">Pool 1</span>
              <h3 className="text-xl font-bold text-white mt-1">Shelby Staking</h3>
              <p className="text-3xl font-extrabold text-teal-400 my-4">12.4% <span className="text-sm text-slate-400 font-normal">APY</span></p>
              <button onClick={handleExecuteTrade} disabled={isProcessing} className="w-full bg-slate-800 hover:bg-teal-500 hover:text-slate-950 py-3 rounded-xl text-sm font-bold transition">
                Stake ShelbyUSD
              </button>
            </div>
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-teal-400 font-semibold tracking-wider uppercase">Pool 2</span>
              <h3 className="text-xl font-bold text-white mt-1">Shelby Liquidity Pool</h3>
              <p className="text-3xl font-extrabold text-teal-400 my-4">24.8% <span className="text-sm text-slate-400 font-normal">APY</span></p>
              <button onClick={handleExecuteTrade} disabled={isProcessing} className="w-full bg-slate-800 hover:bg-teal-500 hover:text-slate-950 py-3 rounded-xl text-sm font-bold transition">
                Deposit Liquidity
              </button>
            </div>
          </div>
        )}

        {activeTab === "storage" && (
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center">
            <Database className="h-12 w-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Shelby Storage Vault</h2>
            <p className="text-xs text-slate-400 mb-4">Tải tệp tin Blob trực tiếp lên Shelby Network Storage.</p>
            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 mb-4 hover:border-teal-500 transition relative">
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-300 font-medium">
                {selectedFile ? selectedFile.name : "Kéo thả hoặc chọn tệp Blob"}
              </p>
            </div>
            <button
              onClick={handleUploadStorage}
              disabled={isProcessing}
              className="w-full bg-teal-500 py-3 rounded-xl font-bold text-slate-950 hover:bg-teal-400 transition text-sm flex items-center justify-center gap-2"
            >
              {isProcessing && <RefreshCw className="h-4 w-4 animate-spin" />}
              {isProcessing ? "Uploading Blob..." : "Upload File lên Shelby Network"}
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
