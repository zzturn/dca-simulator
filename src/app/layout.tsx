import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DCA Simulator - 定投模拟器",
  description: "模拟基金定投收益，帮助您做出更明智的投资决策",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-app-bg antialiased">
        {children}
      </body>
    </html>
  );
}
