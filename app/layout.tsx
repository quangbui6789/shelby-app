import "./globals.css";
import dynamic from "next/dynamic";

// Dynamic import WalletProvider với ssr: false để tránh crash ở server
const WalletProviderNoSSR = dynamic(() => import("@/components/WalletProvider"), {
  ssr: false,
});

export const metadata = {
  title: "Shelby App",
  description: "Shelbynet Ecosystem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 min-h-screen text-white">
        <WalletProviderNoSSR>{children}</WalletProviderNoSSR>
      </body>
    </html>
  );
}
