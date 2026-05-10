/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'plaid-merchant-logos.plaid.com',
      },
      {
        protocol: 'https',
        hostname: 'plaid-category-icons.plaid.com',
      },
      {
        protocol: 'https',
        hostname: '**.plaid.com',
      }
    ]
  }
};

export default nextConfig;
