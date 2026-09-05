/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@business-platform/ui", "@business-platform/shared-types"],
  // proxies browser-side /api/* calls to the real backend so they stay
  // same-origin from the browser's point of view — web and api are separate
  // domains in production, and a genuinely cross-origin fetch can't reliably
  // share the session cookie back to this app's own server-side cookies()
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

module.exports = nextConfig;
