'use client'

/**
 * frontend/src/components/core/permissions/ResourceLimit.tsx
 * Componente para mostrar el uso de recursos y límites en UI
 * @version 1.0.0
 * @created 2025-06-05
 */

import React, { useState, useEffect } from 'react';
import { usePlanLimits } from '@/hooks/core/usePlanLimits';
import { Progress, Tooltip } from '@/components/ui';
import { PiInfoBold } from 'react-icons/pi';

interface ResourceLimitProps {
  /**
   * Código de la vertical
   */
  verticalCode: string;
  
  /**
   * Código del módulo
   */
  moduleCode: string;
  
  /**
   * Tipo de recurso a mostrar
   */
  resourceType: string;
  
  /**
   * Si debe actualizarse automáticamente
   */
  autoRefresh?: boolean;
  
  /**
   * Intervalo de actualización en ms
   */
  refreshInterval?: number;
  
  /**
   * Modo compacto
   */
  compact?: boolean;
  
  /**
   * Etiquetas personalizadas
   */
  labels?: {
    title?: string;
    description?: string;
  };
}

/**
 * Componente para mostrar uso de recursos y límites
 */
const ResourceLimit: React.FC<ResourceLimitProps> = ({
  verticalCode,
  moduleCode,
  resourceType,
  autoRefresh = false,
  refreshInterval = 60000, // 1 minuto
  compact = false,
  labels
}) => {
  const { getResourceUsage } = usePlanLimits();
  const [usage, setUsage] = useState<{
    currentCount: number;
    maxAllowed: number;
    percentageUsed: number;
    isExceeded: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Obtener los datos de uso
  const fetchUsage = async () => {
    try {
      const result = await getResourceUsage(
        verticalCode,
        moduleCode,
        resourceType
      );
      setUsage(result);
    } catch (error) {
      console.error('Error obteniendo uso de recursos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar datos iniciales
  useEffect(() => {
    fetchUsage();
  }, [verticalCode, moduleCode, resourceType]);
  
  // Configurar refresco automático si se solicita
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchUsage, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, verticalCode, moduleCode, resourceType]);
  
  // Si no hay datos o está cargando
  if (!usage || loading) {
    return (
      <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
    );
  }
  
  // Si el recurso no tiene límite
  if (usage.maxAllowed === Infinity) {
    return null;
  }
  
  // Etiquetas personalizadas o predeterminadas
  const getTitle = () => {
    if (labels?.title) return labels.title;
    
    // Etiquetas predeterminadas según tipo
    switch (resourceType) {
      case 'records': return 'Registros';
      case 'storage': return 'Almacenamiento';
      case 'users': return 'Usuarios';
      case 'templates': return 'Plantillas';
      case 'reports': return 'Reportes';
      case 'custom_fields': return 'Campos personalizados';
      case 'appointments': return 'Citas';
      default: return 'Uso';
    }
  };
  
  // Determinar color según porcentaje
  const getColor = () => {
    if (usage.isExceeded) return 'red';
    if (usage.percentageUsed > 90) return 'amber';
    if (usage.percentageUsed > 75) return 'yellow';
    return 'blue';
  };
  
  // Versión compacta
  if (compact) {
    return (
      <Tooltip title={`${usage.currentCount} de ${usage.maxAllowed} ${getTitle()}`}>
        <div className="w-full">
          <Progress 
            color={getColor()} 
            percent={Math.min(100, usage.percentageUsed)} 
            showInfo={false} 
            size="sm"
          />
        </div>
      </Tooltip>
    );
  }
  
  // Versión completa
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <div className="text-sm font-medium flex items-center">
          {getTitle()}
          {labels?.description && (
            <Tooltip title={labels.description}>
              <PiInfoBold className="ml-1 text-gray-400 h-4 w-4" />
            </Tooltip>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {usage.currentCount} / {usage.maxAllowed}
        </div>
      </div>
      <Progress 
        color={getColor()} 
        percent={Math.min(100, usage.percentageUsed)} 
        showInfo={false}
      />
    </div>
  );
};

export default ResourceLimit;