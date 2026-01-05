/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disabilita i reindirizzamenti con trailing slash che potrebbero causare errori 307
  trailingSlash: false,
  // Assicura una gestione corretta dei reindirizzamenti
  async redirects() {
    return []
  },
}

module.exports = nextConfig


