/**
 * frontend/src/components/shared/CheckboxAlternative.tsx
 * Componente alternativo que utiliza Radio para simular funcionalidad de Checkbox
 * Solución temporal para los casos donde el componente Checkbox causa errores
 * @version 1.0.0
 * @updated 2025-05-01
 */

import React from 'react';
import { Radio } from '../ui/Radio';
import { Controller } from 'react-hook-form';

interface CheckboxAlternativeProps {
  name: string;
  label: string;
  control: any;
  defaultValue?: boolean;
  rules?: any;
  disabled?: boolean;
  className?: string;
}

/**
 * Componente que utiliza Radio para simular un checkbox
 * Compatible con react-hook-form para ser usado como reemplazo directo
 */
const CheckboxAlternative: React.FC<CheckboxAlternativeProps> = ({
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
        <div className={`flex items-center space-x-2 ${className}`}>
          <Radio.Group
            value={value ? 'true' : 'false'}
            onChange={(val) => onChange(val === 'true')}
          >
            <div className="flex items-center">
              <Radio value="true" disabled={disabled}>
                {label}
              </Radio>
            </div>
          </Radio.Group>
        </div>
      )}
    />
  );
};

export default CheckboxAlternative;
