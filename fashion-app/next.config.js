/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://harqer.github.io' 
    : undefined,
  basePath: process.env.NODE_ENV === 'production' 
    ? '/kyzo' 
    : undefined,
}

module.exports = nextConfig
