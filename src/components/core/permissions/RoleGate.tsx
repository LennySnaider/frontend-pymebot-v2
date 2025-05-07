/**
 * frontend/src/components/core/permissions/RoleGate.tsx
 * Componente que verifica el acceso basado en el rol del usuario.
 * Facilita el control de acceso a secciones basadas en roles.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { ReactNode } from 'react';
import PermissionGate from './PermissionGate';
import { UserRole } from '@/lib/core/permissions';

interface RoleGateProps {
  /**
   * Contenido a mostrar si el usuario tiene el rol requerido
   */
  children: ReactNode;
  
  /**
   * Rol mínimo requerido
   */
  role: UserRole;
  
  /**
   * Contenido alternativo a mostrar si no tiene el rol requerido
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
}

/**
 * Componente especializado para verificar acceso basado en roles
 */
const RoleGate: React.FC<RoleGateProps> = ({
  children,
  role,
  fallback,
  showLoader,
  loader
}) => {
  // Fallback personalizado para roles no autorizados
  const defaultFallback = (
    <div className="p-6 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-900/20">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 text-red-600 dark:text-red-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
            Acceso Restringido
          </h3>
          <p className="text-red-600 dark:text-red-400 mt-1">
            No tiene permisos suficientes para acceder a esta sección.
          </p>
          <a 
            href="/app/dashboard" 
            className="inline-block px-4 py-2 mt-3 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Volver al Dashboard
          </a>
        </div>
      </div>
    </div>
  );
  
  return (
    <PermissionGate
      role={role}
      fallback={fallback || defaultFallback}
      showLoader={showLoader}
      loader={loader}
    >
      {children}
    </PermissionGate>
  );
};

export default RoleGate;