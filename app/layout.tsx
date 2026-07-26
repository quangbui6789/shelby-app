import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";

export const metadata = {
  title: "Shelby dApp",
  description: "Shelbynet Ecosystem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white min-h-screen">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
