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
}

export default withNextIntl(nextConfig)
