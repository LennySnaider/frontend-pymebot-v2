/**
 * frontend/src/components/verticals/salon/features/Calendar.tsx
 * Componente de calendario para visualización y gestión de citas.
 * Parte del módulo de citas para la vertical de Salón de Belleza.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState, useEffect } from 'react';
import { AppointmentStatus } from './AppointmentCard';

/**
 * Interfaz para datos de una cita en el calendario
 */
interface CalendarAppointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  notes?: string;
}

/**
 * Interfaz para las propiedades del componente Calendar
 */
interface CalendarProps {
  /** Fecha seleccionada inicialmente */
  initialDate?: Date;
  /** Función llamada al seleccionar una fecha */
  onDateSelect?: (date: Date) => void;
  /** Función llamada al seleccionar una cita */
  onAppointmentSelect?: (appointment: CalendarAppointment) => void;
  /** Datos de citas precargados */
  appointments?: CalendarAppointment[];
  /** Función para cargar citas de una fecha específica */
  loadAppointments?: (date: Date) => Promise<CalendarAppointment[]>;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente de calendario para gestión de citas
 */
export default function Calendar({
  initialDate = new Date(),
  onDateSelect,
  onAppointmentSelect,
  appointments: initialAppointments,
  loadAppointments,
  className = '',
}: CalendarProps) {
  // Estado para la fecha seleccionada
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  // Estado para el mes actual visualizado
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  // Estado para las citas del día seleccionado
  const [appointments, setAppointments] = useState<CalendarAppointment[]>(initialAppointments || []);
  // Estado para controlar la carga de datos
  const [loading, setLoading] = useState<boolean>(!initialAppointments);
  // Estado para mensaje de error
  const [error, setError] = useState<string | null>(null);

  // Efecto para cargar citas cuando cambia la fecha seleccionada
  useEffect(() => {
    // Si no hay función para cargar citas, no hacer nada
    if (!loadAppointments) return;
    
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fetchedAppointments = await loadAppointments(selectedDate);
        setAppointments(fetchedAppointments);
      } catch (err) {
        console.error('Error cargando citas:', err);
        setError('No se pudieron cargar las citas. Por favor, intente nuevamente.');
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [selectedDate, loadAppointments]);

  /**
   * Genera un array con los días del mes actual
   */
  const getDaysInMonth = (): Date[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Último día del mes actual
    
    // Generar array con cada día del mes
    return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
  };

  /**
   * Genera encabezados para los días de la semana
   */
  const weekdayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  
  /**
   * Avanza al mes siguiente
   */
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  /**
   * Retrocede al mes anterior
   */
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  /**
   * Verifica si una fecha es hoy
   */
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  /**
   * Verifica si una fecha es la seleccionada
   */
  const isSelected = (date: Date): boolean => {
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };
  
  /**
   * Verifica si una fecha tiene citas
   * (simulación - en producción se verificaría con datos reales)
   */
  const hasAppointments = (date: Date): boolean => {
    // Simulación - en días pares hay citas
    return date.getDate() % 2 === 0;
  };
  
  /**
   * Maneja la selección de una fecha
   */
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    
    if (onDateSelect) {
      onDateSelect(date);
    }
  };
  
  /**
   * Maneja la selección de una cita
   */
  const handleSelectAppointment = (appointment: CalendarAppointment) => {
    if (onAppointmentSelect) {
      onAppointmentSelect(appointment);
    }
  };

  // Obtener los días del mes actual
  const daysInMonth = getDaysInMonth();
  
  // Obtener el primer día del mes (0 = Domingo, 1 = Lunes, etc.)
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  // Ajustar para que la semana comience en lunes (0 = Lunes, 6 = Domingo)
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Encabezado del calendario */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              aria-label="Mes anterior"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              aria-label="Mes siguiente"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Grilla del calendario */}
      <div className="p-4">
        {/* Encabezados de días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdayHeaders.map((day, index) => (
            <div
              key={`header-${index}`}
              className="text-center text-sm text-gray-500 dark:text-gray-400 font-medium"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1">
          {/* Espacios vacíos para alinear con el día de la semana inicial */}
          {Array.from({ length: startingDay }).map((_, index) => (
            <div key={`empty-${index}`} className="h-12"></div>
          ))}
          
          {/* Días del mes */}
          {daysInMonth.map((date) => (
            <div
              key={`day-${date.getDate()}`}
              onClick={() => handleSelectDate(date)}
              className={`
                relative h-12 flex items-center justify-center rounded-md cursor-pointer text-sm 
                ${isSelected(date) 
                  ? 'bg-blue-500 text-white' 
                  : isToday(date)
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              <span>{date.getDate()}</span>
              
              {/* Indicador de citas para este día */}
              {hasAppointments(date) && !isSelected(date) && (
                <div className="absolute bottom-1 w-1 h-1 bg-green-500 rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Sección de citas del día */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
          Citas para {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        
        {/* Estado de carga */}
        {loading && (
          <div className="py-4 flex justify-center">
            <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Mensaje de error */}
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
            {error}
          </div>
        )}
        
        {/* Lista de citas */}
        {!loading && !error && appointments.length === 0 && (
          <div className="text-gray-500 dark:text-gray-400 text-center py-4">
            No hay citas programadas para este día
          </div>
        )}
        
        {!loading && !error && appointments.length > 0 && (
          <div className="space-y-2">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                onClick={() => handleSelectAppointment(appointment)}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {appointment.clientName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {appointment.serviceName}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(appointment.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}