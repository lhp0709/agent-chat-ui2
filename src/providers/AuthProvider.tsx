'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

interface User {
  id: number;
  username: string;
  real_name?: string;
  roles?: { id: number; name: string }[];
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

const TOKEN_KEY = 'fz_auth_token';
const USER_KEY = 'fz_auth_user';
const SESSION_TIMEOUT_HOURS = Number(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_HOURS) || 3;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const lastActivityRef = useRef<number>(Date.now());

  // 初始化检查
  useEffect(() => {
    const token = Cookies.get(TOKEN_KEY);
    const userData = Cookies.get(USER_KEY);
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Failed to parse user data", e);
        Cookies.remove(TOKEN_KEY);
        Cookies.remove(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // 登录
  const login = useCallback((token: string, userData: User) => {
    Cookies.set(TOKEN_KEY, token, { expires: 1 }); // 1天物理过期，逻辑过期由超时控制
    Cookies.set(USER_KEY, JSON.stringify(userData), { expires: 1 });
    setUser(userData);
    lastActivityRef.current = Date.now();
    router.push('/');
  }, [router]);

  // 登出
  const logout = useCallback(() => {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(USER_KEY);
    setUser(null);
    router.push('/login');
  }, [router]);

  // 监听用户活动，重置超时计时器
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    if (user) {
      window.addEventListener('mousemove', updateActivity);
      window.addEventListener('keydown', updateActivity);
      window.addEventListener('click', updateActivity);
      window.addEventListener('scroll', updateActivity);
    }

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [user]);

  // 定时检查是否超时
  useEffect(() => {
    if (!user) return;

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActivityRef.current;
      const timeoutMs = SESSION_TIMEOUT_HOURS * 60 * 60 * 1000;

      if (inactiveTime > timeoutMs) {
        console.log("Session timed out due to inactivity");
        logout();
      }
    }, 60000); // 每分钟检查一次

    return () => clearInterval(checkInterval);
  }, [user, logout]);

  // 路由保护
  useEffect(() => {
    if (isLoading) return;

    const publicPaths = ['/login', '/reset-password'];
    if (!user && !publicPaths.includes(pathname)) {
      router.push('/login');
    }
    
    // 如果已登录但访问登录页，跳转到首页
    if (user && publicPaths.includes(pathname)) {
      router.push('/');
    }
  }, [user, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user,
      isLoading 
    }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
