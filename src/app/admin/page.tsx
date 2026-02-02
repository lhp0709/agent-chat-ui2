// app/admin/permissions/page.tsx
"use client";

import { Shield, Lock, Settings, Sparkles } from "lucide-react";

export default function AdminHomePage() {
  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-100/50 via-transparent to-transparent dark:from-gray-800/30" />
      </div>

      {/* 主内容卡片 */}
      <div className="relative z-10 text-center max-w-md mx-auto p-8">
        {/* 图标组合 */}
        <div className="relative mb-8 inline-block">
          <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl scale-150 animate-pulse" />
          <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Shield className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border border-gray-100 dark:border-gray-700">
            <Settings className="w-5 h-5 text-gray-400 animate-spin-slow" />
          </div>
        </div>

        {/* 标题 */}
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
          系统管理
        </h1>

        {/* 描述 */}
        <div className="space-y-3">
          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
            正在构建更强大的权限控制系统
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            <Sparkles className="w-4 h-4" />
            <span>即将推出</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              Coming Soon
            </span>
          </div>
        </div>

        {/* 功能预览网格 */}
        <div className="mt-10 grid grid-cols-2 gap-4 opacity-50">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
            <Lock className="w-6 h-6 text-gray-400 mb-2 mx-auto" />
            <p className="text-xs text-gray-500 dark:text-gray-400">细粒度权限控制</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
            <Shield className="w-6 h-6 text-gray-400 mb-2 mx-auto" />
            <p className="text-xs text-gray-500 dark:text-gray-400">角色安全策略</p>
          </div>
        </div>

        {/* 装饰线条 */}
        <div className="mt-12 flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-600" />
          <div className="w-2 h-2 rounded-full bg-blue-500/50" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600" />
        </div>
      </div>
    </div>
  );
}