/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Lets the dev server (HMR/asset requests) be reached from the LAN, e.g.
  // testing on a phone at http://<this machine's IP>:3000. Wildcarded so a new
  // DHCP-assigned address on the subnet doesn't silently block JS again.
  allowedDevOrigins: ['192.168.1.*'],
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
