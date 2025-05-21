/**
 * Wrapper para nodos con indicador de sales funnel
 * @version 1.0.0
 * @created 2025-05-19
 */

import React from 'react';
import SalesFunnelIndicator from './SalesFunnelIndicator';

interface NodeWrapperProps {
  children: React.ReactNode;
  selected?: boolean;
  salesStageId?: string;
  className?: string;
  borderColor?: string;
  backgroundColor?: string;
}

const NodeWrapper: React.FC<NodeWrapperProps> = ({
  children,
  selected = false,
  salesStageId,
  className = '',
  borderColor = 'border-gray-200 dark:border-gray-700',
  backgroundColor = 'bg-white dark:bg-gray-800'
}) => {
  const selectedBorderColor = 'border-blue-500';
  
  return (
    <div className={`relative px-4 py-2 rounded-lg shadow-md border-2 
      ${selected ? selectedBorderColor : borderColor} 
      ${backgroundColor} 
      ${className}`}>
      <SalesFunnelIndicator stageId={salesStageId} />
      {children}
    </div>
  );
};

export default NodeWrapper;