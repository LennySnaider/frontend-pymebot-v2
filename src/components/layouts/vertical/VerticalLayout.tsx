/**
 * frontend/src/components/layouts/vertical/VerticalLayout.tsx
 * Componente de layout compartido para todas las verticales.
 * Proporciona estructura común y contexto compartido.
 * @version 2.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import { VerticalProvider } from '@/contexts/VerticalContext';

interface VerticalLayoutProps {
  children: React.ReactNode;
  verticalCode: string;
  typeCode?: string; // Nuevo: código del tipo de vertical (opcional)
  defaultTitle?: string;
}

/**
 * Layout común para todas las verticales que proporciona el contexto compartido
 */
export default function VerticalLayout({ 
  children, 
  verticalCode,
  typeCode,
  defaultTitle 
}: VerticalLayoutProps) {
  const pathname = usePathname();
  const [title, setTitle] = useState(defaultTitle || verticalCode);

  // Actualizar título basado en la ruta actual
  useEffect(() => {
    if (defaultTitle) {
      setTitle(defaultTitle);
    } else {
      // Podría implementarse lógica para detectar automáticamente
      // el título basado en la ruta actual o en la configuración de la vertical
      const pathSegments = pathname.split('/');
      const lastSegment = pathSegments[pathSegments.length - 1];
      
      // Convertir formato-url a Formato URL (capitalizar primera letra de cada palabra)
      if (lastSegment && lastSegment !== verticalCode) {
        const formattedTitle = lastSegment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        setTitle(formattedTitle);
      } else {
        // Usar el verticalCode como fallback, con primera letra mayúscula
        setTitle(verticalCode.charAt(0).toUpperCase() + verticalCode.slice(1));
      }
    }
    
    // Actualizar título de la página en el navegador
    document.title = `${title} | PymeBot`;
  }, [pathname, verticalCode, title, defaultTitle]);

  return (
    <VerticalProvider 
      verticalCode={verticalCode}
      typeCode={typeCode} // Pasar tipo a VerticalProvider
    >
      <div className="flex flex-col min-h-full">
        {/* Aquí se podría agregar un header común para todas las verticales */}
        
        {/* Breadcrumb o navegación específica podría ir aquí */}
        
        {/* Contenido principal */}
        <main className="flex-1">
          {children}
        </main>
        
        {/* Toaster para notificaciones */}
        <Toaster />
      </div>
    </VerticalProvider>
  );
}