'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Lock, User, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('登录成功');
        login(data.token, data.user);
      } else {
        toast.error(data.message || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-50 via-white to-pink-50 overflow-hidden">
      {/* 装饰性背景元素 - 淡雅色调 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/40 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-100/40 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md px-4 -mt-20"> {/* -mt-20 整体上移 */}
        <div className="text-center mb-8 space-y-2">
           <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-md mb-4 ring-1 ring-gray-100">
              <Sparkles className="w-8 h-8 text-blue-600" />
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-gray-900">
             精斗云 AI
           </h1>
           <p className="text-gray-500 text-sm font-medium tracking-wide uppercase">
             Next Generation Agent Platform
           </p>
        </div>

        <Card className="border-0 shadow-2xl bg-white ring-1 ring-gray-100">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">欢迎回来</CardTitle>
            <CardDescription className="text-center text-gray-500">
              请输入您的账号和密码以继续
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 font-medium">用户名</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-blue-600" />
                  <Input
                    id="username"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 focus:bg-white transition-all h-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 font-medium">密码</Label>
                  <Link 
                    href="/reset-password" 
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    忘记密码?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-blue-600" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 focus:bg-white transition-all h-10"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-0 transition-all duration-200 font-medium" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '登 录'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-gray-100 pt-6 mt-2">
            <p className="text-xs text-gray-400">
              AI Agent Platform &copy; 2026
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
