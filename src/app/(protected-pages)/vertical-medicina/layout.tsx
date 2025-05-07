/**
 * frontend/src/app/(protected-pages)/vertical-medicina/layout.tsx
 * Layout principal para la vertical de medicina.
 * Define la estructura común de todas las páginas de la vertical.
 * @version 2.0.0
 * @updated 2025-04-30
 */

'use client';

import { useEffect, useState } from 'react';
import VerticalLayout from '@/components/layouts/vertical/VerticalLayout';
import { usePathname } from 'next/navigation';
import VerticalPreloader from '@/components/core/VerticalPreloader';

interface MedicinaLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout específico para la vertical de Medicina
 * Utiliza el VerticalLayout común y añade funcionalidades específicas para medicina
 */
export default function MedicinaLayout({ children }: MedicinaLayoutProps) {
  const pathname = usePathname();
  
  // Determinar tipo de vertical basado en query param o localStorage (si se ha seleccionado antes)
  const [typeCode, setTypeCode] = useState<string | undefined>(undefined);
  
  // Detectar tipo de vertical desde la URL o localStorage
  useEffect(() => {
    // Intentar obtener desde URL primero (prioridad)
    const url = new URL(window.location.href);
    const typeFromUrl = url.searchParams.get('type');
    
    if (typeFromUrl) {
      setTypeCode(typeFromUrl);
      // Guardar en localStorage para persistencia
      localStorage.setItem('medicina_type', typeFromUrl);
      return;
    }
    
    // Si no está en URL, intentar desde localStorage
    const savedType = localStorage.getItem('medicina_type');
    if (savedType) {
      setTypeCode(savedType);
    }
  }, []);
  
  // Determinar título basado en la ruta
  let defaultTitle = 'Medicina';
  
  if (pathname.includes('/pacientes')) {
    if (pathname.split('/').length > 3) {
      defaultTitle = 'Expediente de Paciente';
    } else {
      defaultTitle = 'Pacientes';
    }
  }

  return (
    <VerticalPreloader
      verticalCode="medicina"
      showIndicator={true}
    >
      <VerticalLayout 
        verticalCode="medicina"
        typeCode={typeCode} // Pasar el tipo detectado
        defaultTitle={defaultTitle}
      >
        {/* Aquí podrían ir elementos específicos del layout de medicina */}
        {children}
      </VerticalLayout>
    </VerticalPreloader>
  );
}