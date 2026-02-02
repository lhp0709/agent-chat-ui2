// app/page.tsx
"use client";
import { Card } from "@/components/ui/card";
import { Bot } from "lucide-react";
import Link from "next/link"; // 确保导入 Link
import Image from "next/image";
import { useState, useEffect } from "react";

interface AppItem {
  ASSISTANT_ID: string;
  name: string;
  description: string;
  icon_url: string | null;
}

export default function HomePage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = 'http://localhost:5000';
  // 📌 从你的认证系统获取当前用户 ID
  const currentUserID: string | null = typeof window !== 'undefined' 
    ? localStorage.getItem('user_id') || 'testuser' 
    : 'server_side_user';

  useEffect(() => {
    if (!currentUserID) {
      setError("用户未登录");
      setLoading(false);
      return;
    }

    const fetchAssistants = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/user_assistants?user_id=${encodeURIComponent(currentUserID)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setApps(data.assistants || []);
      } catch (err) {
        console.error("获取应用失败:", err);
        setError(err instanceof Error ? err.message : "加载失败");
        setApps([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssistants();
  }, [currentUserID]);

  if (loading) {
    return (
      <div className="pb-10 bg-white min-h-screen flex items-center justify-center">
        <p className="text-gray-500">加载应用中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-10 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-700 font-medium">❌ {error}</p>
          <p className="text-red-500 text-sm mt-1">请检查网络或重新登录。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 dark:text-white">AI 应用</h2>

          {apps.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Bot className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <p>暂无可用应用</p>
              <p className="text-sm mt-1">请联系管理员为您分配 AI 助手权限。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {apps.map((app) => (
                <div
                  key={app.ASSISTANT_ID}
                  role="link"
                  tabIndex={0}
                  onClick={() => {
                    window.location.href = `/chat?assistant_id=${encodeURIComponent(app.ASSISTANT_ID)}`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      window.location.href = `/chat?assistant_id=${encodeURIComponent(app.ASSISTANT_ID)}`;
                    }
                  }}
                  className="group relative aspect-[2/1] bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden cursor-pointer dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {/* 🔹 悬停遮罩层：磨砂玻璃质感，80% 透明度 */}
                  <div 
                    className="absolute inset-0 bg-black opacity-0 group-hover:opacity-80 transition-all duration-300 z-10 flex items-center justify-center backdrop-blur-lg"
                    aria-hidden="true"
                  >
                    <span className="text-white font-semibold text-lg z-20">开始探索</span>
                  </div>

                  {/* 🔹 卡片内容：使用 flex-col + gap，精确控制区域 */}
                  <div className="h-full flex flex-col p-3 pt-2">
                    {/* 👉 区域1: 图标 + 标题（固定最小高度） */}
                    <div className="flex items-start min-h-[28px]">
                      <div className="flex-shrink-0 mr-3">
                        <div className="bg-gray-100 rounded-lg w-10 h-10 flex items-center justify-center overflow-hidden">
                          {app.icon_url ? (
                            <Image
                              src={app.icon_url}
                              alt={`${app.name} 图标`}
                              width={28}
                              height={28}
                              className="object-contain"
                            />
                          ) : (
                            <Bot className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {app.name}
                      </h3>
                    </div>

                    {/* 👉 区域2: 描述（自动填充剩余空间） */}
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex-grow leading-relaxed mt-2">
                      {app.description}
                    </p>

                    {/* 👉 区域3: 底部微留白（可选） */}
                    <div className="h-1"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}