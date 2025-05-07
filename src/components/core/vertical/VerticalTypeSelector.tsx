/**
 * frontend/src/components/core/vertical/VerticalTypeSelector.tsx
 * Componente para seleccionar entre los diferentes tipos de una vertical.
 * Permite al usuario cambiar entre las variantes específicas de una vertical.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import verticalsService, { VerticalType } from '@/services/core/verticalsService';
import { useVerticalContext } from '@/contexts/VerticalContext';
import { Tooltip } from '@/components/ui/Tooltip';

interface VerticalTypeSelectorProps {
  verticalCode: string;
  onChange?: (typeCode: string) => void;
  className?: string;
  compact?: boolean;  // Para mostrar una versión más compacta
  showIcon?: boolean; // Para mostrar/ocultar iconos
}

/**
 * Componente para seleccionar entre los diferentes tipos disponibles para una vertical
 */
export default function VerticalTypeSelector({
  verticalCode,
  onChange,
  className = '',
  compact = false,
  showIcon = true
}: VerticalTypeSelectorProps) {
  const { typeCode: currentTypeCode } = useVerticalContext();
  const [types, setTypes] = useState<VerticalType[]>([]);
  const [selectedType, setSelectedType] = useState<string | undefined>(currentTypeCode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  
  // Cargar tipos disponibles para esta vertical
  useEffect(() => {
    async function loadTypes() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Obtener tipos habilitados
        const availableTypes = await verticalsService.getEnabledTypes(verticalCode);
        
        // Ordenar por nombre
        availableTypes.sort((a, b) => a.name.localeCompare(b.name));
        
        setTypes(availableTypes);
        
        // Si no hay tipo seleccionado pero hay tipos disponibles, seleccionar el primero
        if (!selectedType && availableTypes.length > 0) {
          setSelectedType(availableTypes[0].code);
        }
      } catch (error) {
        console.error('Error cargando tipos de vertical:', error);
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTypes();
  }, [verticalCode, selectedType]);
  
  // Manejar cambio de tipo
  const handleTypeChange = (typeCode: string) => {
    setSelectedType(typeCode);
    
    // Llamar callback si se proporciona
    onChange?.(typeCode);
    
    // Actualizar URL con el nuevo tipo
    const url = new URL(window.location.href);
    url.searchParams.set('type', typeCode);
    
    // Guardar en localStorage para persistencia
    localStorage.setItem(`${verticalCode}_type`, typeCode);
    
    // Actualizar URL usando router
    router.push(`${pathname}?type=${typeCode}`);
  };
  
  // Si no hay tipos o solo hay uno, no mostrar el selector
  if (types.length <= 1) {
    return null;
  }
  
  // Versión compacta en forma de menú desplegable
  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <select
          value={selectedType}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="block w-full px-4 py-2 pr-8 leading-tight border rounded appearance-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          disabled={isLoading}
        >
          {types.map((type) => (
            <option key={type.code} value={type.code}>
              {type.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-700 dark:text-gray-200">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"></path>
          </svg>
        </div>
      </div>
    );
  }
  
  // Versión completa como botones
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {isLoading ? (
        <div className="animate-pulse h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      ) : types.map((type) => (
        <Tooltip 
          key={type.code}
          content={type.description}
          sideOffset={5}
        >
          <button
            onClick={() => handleTypeChange(type.code)}
            className={`
              flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors
              ${selectedType === type.code 
                ? 'bg-primary-500 text-white dark:bg-primary-700' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700'
              }
            `}
            aria-current={selectedType === type.code ? 'page' : undefined}
          >
            {showIcon && type.icon && (
              <span className="mr-2">{type.icon}</span>
            )}
            {type.name}
          </button>
        </Tooltip>
      ))}
      
      {error && (
        <div className="text-red-500 text-sm">
          Error cargando tipos: {error.message}
        </div>
      )}
    </div>
  );
}