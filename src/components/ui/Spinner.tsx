/**
 * frontend/src/components/ui/Spinner.tsx
 * Componente de Spinner para indicación de carga con diferentes tamaños y colores.
 * Utiliza Tailwind CSS para estilos y permite personalización.
 * 
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React from 'react';
import { cn } from '@/utils/cn';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'white';

export interface SpinnerProps {
    size?: SpinnerSize;
    color?: SpinnerColor;
    className?: string;
    text?: string;
    textPosition?: 'left' | 'right' | 'top' | 'bottom';
}

export const Spinner: React.FC<SpinnerProps> = ({
    size = 'md',
    color = 'primary',
    className,
    text,
    textPosition = 'right'
}) => {
    // Mapeo de tamaños a clases de Tailwind
    const sizeClasses: Record<SpinnerSize, string> = {
        'xs': 'w-3 h-3',
        'sm': 'w-4 h-4',
        'md': 'w-6 h-6',
        'lg': 'w-8 h-8',
        'xl': 'w-12 h-12'
    };
    
    // Mapeo de colores a clases de Tailwind
    const colorClasses: Record<SpinnerColor, string> = {
        'primary': 'text-primary-500',
        'secondary': 'text-gray-400',
        'success': 'text-green-500',
        'danger': 'text-red-500',
        'warning': 'text-yellow-500',
        'white': 'text-white'
    };
    
    // Clases de tamaño de texto basadas en tamaño del spinner
    const textSizeClasses: Record<SpinnerSize, string> = {
        'xs': 'text-xs',
        'sm': 'text-sm',
        'md': 'text-sm',
        'lg': 'text-base',
        'xl': 'text-lg'
    };
    
    // Configurar el layout basado en la posición del texto
    const layoutClasses: Record<string, string> = {
        'left': 'flex-row-reverse items-center',
        'right': 'flex-row items-center',
        'top': 'flex-col-reverse items-center',
        'bottom': 'flex-col items-center'
    };
    
    // Configurar el espaciado basado en la posición del texto
    const spacingClasses: Record<string, string> = {
        'left': 'mr-2',
        'right': 'ml-2',
        'top': 'mb-2',
        'bottom': 'mt-2'
    };
    
    return (
        <div className={cn('flex', text && layoutClasses[textPosition], className)}>
            <svg
                className={cn(
                    'animate-spin',
                    sizeClasses[size],
                    colorClasses[color]
                )}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                data-testid="spinner"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                ></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
            </svg>
            
            {text && (
                <span className={cn(
                    colorClasses[color],
                    textSizeClasses[size],
                    text && spacingClasses[textPosition]
                )}>
                    {text}
                </span>
            )}
        </div>
    );
};

export default Spinner;
