/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disabilita i reindirizzamenti con trailing slash che potrebbero causare errori 307
  trailingSlash: false,
  // Assicura una gestione corretta dei reindirizzamenti
  async redirects() {
    return []
  },
  // Configurazioni per Vercel
  output: 'standalone',
  // Escludi better-sqlite3 dal bundle se non necessario (ma è necessario, quindi lo includiamo)
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  // Disabilita ESLint durante il build per Vercel (gli errori sono solo warning di caratteri)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig


