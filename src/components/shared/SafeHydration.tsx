'use client';

/**
 * frontend/src/components/shared/SafeHydration.tsx
 * Componente de utilidad para prevenir errores de hidratación en componentes
 * que pueden tener diferencias entre servidor y cliente.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { useState, useEffect, ReactNode } from 'react';

interface SafeHydrationProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente que muestra su contenido solo del lado del cliente para prevenir
 * errores de hidratación. Útil para componentes como react-select, calendario, etc.
 * que pueden tener inconsistencias entre renderizado servidor-cliente.
 */
const SafeHydration = ({ children, fallback }: SafeHydrationProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Renderizamos un espacio vacío o un placeholder en el servidor
    return fallback ? <>{fallback}</> : null;
  }

  // Renderizamos los children solo en el cliente
  return <>{children}</>;
};

export default SafeHydration;
