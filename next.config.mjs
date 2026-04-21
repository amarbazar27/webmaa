/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabling security headers temporarily to fix Auth Handler error
  async headers() {
    return [];
  },
};

export default nextConfig;

export default nextConfig;
