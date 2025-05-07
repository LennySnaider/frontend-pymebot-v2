/**
 * utils/propertyDataSheet/imageUtils.ts
 * Utilidades para manejar imágenes en fichas técnicas de propiedades
 * 
 * @version 1.0.0
 * @updated 2025-04-07
 */

import { DEFAULT_MAIN_IMAGE_URL, DEFAULT_THUMBNAIL_URL } from './constants';

interface PropertyMedia {
  url: string;
  isPrimary?: boolean;
}

interface Property {
  media?: PropertyMedia[];
}

/**
 * Obtiene las URLs de las imágenes principales y secundarias de una propiedad
 */
export const getPropertyImages = (property: Property) => {
  const primaryMedia = property.media?.find((m: PropertyMedia) => m.isPrimary === true);
  const mainImageUrl = primaryMedia?.url || property.media?.[0]?.url || DEFAULT_MAIN_IMAGE_URL;
  
  const secondaryMedia = property.media?.filter((m: PropertyMedia) => m.url !== mainImageUrl) || [];
  const imageUrl1 = secondaryMedia[0]?.url || DEFAULT_THUMBNAIL_URL;
  const imageUrl2 = secondaryMedia[1]?.url || DEFAULT_THUMBNAIL_URL;
  const imageUrl3 = secondaryMedia[2]?.url || DEFAULT_THUMBNAIL_URL;
  
  return {
    mainImageUrl,
    imageUrl1,
    imageUrl2,
    imageUrl3
  };
};
