import "./globals.css"; // <--- Import CSS toàn cục
import Providers from "@/components/WalletProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
