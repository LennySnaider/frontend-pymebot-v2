/**
 * frontend/src/components/core/permissions/VerticalGate.tsx
 * Componente que verifica el acceso a una vertical específica.
 * Facilita el control de acceso a secciones basadas en verticales de negocio.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { ReactNode } from 'react';
import PermissionGate from './PermissionGate';

interface VerticalGateProps {
  /**
   * Contenido a mostrar si tiene acceso a la vertical
   */
  children: ReactNode;
  
  /**
   * Código de la vertical a verificar
   */
  verticalCode: string;
  
  /**
   * Verificar tanto permisos como plan de suscripción
   */
  checkPlan?: boolean;
  
  /**
   * Contenido alternativo a mostrar si no tiene acceso
   */
  fallback?: ReactNode;
  
  /**
   * Si debe mostrar un loader mientras verifica
   */
  showLoader?: boolean;
  
  /**
   * Componente de carga personalizado
   */
  loader?: ReactNode;
  
  /**
   * Si se deben ignorar las restricciones (modo debug)
   */
  ignoreRestrictions?: boolean;
}

/**
 * Componente especializado para verificar acceso a verticales
 */
const VerticalGate: React.FC<VerticalGateProps> = ({
  children,
  verticalCode,
  checkPlan = true,
  fallback,
  showLoader,
  loader,
  ignoreRestrictions
}) => {
  return (
    <PermissionGate
      verticalCode={verticalCode}
      checkPlan={checkPlan}
      fallback={fallback}
      showLoader={showLoader}
      loader={loader}
      ignoreRestrictions={ignoreRestrictions}
    >
      {children}
    </PermissionGate>
  );
};

export default VerticalGate;