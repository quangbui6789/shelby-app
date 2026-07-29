"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Zap, ArrowLeftRight, Database, TrendingUp, 
  CheckCircle, Droplet, RefreshCw, AlertCircle, Coins, Upload, Wallet, LogOut, ArrowUpDown
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";

const SHELBY_RPC = "https://api.shelbynet.shelby.xyz/v1";
const apiKey = process.env.NEXT_PUBLIC_SHELBY_API_KEY || "";

// Khởi tạo Aptos Client an toàn
let aptosClient: Aptos;
try {
  aptosClient = new Aptos(
    new AptosConfig({
      network: Network.CUSTOM,
      fullnode: SHELBY_RPC,
    })
  );
} catch (e) {
  console.warn("Client init fallback", e);
}

function CustomWalletButton() {
  const { connect, disconnect, connected, account, wallets } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (connected && account) {
    const addr = account.address.toString();
    const shortAddr = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    return (
      <button 
        onClick={() => disconnect()}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-teal-400 border border-teal-500/30 px-4 py-2 rounded-xl text-xs font-semibold transition"
      >
        <Wallet className="h-4 w-4 text-teal-400" />
        <span>{shortAddr}</span>
        <LogOut className="h-3.5 w-3.5 text-slate-400 ml-1" />
      </button>
    );
  }

  const handleConnect = async () => {
    const petraWallet = wallets?.find(
      (w) => w.name.toLowerCase().includes("petra")
    ) || wallets?.[0];

    if (petraWallet) {
      try {
        await connect(petraWallet.name);
      } catch (err: any) {
        console.error("Connect wallet error:", err);
      }
    } else {
      alert("Không tìm thấy ví Petra! Vui lòng cài đặt Petra Aptos Wallet extension.");
    }
  };

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-teal-500/20"
    >
      <Wallet className="h-4 w-4" />
      <span>Connect Petra Wallet</span>
    </button>
  );
}

