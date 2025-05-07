'use client';

/**
 * frontend/src/components/shared/safe-components/SafeChart.tsx
 * Componente seguro para visualizaciones y gráficos que previene errores de hidratación.
 * Encapsula componentes de gráficos para evitar inconsistencias entre SSR y CSR.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React, { ComponentType } from 'react';
import SafeHydration from './SafeHydration';

export interface SafeChartProps {
  /** Componente de gráfico a renderizar */
  ChartComponent: ComponentType<any>;
  
  /** Props para pasar al componente de gráfico */
  chartProps: Record<string, any>;
  
  /** Clase CSS para el placeholder durante la carga */
  placeholderClassName?: string;
  
  /** Altura del placeholder */
  placeholderHeight?: string | number;
  
  /** Ancho del placeholder */
  placeholderWidth?: string | number;
  
  /** Si es true, muestra un efecto de pulso para simular carga de datos */
  pulseEffect?: boolean;
  
  /** Si es true, muestra líneas simuladas en el placeholder */
  simulatedLines?: boolean;
  
  /** Delay adicional para asegurar que las librerías de gráficos estén inicializadas */
  chartDelay?: number;
}

/**
 * Componente seguro para visualizaciones y gráficos.
 * Soluciona problemas comunes de hidratación con librerías de gráficos
 * que a menudo hacen cálculos basados en el DOM o window.
 */
const SafeChart: React.FC<SafeChartProps> = ({
  ChartComponent,
  chartProps,
  placeholderClassName = '',
  placeholderHeight = '64',
  placeholderWidth = 'full',
  pulseEffect = true,
  simulatedLines = true,
  chartDelay = 100,
}) => {
  // Crear clases para el placeholder
  const baseClass = `w-${placeholderWidth} h-${placeholderHeight} bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${placeholderClassName}`;
  const pulseClass = pulseEffect ? 'animate-pulse' : '';
  const placeholderClass = `${baseClass} ${pulseClass} overflow-hidden`;
  
  // Crear placeholder con líneas simuladas si se solicita
  const placeholder = (
    <div className={placeholderClass}>
      {simulatedLines && (
        <div className="p-4 h-full flex flex-col justify-between">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="flex-1 flex items-end gap-2">
            {Array.from({ length: 7 }).map((_, index) => {
              const height = 20 + Math.random() * 60;
              return (
                <div 
                  key={index} 
                  className="bg-gray-200 dark:bg-gray-700 rounded-t"
                  style={{ 
                    height: `${height}%`, 
                    width: `${100 / 9}%`
                  }}
                ></div>
              );
            })}
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mt-4"></div>
        </div>
      )}
    </div>
  );
  
  return (
    <SafeHydration 
      fallback={placeholder}
      // Añadir delay para cargar adecuadamente las librerías de gráficos
      delay={chartDelay}
    >
      <ChartComponent {...chartProps} />
    </SafeHydration>
  );
};

export default SafeChart;
