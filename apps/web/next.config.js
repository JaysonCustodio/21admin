/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@business-platform/ui", "@business-platform/shared-types"],
};

module.exports = nextConfig;
