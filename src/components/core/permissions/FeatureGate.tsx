/**
 * frontend/src/components/core/permissions/FeatureGate.tsx
 * Componente que verifica el acceso a una característica específica.
 * Facilita el control de acceso a funcionalidades independientes del plan.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { ReactNode } from 'react';
import PermissionGate from './PermissionGate';

interface FeatureGateProps {
  /**
   * Contenido a mostrar si tiene acceso a la característica
   */
  children: ReactNode;
  
  /**
   * Código de la característica a verificar
   */
  featureCode: string;
  
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
 * Componente especializado para verificar acceso a características específicas
 */
const FeatureGate: React.FC<FeatureGateProps> = ({
  children,
  featureCode,
  checkPlan = true,
  fallback,
  showLoader,
  loader,
  ignoreRestrictions
}) => {
  // Fallback personalizado para características no disponibles
  const defaultFallback = (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-yellow-600 dark:text-yellow-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Esta característica no está disponible en su plan actual
          </p>
          <a 
            href="/app/settings/subscription" 
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
          >
            Actualizar plan
          </a>
        </div>
      </div>
    </div>
  );
  
  return (
    <PermissionGate
      featureCode={featureCode}
      checkPlan={checkPlan}
      fallback={fallback || defaultFallback}
      showLoader={showLoader}
      loader={loader}
      ignoreRestrictions={ignoreRestrictions}
    >
      {children}
    </PermissionGate>
  );
};

export default FeatureGate;