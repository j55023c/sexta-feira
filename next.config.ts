import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Permite importar SVGs e outros assets futuramente
  experimental: {
    // turbopack já é padrão no Next 14+
  },
}

export default nextConfig
