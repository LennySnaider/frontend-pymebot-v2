/**
 * frontend/src/components/verticals/medicina/features/PatientCard.tsx
 * Componente de tarjeta para mostrar información de un paciente.
 * Parte del módulo de gestión de pacientes para la vertical de Medicina.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState } from 'react';

/**
 * Tipos de género para pacientes
 */
export type PatientGender = 'male' | 'female' | 'other';

/**
 * Tipos de estado para pacientes
 */
export type PatientStatus = 'active' | 'inactive' | 'pending';

/**
 * Interfaz para las propiedades del componente PatientCard
 */
interface PatientCardProps {
  /** ID único del paciente */
  id: string;
  /** Número de expediente */
  recordNumber: string;
  /** Nombre completo del paciente */
  name: string;
  /** Edad del paciente */
  age: number;
  /** Género del paciente */
  gender: PatientGender;
  /** Teléfono de contacto */
  phone: string;
  /** Correo electrónico */
  email?: string;
  /** Condiciones médicas principales */
  conditions?: string[];
  /** Última visita */
  lastVisit?: Date;
  /** Próxima cita */
  nextAppointment?: Date;
  /** Estado del paciente */
  status: PatientStatus;
  /** URL de la foto del paciente */
  photoUrl?: string;
  /** Función llamada al hacer clic en ver expediente */
  onViewRecord?: () => void;
  /** Función llamada al agregar una cita */
  onScheduleAppointment?: () => void;
  /** Función llamada al editar el paciente */
  onEditPatient?: () => void;
  /** Clases CSS adicionales */
  className?: string;
  /** Determina si se muestra en modo compacto (tabla) */
  compact?: boolean;
}

/**
 * Componente que muestra una tarjeta con información de un paciente
 */
export default function PatientCard({
  id,
  recordNumber,
  name,
  age,
  gender,
  phone,
  email,
  conditions = [],
  lastVisit,
  nextAppointment,
  status,
  photoUrl = '/api/placeholder/100/100',
  onViewRecord,
  onScheduleAppointment,
  onEditPatient,
  className = '',
  compact = false,
}: PatientCardProps) {
  // Estado para controlar menú desplegable de acciones
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  
  // Formatear fechas para mostrar
  const formattedLastVisit = lastVisit ? formatDate(lastVisit) : 'Sin visitas previas';
  const formattedNextAppointment = nextAppointment ? formatDate(nextAppointment) : 'Sin citas programadas';
  
  // Mapeo de género a texto localizado
  const genderText = {
    male: 'Masculino',
    female: 'Femenino',
    other: 'Otro',
  };
  
  // Mapeo de estados a estilos visuales
  const statusStyles = {
    active: {
      bgColor: 'bg-green-100 dark:bg-green-800/30',
      textColor: 'text-green-800 dark:text-green-400',
      text: 'Activo'
    },
    inactive: {
      bgColor: 'bg-gray-100 dark:bg-gray-800/30',
      textColor: 'text-gray-800 dark:text-gray-400',
      text: 'Inactivo'
    },
    pending: {
      bgColor: 'bg-amber-100 dark:bg-amber-800/30',
      textColor: 'text-amber-800 dark:text-amber-400',
      text: 'Pendiente'
    }
  };
  
  // Si está en modo compacto (tabla), renderizar versión reducida
  if (compact) {
    return (
      <tr className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${className}`}>
        <td className="py-3 px-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 mr-3">
              <img
                src={photoUrl}
                alt={name}
                className="h-10 w-10 rounded-full object-cover"
              />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Exp: {recordNumber}</p>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-sm">
          <p className="text-gray-700 dark:text-gray-300">{age} años</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{genderText[gender]}</p>
        </td>
        <td className="py-3 px-4 text-sm">
          <p className="text-gray-700 dark:text-gray-300">{phone}</p>
          {email && <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>}
        </td>
        <td className="py-3 px-4 text-sm">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status].bgColor} ${statusStyles[status].textColor}`}>
            {statusStyles[status].text}
          </span>
        </td>
        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
          {lastVisit ? formattedLastVisit : 'Sin visitas'}
        </td>
        <td className="py-3 px-4 text-right">
          <div className="relative inline-block text-left">
            <button
              onClick={() => setActionMenuOpen(!actionMenuOpen)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {actionMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  {onViewRecord && (
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        onViewRecord();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Ver expediente
                    </button>
                  )}
                  {onScheduleAppointment && (
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        onScheduleAppointment();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Agendar cita
                    </button>
                  )}
                  {onEditPatient && (
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        onEditPatient();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Editar paciente
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  }
  
  // Versión completa para vista de tarjeta
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      <div className="p-4">
        {/* Encabezado con información básica */}
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-4">
            <img
              src={photoUrl}
              alt={name}
              className="h-20 w-20 rounded-full object-cover"
            />
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Expediente: {recordNumber}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status].bgColor} ${statusStyles[status].textColor}`}>
                {statusStyles[status].text}
              </span>
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Edad: </span>
                <span className="text-gray-900 dark:text-white">{age} años</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Género: </span>
                <span className="text-gray-900 dark:text-white">{genderText[gender]}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Teléfono: </span>
                <span className="text-gray-900 dark:text-white">{phone}</span>
              </div>
              {email && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Email: </span>
                  <span className="text-gray-900 dark:text-white">{email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Condiciones médicas */}
        {conditions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condiciones médicas:</h4>
            <div className="flex flex-wrap gap-2">
              {conditions.map((condition, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs font-medium"
                >
                  {condition}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Fechas de visitas */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Última visita:</h4>
            <p className="text-gray-900 dark:text-white">{formattedLastVisit}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Próxima cita:</h4>
            <p className="text-gray-900 dark:text-white">{formattedNextAppointment}</p>
          </div>
        </div>
        
        {/* Acciones */}
        <div className="mt-5 flex flex-wrap gap-2">
          {onViewRecord && (
            <button
              onClick={onViewRecord}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ver expediente
            </button>
          )}
          {onScheduleAppointment && (
            <button
              onClick={onScheduleAppointment}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Agendar cita
            </button>
          )}
          {onEditPatient && (
            <button
              onClick={onEditPatient}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Editar
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