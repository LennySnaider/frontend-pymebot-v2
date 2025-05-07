'use client';

/**
 * Archivo de compatibilidad para Card
 * Este archivo proporciona exportaciones consistentes del componente Card
 * y sus subcomponentes, resolviendo problemas de sensibilidad a mayúsculas/minúsculas.
 */

// Importar directamente desde la ruta original para evitar referencias circulares
import OriginalCard from './Card/Card';
import type { CardProps } from './Card/Card';
import React from 'react';

// Definir componentes inline para evitar referencias circulares
const CardHeader = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 ${className || ''}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-2xl font-semibold ${className || ''}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-gray-500 ${className || ''}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className || ''}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 flex items-center ${className || ''}`} {...props}>
    {children}
  </div>
);

// Exportar todo para mantener compatibilidad con diferentes patrones
export {
  OriginalCard as Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps
};

// Exportación por defecto para compatibilidad
export default OriginalCard;