/**
 * utils/generatePropertyDataSheet.ts
 * Utilidad para generar la ficha técnica de una propiedad en formato PDF o imprimirla directamente
 * Este archivo ahora sirve como punto de entrada a la implementación modularizada.
 *
 * @version 4.0.0
 * @updated 2025-04-09
 */

import { 
  generatePropertyDataSheet as generatePDF,
  printPropertyDataSheet as printPDF
} from './propertyDataSheet';
import { Property } from '@/app/(protected-pages)/modules/properties/property-list/types';

/**
 * Genera la ficha técnica de una propiedad en formato PDF
 * Esta función es un wrapper del generador de PDF modularizado
 */
export const generatePropertyDataSheet = async (property: Property): Promise<void> => {
  return generatePDF(property);
};

/**
 * Imprime la ficha técnica de la propiedad directamente
 * Esta función es un wrapper del impresor modularizado
 */
export const printPropertyDataSheet = async (property: Property): Promise<void> => {
  return printPDF(property);
};
