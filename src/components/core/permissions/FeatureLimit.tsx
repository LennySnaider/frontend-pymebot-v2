'use client'

/**
 * frontend/src/components/core/permissions/FeatureLimit.tsx
 * Componente para mostrar/ocultar características según los límites del plan
 * @version 1.0.0
 * @created 2025-06-05
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { usePlanLimits } from '@/hooks/core/usePlanLimits';
import { Tooltip, Badge } from '@/components/ui';
import { PiLockSimple, PiCrownSimple } from 'react-icons/pi';

interface FeatureLimitProps {
  /**
   * Contenido a mostrar si la característica está disponible
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
   * Nombre de la característica en los límites
   */
  featureName: string;
  
  /**
   * Si debe mostrar un indicador cuando está bloqueado
   */
  showIndicator?: boolean;
  
  /**
   * Mensaje personalizado para cuando está bloqueado
   */
  lockedMessage?: string;
  
  /**
   * Si debe mostrar un tooltip
   */
  showTooltip?: boolean;
  
  /**
   * Si debe renderizar un componente deshabilitado en lugar de ocultarlo
   */
  showDisabled?: boolean;
  
  /**
   * Estilo para el indicador de bloqueo
   */
  indicatorStyle?: 'badge' | 'icon' | 'overlay';
}

/**
 * Componente para mostrar u ocultar características según límites del plan
 */
const FeatureLimit: React.FC<FeatureLimitProps> = ({
  children,
  verticalCode,
  moduleCode,
  featureName,
  showIndicator = true,
  lockedMessage,
  showTooltip = true,
  showDisabled = false,
  indicatorStyle = 'icon'
}) => {
  const { checkOperationAllowed } = usePlanLimits();
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(false);
  
  // Verificar si la característica está disponible
  useEffect(() => {
    const checkFeature = async () => {
      try {
        setLoading(true);
        
        const featureKey = `enable_${featureName}`;
        
        // Obtener restricciones de módulo para este feature
        const result = await checkOperationAllowed(
          verticalCode,
          moduleCode,
          'read',
          featureKey
        );
        
        setIsEnabled(result.allowed);
      } catch (error) {
        console.error(`Error verificando característica ${featureName}:`, error);
        // Por defecto, permitir
        setIsEnabled(true);
      } finally {
        setLoading(false);
      }
    };
    
    checkFeature();
  }, [verticalCode, moduleCode, featureName, checkOperationAllowed]);
  
  // Si está cargando, mostrar skeleton
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement, {
              style: { visibility: 'hidden' }
            });
          }
          return null;
        })}
      </div>
    );
  }
  
  // Si la característica está habilitada
  if (isEnabled) {
    return <>{children}</>;
  }
  
  // Mensaje para mostrar cuando está bloqueado
  const message = lockedMessage || `Esta característica está disponible en planes superiores`;
  
  // Si debe mostrar el componente deshabilitado
  if (showDisabled) {
    const disabledContent = (
      <div 
        className="opacity-50"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement, {
              disabled: true
            });
          }
          return child;
        })}
        
        {/* Mostrar indicador si se solicita */}
        {showIndicator && hovered && indicatorStyle === 'overlay' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/60 rounded">
            <div className="bg-gray-900 px-4 py-2 rounded-lg text-white flex items-center">
              <PiLockSimple className="mr-2" /> 
              Plan Premium
            </div>
          </div>
        )}
      </div>
    );
    
    return showTooltip ? (
      <Tooltip title={message}>
        {disabledContent}
      </Tooltip>
    ) : disabledContent;
  }
  
  // Si se quiere mostrar un indicador en lugar del contenido
  if (showIndicator) {
    switch (indicatorStyle) {
      case 'badge':
        return (
          <Badge
            content="Premium"
            className="bg-amber-500 text-white"
            prefix={<PiCrownSimple className="mr-1" />}
          />
        );
      case 'overlay':
        return (
          <div className="border border-dashed border-gray-300 rounded p-3 flex items-center justify-center h-full">
            <div className="text-center">
              <PiLockSimple className="mx-auto mb-2 text-2xl text-gray-400" />
              <p className="text-sm text-gray-500">{message}</p>
            </div>
          </div>
        );
      case 'icon':
      default:
        return (
          <Tooltip title={message}>
            <span className="inline-flex items-center text-amber-500">
              <PiLockSimple className="mr-1" />
              <span className="text-sm">Característica Premium</span>
            </span>
          </Tooltip>
        );
    }
  }
  
  // Si no se requiere indicador, no mostrar nada
  return null;
};

export default FeatureLimit;