/** @type {import('next').NextInsets}.NextConfig */
const nextConfig = {
  reactStrictMode: true,
  // Tắt kiểm tra TypeScript và ESLint khi build trên Vercel nếu cần
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Nếu đang build ở Server (Node.js), không bundle các SDK browser/wasm
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        "@shelby-protocol/sdk",
        "@shelby-protocol/sdk/browser",
      ];
    }

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
};

export default nextConfig;
