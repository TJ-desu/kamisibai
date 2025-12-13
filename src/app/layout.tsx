import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const mPlus = M_PLUS_Rounded_1c({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mplus",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "子どもに優しい紙芝居動画",
  description: "忙しいママのための、子供が喜ぶ厳選紙芝居動画サイト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={mPlus.className}>
        {children}
      </body>
    </html>
  );
}
