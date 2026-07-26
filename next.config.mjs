/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Chặn Webpack không bundle các module ví phụ trợ gây lỗi
    config.resolve.alias = {
      ...config.resolve.alias,
      '@telegram-apps/bridge': false,
      '@mizuwallet-sdk/core': false,
      'got': false,
      'aptos': false,
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }

    return config;
  },
};

export default nextConfig;
