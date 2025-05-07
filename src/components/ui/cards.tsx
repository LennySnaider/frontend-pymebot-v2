'use client';

/**
 * Archivo de compatibilidad para Card
 * Este archivo proporciona exportaciones consistentes del componente Card
 * y sus subcomponentes, resolviendo problemas de sensibilidad a mayúsculas/minúsculas.
 */

import OriginalCard from './Card/Card';
import React from 'react';
import type { CardProps } from './Card/Card';

// Reexportar Card con un nombre diferente para evitar colisiones
export const Card = OriginalCard;

// Componentes adicionales que se necesitan
export const CardHeader = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 ${className || ''}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-2xl font-semibold ${className || ''}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-gray-500 ${className || ''}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className || ''}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 flex items-center ${className || ''}`} {...props}>
    {children}
  </div>
);

export type { CardProps };

// Exportar por defecto para soportar import Card from '@/components/ui/cards'
export default Card;