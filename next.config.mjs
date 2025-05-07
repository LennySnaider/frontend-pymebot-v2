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
