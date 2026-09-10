import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "작심삼토 — 3일 스프린트로 끝내는 토익",
    template: "%s",
  },
  description:
    "작심삼일도 10번이면 한 달. 3일 단위 챌린지로 짧고 강하게 끝내는 토익 학습 앱.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "작심삼토", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
