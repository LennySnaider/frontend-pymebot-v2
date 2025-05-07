'use client';

/**
 * Archivo de índice para Card
 * Este archivo proporciona exportaciones consistentes del componente Card
 * y sus subcomponentes, compatibles con la versión de cards.tsx.
 */

import React from 'react';
import CardComponent from '../Card';
import type { CardProps } from '../Card';

// Importar desde el archivo de compatibilidad para garantizar consistencia
import { 
  Card as CardCompat,
  CardHeader as CardHeaderCompat,
  CardTitle as CardTitleCompat,
  CardDescription as CardDescCompat,
  CardContent as CardContentCompat,
  CardFooter as CardFooterCompat
} from '../cards';

// Reexportar los componentes desde el archivo de compatibilidad
// para garantizar que sean exactamente iguales
export const Card = CardCompat;
export const CardHeader = CardHeaderCompat;
export const CardTitle = CardTitleCompat;
export const CardDescription = CardDescCompat;
export const CardContent = CardContentCompat;
export const CardFooter = CardFooterCompat;
export type { CardProps };

// Exportación por defecto para compatibilidad
export default Card;