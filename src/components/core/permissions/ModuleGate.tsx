/**
 * frontend/src/components/core/permissions/ModuleGate.tsx
 * Componente que verifica el acceso a un módulo específico dentro de una vertical.
 * Facilita el control de acceso a funcionalidades específicas por módulo.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { ReactNode } from 'react';
import PermissionGate from './PermissionGate';

interface ModuleGateProps {
  /**
   * Contenido a mostrar si tiene acceso al módulo
   */
  children: ReactNode;
  
  /**
   * Código de la vertical a la que pertenece el módulo
   */
  verticalCode: string;
  
  /**
   * Código del módulo a verificar
   */
  moduleCode: string;
  
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
 * Componente especializado para verificar acceso a módulos
 */
const ModuleGate: React.FC<ModuleGateProps> = ({
  children,
  verticalCode,
  moduleCode,
  checkPlan = true,
  fallback,
  showLoader,
  loader,
  ignoreRestrictions
}) => {
  // Página de fallback personalizada para módulos no accesibles
  const defaultFallback = (
    <div className="p-8 text-center">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          Módulo no disponible
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300">
          Este módulo no está disponible en su plan actual o no tiene permisos para acceder a él.
        </p>
      </div>
      <div className="mt-4">
        <a 
          href="/app/settings/subscription" 
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Actualizar plan
        </a>
        <span className="mx-2">•</span>
        <a 
          href="/app/dashboard" 
          className="text-gray-600 dark:text-gray-400 hover:underline"
        >
          Ir al Dashboard
        </a>
      </div>
    </div>
  );
  
  return (
    <PermissionGate
      verticalCode={verticalCode}
      moduleCode={moduleCode}
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

export default ModuleGate;