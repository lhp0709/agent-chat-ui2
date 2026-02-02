// app/admin/layout.tsx
"use client"; // 添加这一行，将布局标记为客户端组件

import Link from 'next/link';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation'; // 导入 usePathname

// 定义菜单项
const menuItems = [
  { name: '用户管理', path: '/admin/users' },
  { name: '应用管理', path: '/admin/apps' },
  { name: '角色权限管理', path: '/admin/permissions' },
];

// 定义 Layout Props
type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname(); // 现在可以在客户端组件中使用 usePathname 了

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* 左侧菜单 */}
      <div className="w-64 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">系统管理</h2>
        </div>
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={
                    pathname === item.path // 比较当前路径与菜单项路径
                      ? 'block px-4 py-2 text-sm rounded-md bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white' // 当前激活样式
                      : 'block px-4 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700' // 默认样式
                  }
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* 右侧内容区域 - 子页面内容将在这里渲染 */}
      <div className="flex-1 p-6 h-full overflow-auto">
        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 h-full">
          {children}
        </div>
      </div>
    </div>
  );
}