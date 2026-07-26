import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Shelby dApp",
  description: "Shelby Protocol Ecosystem",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
