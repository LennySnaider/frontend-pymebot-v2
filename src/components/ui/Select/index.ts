'use client';

import React from 'react';
import { Select as SelectComponent, Option } from '../Select';

// Usar otro nombre para evitar colisiones
const Select = SelectComponent;

// Componentes adicionales necesarios
const SelectTrigger = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`cursor-pointer ${className || ''}`} {...props}>
    {children}
  </div>
);

const SelectValue = ({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={className} {...props}>
    {children}
  </span>
);

const SelectContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-white rounded-md shadow-lg ${className || ''}`} {...props}>
    {children}
  </div>
);

const SelectItem = Option;

// Exportar todo junto
export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
};

// Exportación por defecto para compatibilidad
export default Select;