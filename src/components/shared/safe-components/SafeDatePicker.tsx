'use client';

/**
 * frontend/src/components/shared/safe-components/SafeDatePicker.tsx
 * Componente seguro para DatePicker que previene errores de hidratación.
 * Encapsula componentes de calendarios para evitar inconsistencias entre SSR y CSR.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React, { ComponentType } from 'react';
import SafeHydration from './SafeHydration';

export interface SafeDatePickerProps {
  /** Componente DatePicker a renderizar */
  DatePickerComponent: ComponentType<any>;
  
  /** Props para pasar al componente DatePicker */
  datePickerProps: Record<string, any>;
  
  /** Clase CSS para el placeholder durante la carga */
  placeholderClassName?: string;
  
  /** Altura del placeholder */
  placeholderHeight?: string | number;
  
  /** Ancho del placeholder */
  placeholderWidth?: string | number;
  
  /** Texto alternativo para el placeholder */
  placeholderText?: string;
}

/**
 * Componente seguro para DatePicker que evita errores de hidratación.
 * Esto es especialmente útil para componentes de calendario que tienen
 * diferencias significativas entre el renderizado del servidor y el cliente.
 */
const SafeDatePicker: React.FC<SafeDatePickerProps> = ({
  DatePickerComponent,
  datePickerProps,
  placeholderClassName = '',
  placeholderHeight = '10',
  placeholderWidth = 'full',
  placeholderText,
}) => {
  // Construir clase para el placeholder
  const placeholderClass = `min-w-[200px] w-${placeholderWidth} h-${placeholderHeight} bg-gray-100 dark:bg-gray-700 rounded animate-pulse ${placeholderClassName}`;
  
  // Crear placeholder con texto si es necesario
  const placeholder = placeholderText ? (
    <div className={placeholderClass}>
      <div className="h-full flex items-center justify-start px-3 text-gray-400 dark:text-gray-500 truncate">
        {placeholderText}
      </div>
    </div>
  ) : (
    <div className={placeholderClass}></div>
  );
  
  return (
    <SafeHydration 
      fallback={placeholder}
      // Añadimos un pequeño delay para asegurar que cualquier inicialización JavaScript esté completa
      delay={50}
    >
      <DatePickerComponent {...datePickerProps} />
    </SafeHydration>
  );
};

export default SafeDatePicker;
