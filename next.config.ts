import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tclvquwsxbntvwvozeto.supabase.co';
const projectHost = supabaseUrl.includes('.supabase.co')
  ? new URL(supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`).hostname
  : 'tclvquwsxbntvwvozeto.supabase.co';

const nextConfig: NextConfig = {
  // HTTP compression — reduces response sizes significantly
  compress: true,

  // Tree-shake heavy icon libraries — only bundle icons actually used
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },

  // Image optimization config
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },

  // Supabase proxy rewrites (India bypass)
  async rewrites() {
    return [
      { source: '/rest/v1/:path*',     destination: `https://${projectHost}/rest/v1/:path*` },
      { source: '/auth/v1/:path*',     destination: `https://${projectHost}/auth/v1/:path*` },
      { source: '/storage/v1/:path*',  destination: `https://${projectHost}/storage/v1/:path*` },
      { source: '/realtime/v1/:path*', destination: `https://${projectHost}/realtime/v1/:path*` },
    ];
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
