import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import DinoCursor from "@/components/DinoCursor";
import ClientWrapper from "@/components/ClientWrapper";
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
  title: "共享相册",
  description: "我们的共享相册",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ClientWrapper>
          <DinoCursor />
          <div className="noise-texture" />
          <div className="ui-layer">{children}</div>
        </ClientWrapper>
      </body>
    </html>
  );
}
