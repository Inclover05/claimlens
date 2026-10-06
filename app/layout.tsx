import type { Metadata } from "next";
import "./globals.css";
import WalletContext from '@/components/wallet-context';
import ThemeContext from '@/components/theme-context';

export const metadata: Metadata = {
  title: "ClaimLens — A closer look at facts",
  description: "Check claims against evidence with GenLayer validator consensus.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased"><ThemeContext><WalletContext>{children}</WalletContext></ThemeContext></body>
    </html>
  );
}


