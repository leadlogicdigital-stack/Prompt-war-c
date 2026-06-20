/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint isn't installed in this project; don't let its absence block builds.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
