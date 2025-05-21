/**
 * Indicador visual de etapa del sales funnel para nodos
 * @version 1.0.0
 * @created 2025-05-19
 */

import React from 'react';
import { getStageById } from '../../types/salesFunnelIntegration';

interface SalesFunnelIndicatorProps {
  stageId?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const SalesFunnelIndicator: React.FC<SalesFunnelIndicatorProps> = ({
  stageId,
  size = 'sm',
  showLabel = false,
  position = 'top-right'
}) => {
  if (!stageId) return null;
  
  const stage = getStageById(stageId);
  if (!stage) return null;
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2'
  };
  
  return (
    <div className={`absolute ${positionClasses[position]} flex items-center gap-1 z-10`}>
      <div
        className={`${sizeClasses[size]} rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm`}
        style={{ backgroundColor: stage.color }}
        title={`Etapa: ${stage.name}`}
      />
      {showLabel && (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1 py-0.5 bg-white dark:bg-gray-800 rounded shadow-sm">
          {stage.name}
        </span>
      )}
    </div>
  );
};

export default SalesFunnelIndicator;