/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Tắt check type strict khi build Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 2. Cấu hình Webpack hỗ trợ WebAssembly & Node polyfills cho Web3 SDK
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
