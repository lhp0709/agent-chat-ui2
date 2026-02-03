import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/reset-password"];
const TOKEN_KEY = "fz_auth_token";

export function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const token = req.cookies.get(TOKEN_KEY)?.value;

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico).*)"],
};
