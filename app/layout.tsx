import Providers from "@/components/WalletProvider";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0b1426] text-white min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
