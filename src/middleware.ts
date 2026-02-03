import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/reset-password"];
const TOKEN_KEY = "fz_auth_token";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const { pathname, searchParams } = url;
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const token = req.cookies.get(TOKEN_KEY)?.value;

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 如果访问 /chat 且没有 assistantId，跳转到首页
  if (pathname === '/chat' && !searchParams.get('assistantId')) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico).*)"],
};
