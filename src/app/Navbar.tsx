// app/components/Navbar.tsx
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserIcon } from 'lucide-react';

const Navbar = () => {
  const navItems = [
    { name: '应用', href: '/' }, // 指向根路径
    { name: '知识库', href: '/knowledge' }, // 假设页面存在
    { name: '系统管理', href: '/admin' },   // 假设页面存在
  ];

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
                  className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0 ml-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/path/to/user-avatar.jpg" alt="@user" />
              <AvatarFallback className='bg-blue-100'>
                 <UserIcon className="h-4 w-4 text-blue-600" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;