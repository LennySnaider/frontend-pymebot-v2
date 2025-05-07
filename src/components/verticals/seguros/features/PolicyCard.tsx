/**
 * frontend/src/components/verticals/seguros/features/PolicyCard.tsx
 * Componente de tarjeta para mostrar información de una póliza de seguro.
 * Parte del módulo de gestión de pólizas para la vertical de Seguros.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState } from 'react';

/**
 * Tipos de estado para las pólizas
 */
export type PolicyStatus = 'active' | 'pending' | 'expired' | 'cancelled' | 'renewal';

/**
 * Tipos de seguro soportados
 */
export type InsuranceType = 'auto' | 'home' | 'health' | 'life' | 'business' | 'travel' | 'other';

/**
 * Interfaz para las propiedades del componente PolicyCard
 */
interface PolicyCardProps {
  /** ID único de la póliza */
  id: string;
  /** Número de póliza */
  policyNumber: string;
  /** Nombre del cliente */
  clientName: string;
  /** Tipo de seguro */
  insuranceType: InsuranceType;
  /** Nombre de la aseguradora */
  insurerName: string;
  /** Fecha de inicio de la póliza */
  startDate: Date;
  /** Fecha de fin de la póliza */
  endDate: Date;
  /** Prima anual */
  premium: number;
  /** Estado actual de la póliza */
  status: PolicyStatus;
  /** Función llamada al hacer clic en ver detalles */
  onDetailsClick?: () => void;
  /** Función llamada al renovar la póliza */
  onRenewalClick?: (id: string) => Promise<void>;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente que muestra una tarjeta con información de una póliza de seguro
 */
export default function PolicyCard({
  id,
  policyNumber,
  clientName,
  insuranceType,
  insurerName,
  startDate,
  endDate,
  premium,
  status,
  onDetailsClick,
  onRenewalClick,
  className = '',
}: PolicyCardProps) {
  // Estado para controlar el proceso de carga durante la renovación
  const [isLoading, setIsLoading] = useState(false);
  
  // Formatear fechas para mostrar
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  
  // Formatear prima como moneda
  const formattedPremium = formatCurrency(premium);
  
  // Calcular días restantes hasta vencimiento
  const daysRemaining = getDaysRemaining(endDate);
  
  // Verificar si la póliza está próxima a vencer (menos de 30 días)
  const isNearExpiry = daysRemaining > 0 && daysRemaining <= 30;

  // Mapeo de tipos de seguro a textos y estilos
  const insuranceTypeData: Record<InsuranceType, { text: string, icon: string, color: string }> = {
    auto: { 
      text: 'Automóvil', 
      icon: '🚗', 
      color: '#3949AB' 
    },
    home: { 
      text: 'Hogar', 
      icon: '🏠', 
      color: '#388E3C' 
    },
    health: { 
      text: 'Salud', 
      icon: '⚕️', 
      color: '#D32F2F' 
    },
    life: { 
      text: 'Vida', 
      icon: '❤️', 
      color: '#C2185B' 
    },
    business: { 
      text: 'Negocio', 
      icon: '🏢', 
      color: '#0288D1' 
    },
    travel: { 
      text: 'Viaje', 
      icon: '✈️', 
      color: '#7B1FA2' 
    },
    other: { 
      text: 'Otro', 
      icon: '📄', 
      color: '#757575' 
    }
  };
  
  // Mapeo de estados a estilos visuales
  const statusStyles: Record<PolicyStatus, { bgColor: string, textColor: string, text: string }> = {
    active: {
      bgColor: 'bg-green-100 dark:bg-green-800/30',
      textColor: 'text-green-800 dark:text-green-400',
      text: 'Activa'
    },
    pending: {
      bgColor: 'bg-blue-100 dark:bg-blue-800/30',
      textColor: 'text-blue-800 dark:text-blue-400',
      text: 'Pendiente'
    },
    expired: {
      bgColor: 'bg-red-100 dark:bg-red-800/30',
      textColor: 'text-red-800 dark:text-red-400',
      text: 'Vencida'
    },
    cancelled: {
      bgColor: 'bg-gray-100 dark:bg-gray-800/30',
      textColor: 'text-gray-800 dark:text-gray-400',
      text: 'Cancelada'
    },
    renewal: {
      bgColor: 'bg-amber-100 dark:bg-amber-800/30',
      textColor: 'text-amber-800 dark:text-amber-400',
      text: 'Renovación'
    }
  };
  
  /**
   * Manejador para el botón de renovación
   */
  const handleRenewal = async () => {
    if (!onRenewalClick || status !== 'active') return;
    
    try {
      setIsLoading(true);
      await onRenewalClick(id);
    } catch (error) {
      console.error('Error al renovar la póliza:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      <div className="p-4">
        {/* Encabezado con número de póliza y estado */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <span className="flex items-center justify-center w-8 h-8 rounded-full mr-2 text-white" 
              style={{ backgroundColor: insuranceTypeData[insuranceType].color }}>
              {insuranceTypeData[insuranceType].icon}
            </span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {insuranceTypeData[insuranceType].text}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Póliza: {policyNumber}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status].bgColor} ${statusStyles[status].textColor}`}>
            {statusStyles[status].text}
          </span>
        </div>
        
        {/* Cliente y aseguradora */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cliente</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white">{clientName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Aseguradora</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white">{insurerName}</p>
          </div>
        </div>
        
        {/* Vigencia y prima */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Vigencia</p>
            <p className="text-sm text-gray-800 dark:text-white">
              {formattedStartDate} - {formattedEndDate}
            </p>
            {isNearExpiry && status === 'active' && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1">
                Vence en {daysRemaining} días
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Prima anual</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white">{formattedPremium}</p>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="mt-4 flex space-x-2">
          {/* Botón de detalles */}
          {onDetailsClick && (
            <button
              onClick={onDetailsClick}
              className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Ver detalles
            </button>
          )}
          
          {/* Botón de renovación (solo visible si la póliza está activa) */}
          {onRenewalClick && status === 'active' && (
            <button
              onClick={handleRenewal}
              disabled={isLoading}
              className="flex-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700 dark:text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Renovando...
                </span>
              ) : 'Renovar póliza'}
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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formatea un valor monetario
 * @param value - Valor a formatear
 * @returns Valor formateado como moneda
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

/**
 * Calcula los días restantes hasta una fecha
 * @param date - Fecha objetivo
 * @returns Número de días restantes (negativo si ya pasó)
 */
function getDaysRemaining(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}