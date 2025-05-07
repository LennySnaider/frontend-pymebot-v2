'use client';

import React from 'react';
import { Select as SelectComponent, Option } from './Select';

// Usar otro nombre para evitar colisiones
export const Select = SelectComponent;

// Componentes adicionales necesarios
export const SelectTrigger = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`cursor-pointer ${className || ''}`} {...props}>
    {children}
  </div>
);

export const SelectValue = ({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={className} {...props}>
    {children}
  </span>
);

export const SelectContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-white rounded-md shadow-lg ${className || ''}`} {...props}>
    {children}
  </div>
);

export const SelectItem = Option;