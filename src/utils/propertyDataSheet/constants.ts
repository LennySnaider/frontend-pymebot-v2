/**
 * utils/propertyDataSheet/constants.ts
 * Constantes para la generación de fichas técnicas de propiedades
 * 
 * @version 1.0.0
 * @updated 2025-04-07
 */

// Constantes de configuración
export const PDF_MARGIN_MM = 20; // Margen en milímetros para el PDF (aumentado para asegurar visibilidad completa)

// URLs de imágenes por defecto
export const DEFAULT_MAIN_IMAGE_URL = 'https://placehold.co/800x400/EFEFEF/AAAAAA?text=Imagen+Principal';
export const DEFAULT_THUMBNAIL_URL = 'https://placehold.co/300x200/EFEFEF/AAAAAA?text=Imagen';

// Configuración para la generación del PDF
export const PDF_CONFIG = {
  orientation: 'portrait' as const,
  unit: 'mm' as const,
  format: 'a4' as const,
  compress: true,
  precision: 2,
  hotfixes: ['px_scaling']
};

// Configuración para html2canvas
export const HTML2CANVAS_CONFIG = {
  scale: 4, // Aumentado a 4 para mejorar la calidad
  useCORS: true,
  backgroundColor: '#FFFFFF',
  logging: false,
  imageTimeout: 30000,
  removeContainer: false,
  allowTaint: true,
  foreignObjectRendering: false,
  scrollX: 0,
  scrollY: 0,
  windowWidth: 0, // Se configurará dinámicamente
  windowHeight: 0, // Se configurará dinámicamente
  x: 0,
  y: 0,
  onclone: (doc) => {
    // Mejora estilos cuando se clona el documento para renderizar
    Array.from(doc.getElementsByTagName('img')).forEach(img => {
      img.style.maxWidth = '100%';
      img.crossOrigin = 'anonymous';
    });
  }
};

// Dimensiones de página A4 en milímetros
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
