// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import Navbar from "./Navbar"; // 导入导航栏组件
import { AuthProvider } from "@/providers/AuthProvider"; // 导入 AuthProvider
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI 应用中心",
  description: "探索和使用各种 AI 应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <AuthProvider>
          <Navbar /> {/* 导航栏固定在顶部 */}
          <div className="flex-grow pt-16"> {/* 主内容区域，pt-16 为导航栏预留空间 */}
            <NuqsAdapter>{children}</NuqsAdapter>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}