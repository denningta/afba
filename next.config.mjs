/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: [
      'plaid-merchant-logos.plaid.com',
      'plaid-category-icons.plaid.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.plaid.com/',
        pathname: '**',
        port: '',
      }

    ]
  }
};

export default nextConfig;
