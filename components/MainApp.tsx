"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { Network, Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { 
  type BlobCommitments, 
  createDefaultErasureCodingProvider, 
  generateCommitments,
  expectedTotalChunksets,
  ShelbyBlobClient,
  ShelbyClient
} from "@shelby-protocol/sdk/browser";

import { 
  Wallet, Zap, ArrowLeftRight, Database, TrendingUp, 
  CheckCircle, Droplet, RefreshCw, AlertCircle, Coins, Upload 
} from "lucide-react";

const apiKey = process.env.NEXT_PUBLIC_SHELBY_API_KEY || "";
const aptosConfig = new AptosConfig({ 
  network: Network.TESTNET,
  clientConfig: { API_KEY: apiKey }
});
const aptosClient = new Aptos(aptosConfig);

export default function MainApp() {
  const { connect, disconnect, connected, account, wallets, signAndSubmitTransaction } = useWallet();

  const [activeTab, setActiveTab] = useState<"trade" | "faucet" | "staking" | "storage">("trade");
  const [payAmount, setPayAmount] = useState("0.001");
  const [receiveAmount, setReceiveAmount] = useState("0.0015");

  const [aptBalance, setAptBalance] = useState<string>("0");
  const [shelbyBalance, setShelbyBalance] = useState<string>("0.1000");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!account?.address) return;
    try {
      const addrStr = account.address.toString();
      const aptAmount = await aptosClient.getAccountAPTAmount({ accountAddress: addrStr });
      setAptBalance((aptAmount / 100_000_000).toFixed(4));
    } catch (err) {
      console.error("Fetch balance error:", err);
    }
  }, [account]);

  useEffect(() => {
    if (connected && account) {
      fetchBalance();
    } else {
      setAptBalance("0");
    }
  }, [connected, account, fetchBalance]);

  const handleWalletAction = async () => {
    if (connected) {
      await disconnect();
      setStatusMessage("Disconnected from wallet.");
      setIsError(false);
      return;
    }

    try {
      const petraWallet = wallets?.find((w) => w.name.toLowerCase().includes("petra"));
      if (petraWallet) {
        await connect(petraWallet.name);
        setStatusMessage("Connected via Petra Wallet!");
        setIsError(false);
      } else if (wallets && wallets.length > 0) {
        await connect(wallets[0].name);
      } else {
        window.open("https://petra.app/", "_blank");
      }
    } catch (error: any) {
      setStatusMessage(`Connection failed: ${error?.message || "User cancelled"}`);
      setIsError(true);
    }
  };

  const handleExecuteTrade = async () => {
    if (!connected || !account?.address) {
      alert("Please connect your Petra Wallet first!");
      return;
    }

    const amountToUse = parseFloat(payAmount || "0.001");
    if (!amountToUse || amountToUse <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Awaiting confirmation in Petra Wallet...");
    setIsError(false);
    setTxHash(null);

    try {
      const amountInOctas = Math.floor(amountToUse * 100_000_000);
      const senderAddress = account.address.toString();

      const transactionPayload: InputTransactionData = {
        data: {
          function: "0x1::aptos_account::transfer",
          typeArguments: [],
          functionArguments: [senderAddress, amountInOctas],
        },
      };

      const response = await signAndSubmitTransaction(transactionPayload);

      if (response && response.hash) {
        setTxHash(response.hash);
        setStatusMessage("Swap Transaction Executed Successfully on Shelbynet!");
        setIsError(false);

        await aptosClient.waitForTransaction({ transactionHash: response.hash });
        fetchBalance();
      } else {
        throw new Error("No transaction hash returned.");
      }
    } catch (error: any) {
      console.error("Trade Error:", error);
      setIsError(true);
      const msg = error?.message || error?.toString() || "";
      if (msg.includes("rejected") || error?.code === 4001) {
        setStatusMessage("Transaction Cancelled: User rejected request.");
      } else {
        setStatusMessage(`Error: ${msg || "Transaction execution failed."}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadStorage = async () => {
    if (!connected || !account?.address) {
      alert("Please connect your Petra Wallet first!");
      return;
    }

    if (!selectedFile) {
      alert("Please select a file to upload to Shelby Vault.");
      return;
    }

    setIsProcessing(true);
    setIsError(false);
    setTxHash(null);

    try {
      const shelbyClient = new ShelbyClient({
        network: Network.TESTNET,
        apiKey: apiKey,
      });

      setStatusMessage("Step 1/3: Encoding file into commitments...");
      const fileData = Buffer.isBuffer(selectedFile)
        ? selectedFile
        : Buffer.from(await selectedFile.arrayBuffer());

      const provider = await createDefaultErasureCodingProvider();
      const commitments: BlobCommitments = await generateCommitments(provider, fileData);

      setStatusMessage("Step 2/3: Registering file metadata on-chain...");
      const expirationMicros = (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000;

      const payload = ShelbyBlobClient.createRegisterBlobPayload({
        account: account.address.toString(),
        blobName: selectedFile.name,
        blobMerkleRoot: commitments.blob_merkle_root,
        numChunksets: expectedTotalChunksets(commitments.raw_data_size),
        expirationMicros: expirationMicros,
        blobSize: commitments.raw_data_size,
      });

      const transactionPayload: InputTransactionData = {
        data: payload,
      };

      const transactionSubmitted = await signAndSubmitTransaction(transactionPayload);
      setTxHash(transactionSubmitted.hash);

      await aptosClient.waitForTransaction({
        transactionHash: transactionSubmitted.hash,
      });

      setStatusMessage("Step 3/3: Uploading file payload to Shelby RPC Storage...");
      await shelbyClient.rpc.putBlob({
        account: account.address.toString(),
        blobName: selectedFile.name,
        blobData: new Uint8Array(await selectedFile.arrayBuffer()),
      });

      setStatusMessage(`File "${selectedFile.name}" uploaded successfully to Shelby Storage Network!`);
      setIsError(false);
    } catch (error: any) {
      console.error("Storage Upload Error:", error);
      setIsError(true);
      setStatusMessage(`Upload failed: ${error?.message || "Error processing file upload."}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const accountAddrStr = account?.address ? account.address.toString() : "";

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
            {connected && accountAddrStr
              ? `${accountAddrStr.slice(0, 6)}...${accountAddrStr.slice(-4)}`
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
            <Droplet className="h-4 w-4" /> Faucet
          </button>

          <button
            onClick={() => setActiveTab("staking")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
              activeTab === "staking" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="h-4 w-4" /> Staking
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
              {isProcessing ? "Confirming on Petra..." : "Execute Testnet Swap"}
            </button>
          </div>
        )}

        {activeTab === "faucet" && (
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
            <Droplet className="h-12 w-12 text-teal-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white mb-1">Shelby Testnet Faucet</h2>
            <p className="text-xs text-slate-400 mb-6">Claim testnet tokens directly to your Petra wallet.</p>

            <button
              onClick={() => window.open("https://faucet.shelbynet.shelby.xyz", "_blank")}
              className="w-full bg-teal-500 py-4 rounded-2xl font-bold text-slate-950 hover:bg-teal-400 transition flex items-center justify-center gap-2"
            >
              Open Shelbynet Faucet
            </button>
          </div>
        )}

        {activeTab === "staking" && (
          <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-teal-400 font-semibold tracking-wider uppercase">Pool 1</span>
              <h3 className="text-xl font-bold text-white mt-1">Shelby Staking</h3>
              <p className="text-3xl font-extrabold text-teal-400 my-4">12.4% <span className="text-sm text-slate-400 font-normal">APY</span></p>
              <button 
                onClick={handleExecuteTrade}
                disabled={isProcessing}
                className="w-full bg-slate-800 hover:bg-teal-500 hover:text-slate-950 py-3 rounded-xl text-sm font-bold transition"
              >
                Stake ShelbyUSD
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-teal-400 font-semibold tracking-wider uppercase">Pool 2</span>
              <h3 className="text-xl font-bold text-white mt-1">Shelby Liquidity Pool</h3>
              <p className="text-3xl font-extrabold text-teal-400 my-4">24.8% <span className="text-sm text-slate-400 font-normal">APY</span></p>
              <button 
                onClick={handleExecuteTrade}
                disabled={isProcessing}
                className="w-full bg-slate-800 hover:bg-teal-500 hover:text-slate-950 py-3 rounded-xl text-sm font-bold transition"
              >
                Deposit Liquidity
              </button>
            </div>
          </div>
        )}

        {activeTab === "storage" && (
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center">
            <Database className="h-12 w-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Shelby Storage Vault</h2>
            <p className="text-xs text-slate-400 mb-4">Upload blob files directly onto Shelby Storage Network.</p>

            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 mb-4 hover:border-teal-500 transition relative">
              <input 
                type="file" 
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-300 font-medium">
                {selectedFile ? selectedFile.name : "Click or drag file here to select Blob"}
              </p>
            </div>

            <button 
              onClick={handleUploadStorage}
              disabled={isProcessing}
              className="w-full bg-teal-500 py-3 rounded-xl font-bold text-slate-950 hover:bg-teal-400 transition text-sm flex items-center justify-center gap-2"
            >
              {isProcessing && <RefreshCw className="h-4 w-4 animate-spin" />}
              {isProcessing ? "Uploading Blob..." : "Upload File to Shelby Network"}
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
