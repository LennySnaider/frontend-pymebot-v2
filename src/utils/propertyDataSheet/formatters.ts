/**
 * utils/propertyDataSheet/formatters.ts
 * Funciones de formateo para las fichas técnicas de propiedades
 * 
 * @version 4.0.2
 * @updated 2025-04-10
 */

import { Property } from '@/app/(protected-pages)/modules/properties/property-list/types';

export const formatCurrency = (value: number, currency?: string): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
  }).format(value);
};

export const getOperationTypeName = (operationType?: string): string => {
  switch (operationType) {
    case 'sale': return 'VENTA';
    case 'rent': return 'RENTA';
    case 'all': return 'VENTA/RENTA';
    default: return '';
  }
};

/**
 * Obtiene el color del tipo de operación basado en el tema
 * Si hay un elemento root con la variable CSS --primary, usa ese color
 * De lo contrario, usa colores predeterminados
 */
export const getOperationTypeColor = (operationType?: string): string => {
  // Intentar obtener el color primario del tema
  const primaryColor = typeof window !== 'undefined' 
    ? getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2563eb'
    : '#2563eb';
    
  // Color verde para "RENTA" basado en el color primario
  const rentColor = typeof window !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue('--success').trim() || '#16a34a'
    : '#16a34a';
    
  switch (operationType) {
    case 'sale': return primaryColor;
    case 'rent': return rentColor;
    case 'all': return '#64748b';
    default: return '#64748b';
  }
};

export const getPropertyTypeName = (propertyType?: string): string => {
  switch (propertyType) {
    case 'house': return 'Casa';
    case 'apartment': return 'Departamento';
    case 'land': return 'Terreno';
    case 'commercial': return 'Comercial';
    case 'office': return 'Oficina';
    case 'industrial': return 'Industrial';
    default: return 'Propiedad';
  }
};

export const getStatusName = (status?: string): string => {
  switch (status) {
    case 'available': return 'Disponible';
    case 'sold': return 'Vendido';
    case 'rented': return 'Rentado';
    case 'pending': return 'Pendiente';
    case 'reserved': return 'Reservado';
    default: return 'N/A';
  }
};

export const formatLocation = (property: Property): string => {
  const parts = [
    property.location?.colony, // Reemplazado neighborhood por colony
    property.location?.city,
    property.location?.state,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Ubicación no especificada';
};

export const hasApproximateLocation = (property: Property): boolean => {
  return property.location?.showApproximateLocation === true || property.show_approximate_location === true;
};