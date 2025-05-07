/**
 * frontend/src/components/shared/SimpleSwitch.tsx
 * Componente switch simple sin dependencias del componente Checkbox
 * Proporciona funcionalidad de toggle/switch cuando Checkbox causa problemas
 * @version 1.0.0
 * @updated 2025-05-01
 */

import React from 'react';
import { Controller } from 'react-hook-form';

interface SimpleSwitchProps {
  name: string;
  label: string;
  control: any;
  defaultValue?: boolean;
  rules?: any;
  disabled?: boolean;
  className?: string;
}

/**
 * Un componente switch simple y autónomo sin dependencias de Checkbox
 */
const SimpleSwitch: React.FC<SimpleSwitchProps> = ({
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
        <div className={`flex items-center space-x-3 ${className}`}>
          <button
            type="button"
            role="switch"
            aria-checked={value}
            disabled={disabled}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full 
              transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${
                value
                  ? 'bg-primary-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            onClick={() => {
              if (!disabled) {
                onChange(!value);
              }
            }}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${value ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
          <span
            className={`text-sm ${
              disabled ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {label}
          </span>
        </div>
      )}
    />
  );
};

export default SimpleSwitch;
