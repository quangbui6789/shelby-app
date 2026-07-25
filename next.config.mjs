/** @type {import('next').NextPage} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        got: false,
      };
    }
    return config;
  },
};

export default nextConfig;
