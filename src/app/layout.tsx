import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#b1a08a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";
import PullToRefreshHandler from "@/app/components/PullToRefresh";
import { ToastProvider } from "@/context/ToastContext";

const mPlus = M_PLUS_Rounded_1c({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mplus",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "子どもに優しい紙芝居動画",
  description: "忙しいママのための、子供が喜ぶ厳選紙芝居動画サイト",
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={mPlus.className}>
        <ToastProvider>
          <PullToRefreshHandler />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