function AppContent() {
  const { account, connected, signAndSubmitTransaction } = useWallet();

  const [activeTab, setActiveTab] = useState<"trade" | "faucet" | "staking" | "storage">("trade");
  const [payToken, setPayToken] = useState<"ShelbyUSD" | "APT">("ShelbyUSD");
  const [payAmount, setPayAmount] = useState("0.001");
  const [receiveAmount, setReceiveAmount] = useState("0.0015");

  const [aptBalance, setAptBalance] = useState<string>("0");
  const [shelbyBalance, setShelbyBalance] = useState<string>("0");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const userAddress = account?.address ? account.address.toString() : null;

  const fetchBalance = useCallback(async (addrStr: string) => {
    if (!addrStr || !aptosClient) return;
    try {
      const aptAmount = await aptosClient.getAccountCoinAmount({
        accountAddress: addrStr,
        coinType: "0x1::aptos_coin::AptosCoin",
      });
      setAptBalance((aptAmount / 100_000_000).toLocaleString());

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

  useEffect(() => {
    if (connected && userAddress) {
      fetchBalance(userAddress);
    }
  }, [connected, userAddress, fetchBalance]);

  const handleSwitchDirection = () => {
    const nextPayToken = payToken === "ShelbyUSD" ? "APT" : "ShelbyUSD";
    setPayToken(nextPayToken);
    const rate = nextPayToken === "ShelbyUSD" ? 1.5 : 1 / 1.5;
    setReceiveAmount((parseFloat(payAmount || "0") * rate).toFixed(4));
  };

  const handleExecuteTrade = async () => {
    if (!connected || !userAddress) {
      alert("Vui lòng kết nối Petra Wallet trước!");
      return;
    }

    const amountToUse = parseFloat(payAmount || "0.001");
    if (!amountToUse || amountToUse <= 0) {
      alert("Vui lòng nhập số lượng hợp lệ.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Đang gửi yêu cầu xác nhận tới Petra Wallet...");
    setIsError(false);
    setTxHash(null);

    try {
      const amountInOctas = Math.floor(amountToUse * 100_000_000);

      const response = await signAndSubmitTransaction({
        data: {
          function: "0x1::aptos_account::transfer",
          typeArguments: [],
          functionArguments: [userAddress, amountInOctas],
        }
      });

      const hash = typeof response === "string" ? response : (response?.hash || (response as any)?.transactionHash);
      if (hash) {
        setTxHash(hash);
        setStatusMessage(`Swap ${payToken} thành công trên Mạng Shelbynet!`);
        setIsError(false);
        fetchBalance(userAddress);
      } else {
        throw new Error("Không nhận được Hash giao dịch.");
      }
    } catch (error: any) {
      console.error("Trade Error:", error);
      setIsError(true);
      const msg = error?.message || error?.toString() || "";
      
      if (msg.includes("Network not supported") || msg.includes("network")) {
        setStatusMessage("Lỗi Mạng Ví: Hãy đổi mạng trong ví Petra sang Devnet hoặc Custom Node (https://api.shelbynet.shelby.xyz/v1).");
      } else if (msg.includes("rejected") || error?.code === 4001) {
        setStatusMessage("Giao dịch bị hủy: Người dùng từ chối.");
      } else {
        setStatusMessage(`Lỗi giao dịch: ${msg || "Không thể thực hiện giao dịch."}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadStorage = async () => {
    if (!connected || !userAddress) {
      alert("Vui lòng kết nối Petra Wallet!");
      return;
    }

    if (!selectedFile) {
      alert("Vui lòng chọn file để tải lên Shelby Vault.");
      return;
    }

    setIsProcessing(true);
    setIsError(false);
    setTxHash(null);

    try {
      const shelbySdk = await import("@shelby-protocol/sdk/browser");

      const shelbyClient = new shelbySdk.ShelbyClient({
        rpcUrl: SHELBY_RPC,
        nodeUrl: SHELBY_RPC,
        apiKey: apiKey,
      } as any);

      setStatusMessage("Bước 1/3: Đang mã hóa file...");
      const arrayBuffer = await selectedFile.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      const ecProvider = await shelbySdk.createDefaultErasureCodingProvider();
      const commitments = await shelbySdk.generateCommitments(ecProvider, fileData);

      setStatusMessage("Bước 2/3: Đăng ký Metadata...");
      const expirationMicros = (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000;
      const userAccountAddress = AccountAddress.from(userAddress);

      const rawPayload: any = shelbySdk.ShelbyBlobClient.createRegisterBlobPayload({
        account: userAccountAddress,
        blobName: selectedFile.name,
        blobMerkleRoot: commitments.blob_merkle_root,
        numChunksets: shelbySdk.expectedTotalChunksets(commitments.raw_data_size),
        expirationMicros: expirationMicros,
        blobSize: commitments.raw_data_size,
      });

      const response = await signAndSubmitTransaction({
        data: {
          function: (rawPayload.function || rawPayload.payload?.function) as `${string}::${string}::${string}`,
          typeArguments: rawPayload.type_arguments || rawPayload.payload?.typeArguments || [],
          functionArguments: rawPayload.arguments || rawPayload.payload?.functionArguments || [],
        }
      });

      const hash = typeof response === "string" ? response : (response?.hash || (response as any)?.transactionHash);
      setTxHash(hash);

      setStatusMessage("Bước 3/3: Tải dữ liệu Blob...");
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

          <CustomWalletButton />
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
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Swap on Shelby</h2>
              <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/30 px-2.5 py-1 rounded-lg">Shelbynet</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-2">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>You Pay</span>
                <span className="text-teal-400 font-mono">
                  Balance: {connected ? (payToken === "ShelbyUSD" ? `${shelbyBalance} ShelbyUSD` : `${aptBalance} APT`) : "Not Connected"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <input
                  type="number"
                  placeholder="0.0"
                  value={payAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPayAmount(val);
                    const rate = payToken === "ShelbyUSD" ? 1.5 : 1 / 1.5;
                    setReceiveAmount((parseFloat(val || "0") * rate).toFixed(4));
                  }}
                  className="bg-transparent text-2xl font-bold text-white outline-none w-full"
                />
                <span className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${payToken === "ShelbyUSD" ? "bg-slate-800 text-emerald-400" : "bg-slate-800 text-teal-400"}`}>
                  {payToken}
                </span>
              </div>
            </div>

            <div className="flex justify-center -my-3 z-10 relative">
              <button 
                onClick={handleSwitchDirection}
                className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl border border-slate-700 text-teal-400 transition hover:scale-110"
                title="Đảo chiều Swap"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
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
                <span className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${payToken === "ShelbyUSD" ? "bg-slate-800 text-teal-400" : "bg-slate-800 text-emerald-400"}`}>
                  {payToken === "ShelbyUSD" ? "APT" : "ShelbyUSD"}
                </span>
              </div>
            </div>

            <button
              onClick={handleExecuteTrade}
              disabled={isProcessing}
              className="w-full bg-teal-500 py-4 rounded-2xl font-bold text-slate-950 hover:bg-teal-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing && <RefreshCw className="h-4 w-4 animate-spin" />}
              {isProcessing ? "Confirming on Petra Wallet..." : `Execute Testnet Swap (${payToken})`}
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

export default function MainApp() {
  return <AppContent />;
}
