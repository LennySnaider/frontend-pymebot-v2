'use client';

/**
 * frontend/src/components/examples/SafeDateFormatExample.tsx
 * Ejemplo de uso de SafeDynamicContent para fechas formateadas.
 * Demuestra cómo resolver problemas de hidratación con fechas que dependen del locale del usuario.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React from 'react';
import { SafeDynamicContent } from '@/components/shared/safe-components';

/**
 * Componente de ejemplo que muestra cómo utilizar SafeDynamicContent para fechas formateadas,
 * que típicamente causan errores de hidratación debido a diferencias entre el servidor y el cliente.
 */
const SafeDateFormatExample: React.FC = () => {
  // Esta es la fecha actual que cambiará entre servidor y cliente, causando errores de hidratación
  const now = new Date();
  
  // El formato puede variar según el locale del navegador
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'full',
    timeStyle: 'long'
  }).format(now);
  
  // Formato alternativo que también cambia según el locale
  const relativeTimeFormat = new Intl.RelativeTimeFormat('es-ES', { 
    numeric: 'auto',
    style: 'long'
  });
  
  // Calcular días desde inicio de mes
  const today = now.getDate();
  const daysFromMonthStart = today - 1;
  const relativeDate = relativeTimeFormat.format(-daysFromMonthStart, 'day');
  
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Ejemplo de Fechas Seguras</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fecha actual (con formato):</p>
          
          {/* SafeDynamicContent para fecha formateada */}
          <SafeDynamicContent size="lg">
            <span className="text-lg font-medium">{formattedDate}</span>
          </SafeDynamicContent>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fecha relativa:</p>
          
          {/* SafeDynamicContent para fecha relativa */}
          <SafeDynamicContent size="md">
            <span>El mes comenzó {relativeDate}</span>
          </SafeDynamicContent>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Estos ejemplos muestran cómo resolver problemas de hidratación con fechas 
            formateadas según el locale del navegador, que difieren entre el servidor y el cliente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SafeDateFormatExample;
