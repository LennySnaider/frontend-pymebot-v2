/**
 * Selector de etapas del sales funnel para asociar con nodos del chatbot
 * @version 1.1.0
 * @created 2025-05-17
 * @updated 2025-05-19 - Añadidas etapas confirmado y cerrado
 */

import React from 'react';
import { Select } from '@/components/ui';
import { ALL_SALES_FUNNEL_STAGES, getStageById } from '../types/salesFunnelIntegration';

interface SalesFunnelStageSelectorProps {
  value?: string;
  onChange: (stageId: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  showNoneOption?: boolean;
}

const SalesFunnelStageSelector: React.FC<SalesFunnelStageSelectorProps> = ({
  value,
  onChange,
  label = 'Etapa del Sales Funnel',
  placeholder = 'Selecciona una etapa',
  helperText,
  showNoneOption = true
}) => {
  const currentStage = value ? getStageById(value) : null;

  // Crear las opciones para el Select (incluyendo confirmado y cerrado)
  const options = [
    ...(showNoneOption ? [{
      value: '',
      label: 'Sin etapa asignada',
      color: '#d1d5db'
    }] : []),
    ...ALL_SALES_FUNNEL_STAGES.map(stage => ({
      value: stage.id,
      label: stage.name,
      color: stage.color
    }))
  ];

  // Formato personalizado para las opciones
  const formatOptionLabel = (option: any) => (
    <div className="flex items-center gap-2">
      <div 
        className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600" 
        style={{ backgroundColor: option.color }}
      />
      <span>{option.label}</span>
    </div>
  );

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <Select
        instanceId={`sales-funnel-${label}`}
        value={options.find(option => option.value === value)}
        onChange={(selectedOption) => onChange(selectedOption?.value || '')}
        placeholder={placeholder}
        options={options}
        formatOptionLabel={formatOptionLabel}
        menuPosition="fixed"
        menuPlacement="auto"
        menuShouldScrollIntoView={false}
        menuPortalTarget={document.body}
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          menu: (base) => ({ ...base, maxHeight: '250px' }),
          control: (base) => ({ ...base, cursor: 'pointer' })
        }}
        blurInputOnSelect={true}
        closeMenuOnSelect={true}
      />
      
      {currentStage && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Etapa actual:</span>
          <div className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: currentStage.color }}
            />
            <span className="font-medium">{currentStage.name}</span>
          </div>
        </div>
      )}
      
      {helperText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

// Selector para la acción de mover a otra etapa
export const MoveToStageSelector: React.FC<SalesFunnelStageSelectorProps> = ({
  value,
  onChange,
  ...props
}) => {
  return (
    <SalesFunnelStageSelector
      value={value}
      onChange={onChange}
      label="Mover a etapa"
      placeholder="Selecciona la etapa destino"
      helperText="Esta acción moverá al lead a la etapa seleccionada cuando se ejecute este nodo"
      {...props}
    />
  );
};

// Selector para requerir una etapa antes de ejecutar
export const RequireStageSelector: React.FC<SalesFunnelStageSelectorProps> = ({
  value,
  onChange,
  ...props
}) => {
  return (
    <SalesFunnelStageSelector
      value={value}
      onChange={onChange}
      label="Requiere etapa"
      placeholder="Selecciona la etapa requerida"
      helperText="Este nodo solo se ejecutará si el lead está en la etapa seleccionada"
      {...props}
    />
  );
};

export default SalesFunnelStageSelector;