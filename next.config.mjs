import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@ffmpeg-installer/ffmpeg'],
    
    // Optimizaciones para mejorar la compilación y reducir memoria
    webpack: (config, { dev, isServer }) => {
        // Reducir el tamaño del bundle
        if (!dev) {
            config.optimization.minimize = true;
        }
        
        // Mejorar el manejo de chunks para evitar errores de carga
        config.optimization.splitChunks = {
            ...config.optimization.splitChunks,
            chunks: 'all',
            cacheGroups: {
                default: false,
                vendors: false,
                vendor: {
                    chunks: 'all',
                    name: 'vendor',
                    test: /node_modules/,
                },
                common: {
                    minChunks: 2,
                    priority: -10,
                    reuseExistingChunk: true,
                },
            },
        };
        
        // Evitar procesar algunos archivos grandes en desarrollo
        if (dev) {
            config.watchOptions = {
                ignored: ['**/node_modules', '**/.git', '**/public/img'],
            };
        }
        
        return config;
    },
    
    // Reducir el nivel de estadísticas en desarrollo
    devIndicators: {
        buildActivityPosition: 'bottom-right',
    },
    
    // Comprimir menos en desarrollo para usar menos memoria
    compress: process.env.NODE_ENV === 'production',
    
    // Optimización de imágenes
    images: {
        minimumCacheTTL: 60,
        formats: ['image/webp'],
    },
    
    // Proxy para redirigir las peticiones de API al backend
    async rewrites() {
        return [
            // Excluir rutas de autenticación del proxy
            {
                source: '/api/auth/:path*',
                destination: '/api/auth/:path*',
            },
            // Excluir rutas de templates (manejadas por el frontend)
            {
                source: '/api/templates/:path*',
                destination: '/api/templates/:path*',
            },
            // Excluir rutas de tenants (manejadas por el frontend)
            {
                source: '/api/tenants/:path*',
                destination: '/api/tenants/:path*',
            },
            // Excluir rutas de chat que se manejan en el frontend
            {
                source: '/api/chat/conversation/:path*',
                destination: '/api/chat/conversation/:path*',
            },
            // Excluir rutas de conversaciones
            {
                source: '/api/conversations/:path*',
                destination: '/api/conversations/:path*',
            },
            // Redirigir todas las demás rutas API al backend
            {
                source: '/api/:path*',
                destination: 'http://localhost:3090/api/:path*',
            },
        ];
    },
}

export default withNextIntl(nextConfig)
