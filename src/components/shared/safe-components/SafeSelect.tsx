'use client';

/**
 * frontend/src/components/shared/safe-components/SafeSelect.tsx
 * Componente seguro para Select que previene errores de hidratación.
 * Encapsula el componente Select con SafeHydration para evitar inconsistencias entre SSR y CSR.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React from 'react';
import Select, { SelectProps } from '@/components/ui/Select';
import SafeHydration from './SafeHydration';
import { GroupBase } from 'react-select';

export interface SafeSelectProps<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
> extends SelectProps<Option, IsMulti, Group> {
  /** Clase CSS para el placeholder durante la carga */
  placeholderClassName?: string;
  
  /** Altura del placeholder */
  placeholderHeight?: string | number;

  /** Texto alternativo para el placeholder */
  placeholderText?: string;
}

/**
 * Select seguro que evita errores de hidratación renderizando solo en el cliente.
 * Incluye un placeholder visualmente apropiado durante la carga.
 */
function SafeSelect<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>({
  placeholderClassName = '',
  placeholderHeight = '9',
  placeholderText,
  ...props
}: SafeSelectProps<Option, IsMulti, Group>) {
  // Construir clase para el placeholder
  const placeholderClass = `min-w-[150px] h-${placeholderHeight} bg-gray-100 dark:bg-gray-700 rounded animate-pulse ${placeholderClassName}`;
  
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
    <SafeHydration fallback={placeholder}>
      <Select<Option, IsMulti, Group>
        {...props}
        // Aseguramos que las propiedades ARIA que causan problemas de hidratación se manejen correctamente
        aria={{ 
          activedescendant: undefined,
          ...(props.aria || {})
        }}
        // Aseguramos que inputProps también sea seguro
        inputProps={{
          'aria-activedescendant': undefined,
          ...(props.inputProps || {})
        }}
      />
    </SafeHydration>
  );
}

export default SafeSelect;
