/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Lets the dev server (HMR/asset requests) be reached from this LAN IP,
  // e.g. testing on a phone at http://192.168.1.82:3000. Update this if the
  // machine's DHCP-assigned LAN IP changes.
  allowedDevOrigins: ['192.168.1.82'],
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
