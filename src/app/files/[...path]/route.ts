import { NextRequest, NextResponse } from 'next/server';

// 从环境变量读取后端地址，默认为 http://127.0.0.1:5000
const TARGET_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000') + '/files';

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join('/');
  const query = req.nextUrl.search;
  const targetUrl = `${TARGET_BASE_URL}/${pathStr}${query}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
         // 对于文件请求，通常不需要传递太多头信息，但保持一致性无害
      },
      cache: 'no-store'
    });

    if (!response.ok) {
       // 如果是文件未找到，返回 404
      if (response.status === 404) {
          return new NextResponse(null, { status: 404 });
      }
      return new NextResponse(null, { status: response.status });
    }

    const responseHeaders = new Headers(response.headers);
    // 确保 Content-Type 正确传递 (如 image/png)
    
    const responseBody = await response.arrayBuffer();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('File Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, props);
}
