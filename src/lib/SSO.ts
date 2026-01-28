// lib/auth.ts
import Cookies from 'js-cookie'; // 需要安装: pnpm add js-cookie @types/js-cookie

const AUTH_COOKIE_NAME = 'fz_auth_token';

export const setAuthCookie = (token: string): void => {
  Cookies.set(AUTH_COOKIE_NAME, token, { expires: 7 }); // 保存7天
};

export const getAuthCookie = (): string | undefined => {
  return Cookies.get(AUTH_COOKIE_NAME);
};

export const removeAuthCookie = (): void => {
  Cookies.remove(AUTH_COOKIE_NAME);
};

// 检查前端是否认为用户已登录（例如，检查 cookie）
export const checkAuthStatus = async (): Promise<boolean> => {
  const token = getAuthCookie();
  if (!token) {
    return false; // 没有 token，肯定没登录
  }

  // 可以选择性地调用一个验证 token 的 API 端点
  // 这里省略 API 调用示例，取决于你的 token 验证机制
  return true; // 假设有 token 就认为已登录
};