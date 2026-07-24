"use client";

import { useState, useEffect } from "react";
import { Wallet, ShieldCheck, Zap, Layers, Database, Send, RefreshCw } from "lucide-react";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isTransacting, setIsTransacting] = useState(false);

  // Kiểm tra và lấy địa chỉ ví nếu đã kết nối từ trước
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
          console.error("Lỗi kiểm tra kết nối ví:", e);
        }
      }
    };
    checkConnection();
  }, []);

  // 1. Hàm Kết nối Ví Thực tế (Petra / Aptos-compatible Wallet)
  const connectWallet = async () => {
    setIsConnecting(true);
    if (typeof window !== "undefined" && (window as any).aptos) {
      try {
        const response = await (window as any).aptos.connect();
        setWalletAddress(response.address);
      } catch (error) {
        console.error("Người dùng hủy kết nối hoặc lỗi:", error);
      }
    } else {
      alert("Không tìm thấy ví Aptos/Shelby! Vui lòng cài đặt tiện ích Petra Wallet trên Chrome.");
      window.open("https://petra.app/", "_blank");
    }
    setIsConnecting(false);
  };

  // 2. Hàm Thực hiện Giao dịch (Execute Transaction on Shelby Protocol)
  const handleExecuteTransaction = async () => {
    if (!walletAddress) {
      alert("Vui lòng kết nối ví trước!");
      return;
    }

    setIsTransacting(true);
    setTxHash(null);

    try {
      // Cấu hình Payload giao dịch theo chuẩn Shelby / Move VM
      const payload = {
        type: "entry_function_payload",
        function: "0x1::coin::transfer", // Bạn có thể thay bằng Smart Contract Address chính thức của Shelby
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: [
          walletAddress, // Gửi thử nghiệm về chính ví người dùng (hoặc địa chỉ Shelby Protocol)
          "1000" // Số lượng Octas (0.00001 Token)
        ],
      };

      // Yêu cầu ví ký và gửi giao dịch lên Chain
      const pendingTransaction = await (window as any).aptos.signAndSubmitTransaction(payload);
      
      // Nhận về Transaction Hash
      setTxHash(pendingTransaction.hash);
      alert("Gửi giao dịch thành công!");
    } catch (error) {
      console.error("Thực thi giao dịch thất bại:", error);
      alert("Giao dịch bị hủy hoặc lỗi!");
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
            : isConnecting ? "Đang kết nối..." : "Connect Wallet"}
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
          Tương tác trực tiếp với Smart Contracts và thực hiện các giao dịch Web3 trên hạ tầng Shelby.
        </p>

        {/* Khung tương tác giao dịch thực tế */}
        <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 mb-12">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-center gap-2">
            <Send className="h-5 w-5 text-teal-400" /> Thực hiện Giao dịch
          </h3>
          
          <button
            onClick={handleExecuteTransaction}
            disabled={!walletAddress || isTransacting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 font-semibold text-slate-950 transition hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {isTransacting ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" /> Đang xử lý trên Chain...
              </>
            ) : (
              "Gửi Giao Dịch Thử Nghiệm"
            )}
          </button>

          {txHash && (
            <div className="mt-4 p-3 rounded-lg bg-teal-950/50 border border-teal-500/30 text-xs text-left overflow-hidden">
              <p className="text-teal-400 font-semibold mb-1">Mã Giao Dịch (Tx Hash):</p>
              <p className="font-mono text-slate-300 truncate">{txHash}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <Layers className="h-8 w-8 text-teal-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">High Throughput</h3>
            <p className="text-sm text-slate-400">Tốc độ xử lý giao dịch song song với độ trễ thấp.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <ShieldCheck className="h-8 w-8 text-teal-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Move Smart Contract</h3>
            <p className="text-sm text-slate-400">Thực thi hợp đồng thông minh an toàn dựa trên ngôn ngữ Move.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <Database className="h-8 w-8 text-teal-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">On-Chain Data</h3>
            <p className="text-sm text-slate-400">Đọc và ghi trạng thái hợp đồng trực tiếp thời gian thực.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 pt-6 flex justify-between items-center text-xs text-slate-500">
        <p>© 2026 Shelby Project. All rights reserved.</p>
      </footer>
    </div>
  );
}
