/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http', // 或 'https'，根据你的服务器协议
        hostname: 'localhost',
        port: '5000', // 你的文件服务器端口
        pathname: '/files/**', // 允许 /files/ 下的所有路径
      },
      // 如果将来还有其他域名，可以继续添加
      // {
      //   protocol: 'https',
      //   hostname: 'your-production-image-domain.com',
      //   port: '',
      //   pathname: '/**',
      // },
    ],
  },
};

export default nextConfig;
