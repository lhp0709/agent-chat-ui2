import { NextRequest, NextResponse } from 'next/server';

// 从环境变量读取后端地址，默认为 http://127.0.0.1:5000
const TARGET_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000') + '/api';

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join('/');
  const query = req.nextUrl.search;
  const targetUrl = `${TARGET_BASE_URL}/${pathStr}${query}`;

  try {
    const headers = new Headers();
    // 复制请求头，排除 host 和 connection 等
    req.headers.forEach((value, key) => {
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.blob() : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      cache: 'no-store'
    });

    // 复制响应头
    const responseHeaders = new Headers(response.headers);
    // 可以在这里处理 CORS 头，或者 Next.js 会自动处理

    const responseBody = await response.arrayBuffer();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend service' },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, props);
}

export async function POST(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, props);
}

export async function PUT(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, props);
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, props);
}
