"use client";
import { Bot, Search, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";

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
  const { user, isLoading: authLoading } = useAuth();
  
  useEffect(() => {
    // 等待认证加载完成
    if (authLoading) return;

    if (!user) {
      // 如果未登录，AuthProvider 会处理跳转，这里只需停止加载
      setLoading(false);
      return;
    }

    const currentUserID = user.username;

    const fetchAssistants = async () => {
      try {
        setLoading(true);
        // 使用配置在 next.config.mjs 中的 rewrite 规则
        // /py-api/user_assistants -> http://localhost:5000/api/user_assistants
        const res = await fetch(`/py-api/user_assistants?user_id=${encodeURIComponent(currentUserID)}`);
        
        if (!res.ok) {
          throw new Error(`请求失败: ${res.status} ${res.statusText}`);
        }
        
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
  }, [user, authLoading]);

  // 处理图标 URL，解决跨平台/localhost 问题
  const getIconUrl = (url: string | null) => {
    if (!url) return null;
    
    // 从环境变量获取后端地址，默认 localhost:5000
    // 注意：NEXT_PUBLIC_ 变量在构建时嵌入，客户端可见
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    
    // 如果 URL 包含后端地址，替换为相对路径，通过 Next.js 代理访问
    if (url.includes(apiBaseUrl)) {
        return url.replace(apiBaseUrl, '');
    }
    // 兼容可能硬编码的 localhost:5000 情况
    if (url.includes('localhost:5000')) {
      return url.replace('http://localhost:5000', '').replace('https://localhost:5000', '');
    }
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">加载应用中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center border border-red-100 dark:border-red-900/30">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">无法加载应用</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 font-medium"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">AI 应用中心</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">选择一个 AI 助手开始您的工作</p>
          </div>
          
          {/* 搜索框预留位置，后续可添加功能 */}
          <div className="relative max-w-xs w-full hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
              placeholder="搜索应用..."
              disabled
            />
          </div>
        </div>

        {apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
              <Bot className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">暂无可用应用</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              您当前没有任何可用的 AI 助手应用。请联系管理员为您分配权限。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {apps.map((app) => {
              const iconUrl = getIconUrl(app.icon_url);
              
              return (
                <Link
                  key={app.ASSISTANT_ID}
                  href={`/chat?assistantId=${encodeURIComponent(app.ASSISTANT_ID)}`}
                  className="group block h-full focus:outline-none"
                >
                  <div className="relative h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group-focus:ring-2 group-focus:ring-blue-500 group-hover:-translate-y-1">
                    
                    {/* 顶部装饰条 */}
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-80" />
                    
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center min-w-0 mr-2">
                          <div className="relative flex-shrink-0 mr-3">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600 group-hover:border-blue-200 dark:group-hover:border-blue-900 transition-colors">
                              {iconUrl ? (
                                <Image
                                  src={iconUrl}
                                  alt={`${app.name} 图标`}
                                  width={48}
                                  height={48}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <Bot className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                              )}
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {app.name}
                          </h3>
                        </div>
                        
                        {/* 状态指示点 (示例) */}
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 ring-4 ring-white dark:ring-gray-800 mt-2"></div>
                      </div>
                      
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 flex-1">
                        {app.description || "暂无描述"}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs font-medium text-gray-400 dark:text-gray-500">
                        <span className="flex items-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          立即开始
                          <svg className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
