/**
 * frontend/src/components/verticals/salon/features/AppointmentCard.tsx
 * Componente de tarjeta para mostrar información de una cita.
 * Parte del módulo de citas para la vertical de Salón de Belleza.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState } from 'react';
import { salonVerticalInfo } from '../index';

/**
 * Tipos de estado para las citas
 */
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';

/**
 * Interfaz para las propiedades del componente AppointmentCard
 */
interface AppointmentCardProps {
  /** ID único de la cita */
  id: string;
  /** Nombre del cliente */
  clientName: string;
  /** Nombre del servicio contratado */
  serviceName: string;
  /** Fecha y hora de inicio de la cita */
  startTime: Date;
  /** Fecha y hora de fin de la cita */
  endTime: Date;
  /** Estado actual de la cita */
  status: AppointmentStatus;
  /** Función llamada al hacer clic en ver detalles */
  onDetailsClick?: () => void;
  /** Función llamada al cancelar la cita */
  onCancelClick?: (id: string) => Promise<void>;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente que muestra una tarjeta con información de una cita
 */
export default function AppointmentCard({
  id,
  clientName,
  serviceName,
  startTime,
  endTime,
  status,
  onDetailsClick,
  onCancelClick,
  className = '',
}: AppointmentCardProps) {
  // Estado para controlar el proceso de carga durante la cancelación
  const [isLoading, setIsLoading] = useState(false);
  
  // Formatear fechas para mostrar
  const formattedDate = formatDate(startTime);
  const formattedStartTime = formatTime(startTime);
  const formattedEndTime = formatTime(endTime);

  // Mapeo de estados a estilos visuales
  const statusStyles = {
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400',
    'no-show': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-400',
  };
  
  // Mapeo de estados a texto localizado
  const statusText = {
    scheduled: 'Programada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    'no-show': 'No asistió',
  };
  
  /**
   * Manejador para el botón de cancelar
   */
  const handleCancel = async () => {
    if (!onCancelClick || status !== 'scheduled') return;
    
    try {
      setIsLoading(true);
      await onCancelClick(id);
    } catch (error) {
      console.error('Error al cancelar la cita:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      <div className="p-4">
        {/* Encabezado con nombre del cliente y estado */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{clientName}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
            {statusText[status]}
          </span>
        </div>
        
        {/* Nombre del servicio */}
        <p className="text-gray-700 dark:text-gray-300 mb-3">{serviceName}</p>
        
        {/* Información de fecha y hora */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center mb-1">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formattedDate}
          </div>
          
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formattedStartTime} - {formattedEndTime}
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex space-x-2">
          {/* Botón de detalles */}
          {onDetailsClick && (
            <button
              onClick={onDetailsClick}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Ver detalles
            </button>
          )}
          
          {/* Botón de cancelar (solo visible si la cita está programada) */}
          {onCancelClick && status === 'scheduled' && (
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700 dark:text-red-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cancelando...
                </span>
              ) : 'Cancelar cita'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Formatea una fecha para mostrar en formato local
 * @param date - Fecha a formatear
 * @returns Fecha formateada como string
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Formatea una hora para mostrar en formato local
 * @param date - Fecha con hora a formatear
 * @returns Hora formateada como string
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}