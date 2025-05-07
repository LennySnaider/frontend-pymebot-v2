/**
 * frontend/src/components/verticals/bienes_raices/features/PropertyCard.tsx
 * Componente de tarjeta para mostrar información de una propiedad.
 * Diseñado para ser utilizado en listados de propiedades inmobiliarias.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState } from 'react';

/**
 * Tipos de estado para las propiedades
 */
export type PropertyStatus = 'disponible' | 'vendida' | 'reservada' | 'alquilada' | 'inactiva';

/**
 * Tipos de operación
 */
export type OperationType = 'venta' | 'alquiler' | 'alquiler_temp';

/**
 * Interfaz para las propiedades del componente PropertyCard
 */
interface PropertyCardProps {
  /** ID único de la propiedad */
  id: string;
  /** Código interno de la propiedad */
  propertyCode: string;
  /** Título de la propiedad */
  title: string;
  /** Tipo de propiedad (Casa, Apartamento, etc.) */
  propertyType: string;
  /** Ubicación (Ciudad, Estado) */
  location: {
    city: string;
    state: string;
  };
  /** Precio de la propiedad */
  price: number;
  /** Tipo de operación (venta, alquiler) */
  operationType: OperationType;
  /** Características principales */
  features: {
    bedrooms: number;
    bathrooms: number;
    area: number;
  };
  /** Estado actual de la propiedad */
  status: PropertyStatus;
  /** URL de la imagen principal */
  imageUrl?: string;
  /** Función llamada al hacer clic en ver detalles */
  onDetailsClick?: () => void;
  /** Función llamada al editar la propiedad */
  onEditClick?: () => void;
  /** Función llamada al eliminar la propiedad */
  onDeleteClick?: () => void;
  /** Clases CSS adicionales */
  className?: string;
  /** Determina si se muestra en modo compacto (tabla) */
  compact?: boolean;
}

/**
 * Componente que muestra una tarjeta con información de una propiedad inmobiliaria
 */
export default function PropertyCard({
  id,
  propertyCode,
  title,
  propertyType,
  location,
  price,
  operationType,
  features,
  status,
  imageUrl = '/api/placeholder/320/240',
  onDetailsClick,
  onEditClick,
  onDeleteClick,
  className = '',
  compact = false,
}: PropertyCardProps) {
  // Estado para controlar acciones en menú desplegable
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  
  // Formatear precio como moneda
  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(price);
  
  // Mapeo de estados a estilos visuales
  const statusStyles: Record<PropertyStatus, { bgColor: string, textColor: string, text: string }> = {
    disponible: {
      bgColor: 'bg-green-100 dark:bg-green-800/30',
      textColor: 'text-green-800 dark:text-green-400',
      text: 'Disponible'
    },
    vendida: {
      bgColor: 'bg-blue-100 dark:bg-blue-800/30',
      textColor: 'text-blue-800 dark:text-blue-400',
      text: 'Vendida'
    },
    reservada: {
      bgColor: 'bg-amber-100 dark:bg-amber-800/30',
      textColor: 'text-amber-800 dark:text-amber-400',
      text: 'Reservada'
    },
    alquilada: {
      bgColor: 'bg-purple-100 dark:bg-purple-800/30',
      textColor: 'text-purple-800 dark:text-purple-400',
      text: 'Alquilada'
    },
    inactiva: {
      bgColor: 'bg-gray-100 dark:bg-gray-800/30',
      textColor: 'text-gray-800 dark:text-gray-400',
      text: 'Inactiva'
    }
  };
  
  // Mapeo de tipo de operación a texto
  const operationText: Record<OperationType, string> = {
    venta: 'Venta',
    alquiler: 'Alquiler',
    alquiler_temp: 'Alquiler Temporal'
  };
  
  // Si está en modo compacto (tabla), renderizar versión reducida
  if (compact) {
    return (
      <tr className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${className}`}>
        <td className="py-3 px-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 mr-3">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover rounded"
              />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ID: {propertyCode}</p>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-sm">
          <p>{location.city}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{location.state}</p>
        </td>
        <td className="py-3 px-4 text-sm">
          <p className="font-medium">{formattedPrice}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{operationText[operationType]}</p>
        </td>
        <td className="py-3 px-4 text-sm">
          <div className="flex space-x-3">
            <div>
              <span className="text-gray-700 dark:text-gray-300">{features.bedrooms}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400"> hab</span>
            </div>
            <div>
              <span className="text-gray-700 dark:text-gray-300">{features.bathrooms}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400"> baños</span>
            </div>
            <div>
              <span className="text-gray-700 dark:text-gray-300">{features.area}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400"> m²</span>
            </div>
          </div>
        </td>
        <td className="py-3 px-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status].bgColor} ${statusStyles[status].textColor}`}>
            {statusStyles[status].text}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <div className="relative inline-block text-left">
            <button
              onClick={() => setActionMenuOpen(!actionMenuOpen)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {actionMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  {onDetailsClick && (
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        onDetailsClick();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Ver detalles
                    </button>
                  )}
                  {onEditClick && (
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        onEditClick();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Editar propiedad
                    </button>
                  )}
                  {onDeleteClick && (
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        onDeleteClick();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Eliminar propiedad
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  }
  
  // Versión completa para vista de tarjeta
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Imagen de la propiedad */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status].bgColor} ${statusStyles[status].textColor}`}>
            {statusStyles[status].text}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        {/* Título y código */}
        <div className="mb-2">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span>ID: {propertyCode}</span>
            <span className="mx-2">•</span>
            <span>{propertyType}</span>
          </p>
        </div>
        
        {/* Ubicación */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {location.city}, {location.state}
        </p>
        
        {/* Precio y tipo de operación */}
        <div className="mb-3">
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formattedPrice}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
              {operationType === 'alquiler' || operationType === 'alquiler_temp' ? '/mes' : ''}
            </span>
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {operationText[operationType]}
          </p>
        </div>
        
        {/* Características */}
        <div className="flex space-x-4 mb-3">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-gray-600 dark:text-gray-400">{features.bedrooms} hab</span>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-gray-600 dark:text-gray-400">{features.bathrooms} baños</span>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
            <span className="text-gray-600 dark:text-gray-400">{features.area} m²</span>
          </div>
        </div>
        
        {/* Acciones */}
        <div className="flex justify-between items-center mt-4">
          {onDetailsClick && (
            <button
              onClick={onDetailsClick}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Ver detalles
            </button>
          )}
          
          <div className="relative">
            <button
              onClick={() => setActionMenuOpen(!actionMenuOpen)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {actionMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  {onEditClick && (
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        onEditClick();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Editar propiedad
                    </button>
                  )}
                  {onDeleteClick && (
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        onDeleteClick();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Eliminar propiedad
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}