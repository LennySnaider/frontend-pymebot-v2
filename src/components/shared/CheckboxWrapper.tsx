/**
 * frontend/src/components/shared/CheckboxWrapper.tsx
 * Componente wrapper para el checkbox que resuelve problemas de importación
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React from 'react';
import Checkbox from '../ui/Checkbox';

interface CheckboxWrapperProps {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * Componente wrapper para Checkbox que resuelve problemas de importación
 * y proporciona una API consistente para usar en formularios
 */
const CheckboxWrapper: React.FC<CheckboxWrapperProps> = ({
  checked = false,
  onChange,
  children,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`checkbox-wrapper ${className}`}>
      <Checkbox
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      >
        {children}
      </Checkbox>
    </div>
  );
};

export default CheckboxWrapper;
