"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserIcon, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Hide navbar on login and reset-password pages
  if (['/login', '/reset-password'].includes(pathname)) {
    return null;
  }

  const navItems = [
    { name: '应用', href: '/' }, 
    { name: '系统管理', href: '/admin' },   
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 fixed top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <span className="font-semibold text-xl text-gray-800 dark:text-white">精斗云</span>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0 ml-4 flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user.real_name || user.username}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/path/to/user-avatar.jpg" alt={user.username} />
                  <AvatarFallback className='bg-blue-100'>
                     <UserIcon className="h-4 w-4 text-blue-600" />
                  </AvatarFallback>
                </Avatar>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={logout}
                  title="退出登录"
                  className="ml-2 text-gray-500 hover:text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};


export default Navbar;