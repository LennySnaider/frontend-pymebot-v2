/**
 * frontend/src/components/shared/ToggleRadio.tsx
 * Componente que utiliza Radio pero con apariencia de un switch o toggle
 * Ofrece una alternativa visual al Checkbox cuando este causa problemas
 * @version 1.0.0
 * @updated 2025-05-01
 */

import React from 'react';
import { Radio } from '../ui/Radio';
import { Controller } from 'react-hook-form';

interface ToggleRadioProps {
  name: string;
  label: string;
  control: any;
  defaultValue?: boolean;
  rules?: any;
  disabled?: boolean;
  className?: string;
}

/**
 * Componente que utiliza Radio para crear un toggle/switch
 * Compatible con react-hook-form como alternativa al Checkbox
 */
const ToggleRadio: React.FC<ToggleRadioProps> = ({
  name,
  label,
  control,
  defaultValue = false,
  rules,
  disabled = false,
  className = '',
}) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      rules={rules}
      render={({ field: { onChange, value } }) => (
        <div className={`flex items-center ${className}`}>
          <div className="flex items-center mr-4">
            <Radio.Group
              value={value ? 'true' : 'false'}
              onChange={(val) => onChange(val === 'true')}
            >
              <div className="flex flex-row items-center space-x-2">
                <Radio value="true" disabled={disabled} />
                <Radio value="false" disabled={disabled} />
                <span className={`ml-2 ${disabled ? 'text-gray-400' : ''}`}>
                  {label}
                </span>
              </div>
            </Radio.Group>
          </div>
        </div>
      )}
    />
  );
};

export default ToggleRadio;
