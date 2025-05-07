#!/bin/bash

# Script para ejecutar el servidor de desarrollo con estrategia de carga de módulos por chunks
echo "Iniciando servidor de desarrollo con estrategia de carga por chunks..."

# Crear archivo temporal de configuración para dev que habilita el chunking dinámico
cat > temp-dev-config.mjs << EOF
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@ffmpeg-installer/ffmpeg'],
    
    // División agresiva en chunks para reducir tamaño de módulos individuales
    webpack: (config, { dev, isServer }) => {
        // Implementar división en chunks más pequeños
        config.optimization.splitChunks = {
            chunks: 'all',
            maxInitialRequests: 25,
            maxAsyncRequests: 25,
            minSize: 20000,
            maxSize: 80000,
            cacheGroups: {
                vendors: {
                    test: /[\\\\/]node_modules[\\\\/]/,
                    priority: -10,
                    reuseExistingChunk: true,
                },
                commons: {
                    name: 'commons',
                    minChunks: 2,
                    priority: -20,
                },
                components: {
                    test: /[\\\\/]components[\\\\/]/,
                    minChunks: 1,
                    priority: -10,
                    reuseExistingChunk: true,
                },
                default: {
                    minChunks: 1,
                    priority: -30,
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
    
    // Optimización para desarrollo
    swcMinify: false,
    compress: false,
    
    // Desactivar análisis estático
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
}

export default withNextIntl(nextConfig)
EOF

# Configurar variables de entorno para desarrollo
export NODE_OPTIONS="--max-old-space-size=8192"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_CONFIG_FILE=temp-dev-config.mjs

# Ejecutar servidor de desarrollo con la configuración temporal
echo "Iniciando Next.js en modo desarrollo con chunking activo..."
npx next dev --no-turbo -c temp-dev-config.mjs

# Limpiar archivo temporal al terminar
rm temp-dev-config.mjs