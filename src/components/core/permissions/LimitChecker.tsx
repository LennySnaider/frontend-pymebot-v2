/**
 * frontend/src/components/core/permissions/LimitChecker.tsx
 * Componente para verificar límites del plan en UI
 * @version 1.0.0
 * @created 2025-06-05
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { usePlanLimits } from '@/hooks/core/usePlanLimits';
import { Spinner, Button, Progress, Tooltip } from '@/components/ui';
import { PiWarningCircleFill, PiInfoBold, PiCurrencyCircleDollar } from 'react-icons/pi';

interface LimitCheckerProps {
  /**
   * Contenido a mostrar si está dentro de los límites
   */
  children: ReactNode;
  
  /**
   * Código de la vertical
   */
  verticalCode: string;
  
  /**
   * Código del módulo
   */
  moduleCode: string;
  
  /**
   * Tipo de recurso a verificar
   */
  resourceType: string;
  
  /**
   * Operación a verificar
   */
  operation?: 'create' | 'update' | 'delete' | 'read' | 'export';
  
  /**
   * Cantidad a verificar
   */
  quantity?: number;
  
  /**
   * Si debe mostrar un loader mientras verifica
   */
  showLoader?: boolean;
  
  /**
   * Contenido alternativo si excede el límite
   */
  fallback?: ReactNode;
  
  /**
   * Callback cuando cambia el estado del límite
   */
  onLimitChange?: (isExceeded: boolean) => void;
}

/**
 * Componente que verifica si una operación está dentro de los límites del plan
 */
const LimitChecker: React.FC<LimitCheckerProps> = ({
  children,
  verticalCode,
  moduleCode,
  resourceType,
  operation = 'create',
  quantity = 1,
  showLoader = true,
  fallback,
  onLimitChange
}) => {
  const {
    isLoading,
    limitExceeded,
    limitReason,
    currentUsage,
    checkResource
  } = usePlanLimits();
  
  // Verificar límite cuando se monta o cambian los props
  useEffect(() => {
    checkResource(verticalCode, moduleCode, resourceType, operation, quantity);
  }, [
    verticalCode,
    moduleCode,
    resourceType,
    operation,
    quantity,
    checkResource
  ]);
  
  // Notificar cambios en el estado del límite
  useEffect(() => {
    if (onLimitChange) {
      onLimitChange(limitExceeded);
    }
  }, [limitExceeded, onLimitChange]);
  
  // Si está cargando y se solicita mostrar loader
  if (isLoading && showLoader) {
    return (
      <div className="flex justify-center items-center p-3">
        <Spinner size={24} />
      </div>
    );
  }
  
  // Si excede el límite
  if (limitExceeded) {
    // Si se proporciona fallback personalizado
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Fallback por defecto
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <PiWarningCircleFill className="h-5 w-5 text-amber-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Límite del plan alcanzado
            </h3>
            <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              <p>{limitReason || 'Ha alcanzado el límite máximo para este recurso en su plan actual.'}</p>
              
              {currentUsage && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-amber-800 dark:text-amber-200 flex justify-between">
                    <span>Uso actual: {currentUsage.currentCount} de {currentUsage.maxAllowed}</span>
                    <span>{Math.round(currentUsage.percentageUsed)}%</span>
                  </div>
                  <div className="w-full bg-amber-200 dark:bg-amber-700 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-amber-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(100, currentUsage.percentageUsed)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Button
                size="sm"
                icon={<PiCurrencyCircleDollar />}
                onClick={() => window.location.href = '/app/settings/subscription'}
              >
                Actualizar plan
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Dentro de los límites: renderizar children
  return <>{children}</>;
};

export default LimitChecker;