"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';

const Navbar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const getUserInitial = () => {
    if (!user) return '?';
    const name = user.real_name || user.username;
    return name.charAt(0).toUpperCase();
  };

  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 fixed top-0 left-0 right-0 z-[10000]">
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
          <div className="flex-shrink-0 ml-4 flex items-center">
            {user && (
              <div className="relative" ref={dropdownRef}>
                {isDropdownOpen && (
                  <div
                    className="fixed inset-0 z-40 bg-transparent pointer-events-auto"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(false);
                    }}
                  />
                )}
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 focus:outline-none group p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Avatar className="h-8 w-8 transition-transform group-hover:scale-105">
                    {/* <AvatarImage src="/path/to/user-avatar.jpg" alt={user.username} /> */}
                    <AvatarFallback className='bg-blue-100 text-blue-700 font-semibold'>
                       {getUserInitial()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user.real_name || user.username}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform duration-200", isDropdownOpen ? "rotate-180" : "")} />
                </button>

                {isDropdownOpen && (
                  <div onMouseDown={(e) => e.stopPropagation()} className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 py-2 transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200 z-[10001] pointer-events-auto">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.real_name || user.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {user.email || user.username}
                      </p>
                      {user.roles && user.roles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {user.roles.map(role => (
                            <span key={role.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                              {role.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="py-1">
                       {/* Placeholder for future profile links */}
                       {/* <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                         个人资料
                       </Link> */}
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};


export default Navbar;
