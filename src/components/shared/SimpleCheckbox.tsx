/**
 * frontend/src/components/shared/SimpleCheckbox.tsx
 * Componente de checkbox simplificado sin dependencias externas.
 * Este componente evita los problemas de referencia con el componente Checkbox original.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React from 'react';

interface SimpleCheckboxProps {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Un componente de checkbox simple y autónomo
 * No depende de otras importaciones para evitar problemas de resolución de módulos
 */
const SimpleCheckbox: React.FC<SimpleCheckboxProps> = ({
  checked = false,
  onChange,
  children,
  disabled = false,
  className = '',
  id,
}) => {
  // Manejar el cambio en el checkbox
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  // Generar un ID único si no se proporciona uno
  const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 11)}`;

  return (
    <div className={`inline-flex items-center ${className}`}>
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className={`form-checkbox h-4 w-4 text-primary-600 transition duration-150 ease-in-out 
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      />
      {children && (
        <label
          htmlFor={checkboxId}
          className={`ml-2 block text-sm leading-5 
            ${disabled ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 cursor-pointer'}`}
        >
          {children}
        </label>
      )}
    </div>
  );
};

export default SimpleCheckbox;
