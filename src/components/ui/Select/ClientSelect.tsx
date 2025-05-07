'use client';

/**
 * frontend/src/components/ui/Select/ClientSelect.tsx
 * Wrapper para el componente Select que se asegura de renderizarlo solo en el cliente,
 * evitando errores de hidratación relacionados con ReactSelect.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { useState, useEffect } from 'react';
import Select from './Select';
import type { SelectProps } from './Select';
import type { GroupBase } from 'react-select';

/**
 * Una versión del componente Select que se renderiza exclusivamente en el cliente
 * para evitar problemas de hidratación, especialmente con aria-activedescendant
 */
export function ClientSelect<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(props: SelectProps<Option, IsMulti, Group>) {
  const [isMounted, setIsMounted] = useState(false);

  // Solo renderizamos el componente Select cuando estamos en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Renderizar un placeholder durante SSR
  if (!isMounted) {
    // Este div actuará como placeholder durante la renderización del servidor
    // y tendrá aproximadamente el mismo tamaño que el Select
    return (
      <div 
        className="select-placeholder-ssr w-full h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
        aria-hidden="true"
      />
    );
  }

  // En el cliente, renderizamos el componente Select real
  return <Select {...props} />;
}

export default ClientSelect;