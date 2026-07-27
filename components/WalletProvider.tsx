"use client";

import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Trả về trực tiếp children để bỏ qua hoàn toàn Aptos Wallet Adapter,
  // tránh việc SDK tự kiểm tra enum Network làm sập ứng dụng.
  return <>{children}</>;
}
