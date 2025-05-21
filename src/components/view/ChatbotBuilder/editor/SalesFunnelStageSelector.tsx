'use client'

/**
 * Componente para seleccionar la etapa del sales funnel en el editor de nodos
 * @version 1.0.0
 * @created 2025-05-19
 */

import React from 'react';
import { Select, Option } from '@/components/ui/Select';
import { 
  SALES_FUNNEL_STAGES, 
  ALL_SALES_FUNNEL_STAGES,
  getStageColor, 
  getAllStages,
  SalesFunnelStage 
} from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/types/salesFunnelIntegration';

interface SalesFunnelStageSelectorProps {
  nodeId: string;
  currentStageId?: string;
  onStageChange: (nodeId: string, stageId: string) => void;
  label?: string;
  includeAdditionalStates?: boolean;
}

export const SalesFunnelStageSelector: React.FC<SalesFunnelStageSelectorProps> = ({
  nodeId,
  currentStageId,
  onStageChange,
  label = "Etapa del Sales Funnel",
  includeAdditionalStates = true
}) => {
  const stages = includeAdditionalStates ? ALL_SALES_FUNNEL_STAGES : SALES_FUNNEL_STAGES;
  
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <Select
        value={currentStageId || ''}
        onChange={(value) => onStageChange(nodeId, value)}
        className="w-full"
      >
        <Option value="">Sin etapa asignada</Option>
        {stages.map((stage) => (
          <Option key={stage.id} value={stage.id}>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full ring-1 ring-gray-300 dark:ring-gray-600"
                style={{ backgroundColor: stage.color }}
              />
              <span className="text-sm">{stage.name}</span>
            </div>
          </Option>
        ))}
      </Select>
      
      {currentStageId && (
        <div className="mt-2 flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: getStageColor(currentStageId) }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Etapa actual: {stages.find(s => s.id === currentStageId)?.name}
          </span>
        </div>
      )}
    </div>
  );
};

// Componente para mostrar qué etapa el nodo puede asignar al lead
export const SalesFunnelMoveToSelector: React.FC<SalesFunnelStageSelectorProps> = ({
  nodeId,
  currentStageId,
  onStageChange,
  includeAdditionalStates = true
}) => {
  return (
    <SalesFunnelStageSelector
      nodeId={nodeId}
      currentStageId={currentStageId}
      onStageChange={onStageChange}
      label="Mover lead a etapa"
      includeAdditionalStates={includeAdditionalStates}
    />
  );
};

// Componente para mostrar qué etapa requiere el nodo para ejecutarse
export const SalesFunnelRequiredStageSelector: React.FC<SalesFunnelStageSelectorProps> = ({
  nodeId,
  currentStageId,
  onStageChange,
  includeAdditionalStates = true
}) => {
  return (
    <SalesFunnelStageSelector
      nodeId={nodeId}
      currentStageId={currentStageId}
      onStageChange={onStageChange}
      label="Etapa requerida"
      includeAdditionalStates={includeAdditionalStates}
    />
  );
};