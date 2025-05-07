/**
 * frontend/src/components/verticals/medicina/features/AppointmentScheduler.tsx
 * Componente para programar y gestionar citas médicas.
 * Permite seleccionar pacientes, horarios y tipos de consulta.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { PatientStatus } from './PatientCard';

/**
 * Tipos de cita médica
 */
export type AppointmentType = 
  'initial' | 
  'followup' | 
  'routine' | 
  'urgent' | 
  'procedure' | 
  'lab_results' | 
  'vaccination' | 
  'telehealth';

/**
 * Estados posibles para una cita
 */
export type AppointmentStatus = 
  'scheduled' | 
  'confirmed' | 
  'completed' | 
  'cancelled' | 
  'missed' | 
  'rescheduled';

/**
 * Interfaz para datos de un paciente simplificado
 */
interface Patient {
  id: string;
  recordNumber: string;
  name: string;
  age: number;
  phone: string;
  email?: string;
  status: PatientStatus;
}

/**
 * Interfaz para datos de una cita
 */
interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: Date;
  duration: number; // en minutos
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  reminderSent: boolean;
}

/**
 * Interfaz para datos del médico/especialista
 */
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  color: string;
}

/**
 * Interfaz para horarios disponibles
 */
interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
  appointmentId?: string;
}

/**
 * Props para el componente AppointmentScheduler
 */
interface AppointmentSchedulerProps {
  /** Lista de pacientes disponibles */
  patients?: Patient[];
  /** Lista de citas existentes */
  appointments?: Appointment[];
  /** Función para cargar pacientes */
  loadPatients?: () => Promise<Patient[]>;
  /** Función para cargar citas */
  loadAppointments?: (date: Date) => Promise<Appointment[]>;
  /** Función para crear una nueva cita */
  createAppointment?: (appointment: Omit<Appointment, 'id'>) => Promise<Appointment>;
  /** Función para actualizar una cita existente */
  updateAppointment?: (id: string, updates: Partial<Appointment>) => Promise<Appointment>;
  /** Función para cancelar una cita */
  cancelAppointment?: (id: string) => Promise<void>;
  /** Lista de médicos/especialistas */
  doctors?: Doctor[];
  /** ID del médico seleccionado por defecto */
  defaultDoctorId?: string;
  /** Duración predeterminada de las citas en minutos */
  defaultDuration?: number;
  /** Fecha seleccionada inicialmente */
  initialDate?: Date;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente principal para programar y gestionar citas médicas
 */
export default function AppointmentScheduler({
  patients: initialPatients,
  appointments: initialAppointments,
  loadPatients,
  loadAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  doctors = [
    { id: '1', name: 'Dr. García', specialty: 'Medicina General', color: '#4299E1' }
  ],
  defaultDoctorId = '1',
  defaultDuration = 30,
  initialDate = new Date(),
  className = '',
}: AppointmentSchedulerProps) {
  // Estado para fecha seleccionada
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(initialDate));
  
  // Estado para médico seleccionado
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(defaultDoctorId);
  
  // Estado para citas
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments || []);
  
  // Estado para pacientes
  const [patients, setPatients] = useState<Patient[]>(initialPatients || []);
  
  // Estado para cita que se está editando/creando
  const [editingAppointment, setEditingAppointment] = useState<Partial<Appointment> | null>(null);
  
  // Estado para controlar si el modal de cita está abierto
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState<boolean>(false);
  
  // Estado para controlar carga de datos
  const [loading, setLoading] = useState<boolean>(
    (!initialPatients && loadPatients) || (!initialAppointments && loadAppointments)
  );
  
  // Estado para mensaje de error
  const [error, setError] = useState<string | null>(null);
  
  // Estado para términos de búsqueda de pacientes
  const [patientSearchTerm, setPatientSearchTerm] = useState<string>('');
  
  // Estado para paciente seleccionado en el formulario
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  
  // Estado para hora de inicio seleccionada
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  
  // Estado para duración de la cita
  const [appointmentDuration, setAppointmentDuration] = useState<number>(defaultDuration);
  
  // Estado para tipo de cita
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('initial');
  
  // Estado para notas de la cita
  const [appointmentNotes, setAppointmentNotes] = useState<string>('');
  
  // Estado para time slots disponibles
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Calcular slots de tiempo disponibles
  useEffect(() => {
    // Configuración de horario de trabajo
    const workStartHour = 8; // 8 AM
    const workEndHour = 18; // 6 PM
    const slotDuration = 30; // 30 minutos por slot
    
    // Crear fecha base con la fecha seleccionada
    const baseDate = new Date(selectedDate);
    baseDate.setHours(0, 0, 0, 0);
    
    // Generar slots de tiempo
    const slots: TimeSlot[] = [];
    
    // Desde hora de inicio hasta hora de fin
    for (let hour = workStartHour; hour < workEndHour; hour++) {
      // Slots por hora (60 / slotDuration)
      for (let minute = 0; minute < 60; minute += slotDuration) {
        // Crear fechas de inicio y fin del slot
        const startTime = new Date(baseDate);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + slotDuration);
        
        // Verificar si el slot está disponible (no coincide con citas existentes)
        let available = true;
        let appointmentId: string | undefined = undefined;
        
        for (const appointment of appointments) {
          // Solo considerar citas confirmadas o programadas
          if (
            appointment.status !== 'cancelled' && 
            appointment.status !== 'missed'
          ) {
            const appointmentStart = new Date(appointment.date);
            const appointmentEnd = new Date(appointmentStart);
            appointmentEnd.setMinutes(appointmentEnd.getMinutes() + appointment.duration);
            
            // Verificar si hay solapamiento
            if (
              (startTime >= appointmentStart && startTime < appointmentEnd) ||
              (endTime > appointmentStart && endTime <= appointmentEnd) ||
              (startTime <= appointmentStart && endTime >= appointmentEnd)
            ) {
              available = false;
              appointmentId = appointment.id;
              break;
            }
          }
        }
        
        // Agregar slot al array
        slots.push({
          startTime,
          endTime,
          available,
          appointmentId
        });
      }
    }
    
    setTimeSlots(slots);
  }, [selectedDate, appointments]);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Cargar pacientes si no se proporcionaron
        if (!initialPatients && loadPatients) {
          const patientData = await loadPatients();
          setPatients(patientData);
        }
        
        // Cargar citas para la fecha seleccionada
        if (loadAppointments) {
          const appointmentData = await loadAppointments(selectedDate);
          setAppointments(appointmentData);
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('No se pudieron cargar los datos. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [initialPatients, initialAppointments, loadPatients, loadAppointments, selectedDate]);

  // Filtrar pacientes por término de búsqueda
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    patient.recordNumber.toLowerCase().includes(patientSearchTerm.toLowerCase())
  );

  // Obtener el médico seleccionado
  const selectedDoctor = doctors.find(doctor => doctor.id === selectedDoctorId);

  // Manejar selección de slot de tiempo
  const handleSelectTimeSlot = (slot: TimeSlot) => {
    // Si el slot tiene una cita, abrir para editar
    if (!slot.available && slot.appointmentId) {
      const appointment = appointments.find(a => a.id === slot.appointmentId);
      
      if (appointment) {
        setEditingAppointment(appointment);
        setSelectedPatientId(appointment.patientId);
        setSelectedTime(new Date(appointment.date));
        setAppointmentDuration(appointment.duration);
        setAppointmentType(appointment.appointmentType);
        setAppointmentNotes(appointment.notes || '');
        setIsAppointmentModalOpen(true);
        return;
      }
    }
    
    // Si el slot está disponible, abrir para crear nueva cita
    if (slot.available) {
      setEditingAppointment(null);
      setSelectedPatientId('');
      setSelectedTime(new Date(slot.startTime));
      setAppointmentDuration(defaultDuration);
      setAppointmentType('initial');
      setAppointmentNotes('');
      setIsAppointmentModalOpen(true);
    }
  };

  // Manejar cambio de fecha
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Manejar cambio de médico
  const handleDoctorChange = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
  };

  // Obtener color para una cita según su tipo
  const getAppointmentTypeColor = (type: AppointmentType): string => {
    switch (type) {
      case 'initial': return '#4299E1'; // Blue
      case 'followup': return '#48BB78'; // Green
      case 'routine': return '#805AD5'; // Purple
      case 'urgent': return '#F56565'; // Red
      case 'procedure': return '#ED8936'; // Orange
      case 'lab_results': return '#38B2AC'; // Teal
      case 'vaccination': return '#667EEA'; // Indigo
      case 'telehealth': return '#D53F8C'; // Pink
      default: return '#718096'; // Gray
    }
  };

  // Obtener texto para un tipo de cita
  const getAppointmentTypeText = (type: AppointmentType): string => {
    switch (type) {
      case 'initial': return 'Primera Consulta';
      case 'followup': return 'Seguimiento';
      case 'routine': return 'Rutina';
      case 'urgent': return 'Urgente';
      case 'procedure': return 'Procedimiento';
      case 'lab_results': return 'Resultados Lab';
      case 'vaccination': return 'Vacunación';
      case 'telehealth': return 'Teleconsulta';
      default: return type;
    }
  };

  // Guardar una cita (nueva o edición)
  const handleSaveAppointment = async () => {
    if (!selectedTime || !selectedPatientId) {
      setError('Por favor seleccione paciente y horario');
      return;
    }
    
    try {
      const patient = patients.find(p => p.id === selectedPatientId);
      
      if (!patient) {
        setError('Paciente no encontrado');
        return;
      }
      
      if (editingAppointment?.id) {
        // Actualizar cita existente
        if (updateAppointment) {
          await updateAppointment(editingAppointment.id, {
            patientId: selectedPatientId,
            patientName: patient.name,
            date: selectedTime,
            duration: appointmentDuration,
            appointmentType,
            notes: appointmentNotes,
          });
          
          // Recargar citas
          if (loadAppointments) {
            const updatedAppointments = await loadAppointments(selectedDate);
            setAppointments(updatedAppointments);
          }
        } else {
          // Actualización local si no hay función de API
          setAppointments(prevAppointments => 
            prevAppointments.map(appointment => 
              appointment.id === editingAppointment.id
                ? {
                    ...appointment,
                    patientId: selectedPatientId,
                    patientName: patient.name,
                    date: selectedTime,
                    duration: appointmentDuration,
                    appointmentType,
                    notes: appointmentNotes,
                  }
                : appointment
            )
          );
        }
      } else {
        // Crear nueva cita
        if (createAppointment) {
          await createAppointment({
            patientId: selectedPatientId,
            patientName: patient.name,
            date: selectedTime,
            duration: appointmentDuration,
            appointmentType,
            status: 'scheduled',
            notes: appointmentNotes,
            reminderSent: false,
          });
          
          // Recargar citas
          if (loadAppointments) {
            const updatedAppointments = await loadAppointments(selectedDate);
            setAppointments(updatedAppointments);
          }
        } else {
          // Creación local si no hay función de API
          const newAppointment: Appointment = {
            id: `temp-${Date.now()}`,
            patientId: selectedPatientId,
            patientName: patient.name,
            date: selectedTime,
            duration: appointmentDuration,
            appointmentType,
            status: 'scheduled',
            notes: appointmentNotes,
            reminderSent: false,
          };
          
          setAppointments(prevAppointments => [...prevAppointments, newAppointment]);
        }
      }
      
      // Cerrar modal
      setIsAppointmentModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error al guardar la cita:', err);
      setError('No se pudo guardar la cita. Por favor, intente nuevamente.');
    }
  };

  // Cancelar una cita
  const handleCancelAppointment = async () => {
    if (!editingAppointment?.id) return;
    
    try {
      if (cancelAppointment) {
        await cancelAppointment(editingAppointment.id);
        
        // Recargar citas
        if (loadAppointments) {
          const updatedAppointments = await loadAppointments(selectedDate);
          setAppointments(updatedAppointments);
        }
      } else {
        // Cancelación local si no hay función de API
        setAppointments(prevAppointments => 
          prevAppointments.map(appointment => 
            appointment.id === editingAppointment.id
              ? { ...appointment, status: 'cancelled' }
              : appointment
          )
        );
      }
      
      // Cerrar modal
      setIsAppointmentModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error al cancelar la cita:', err);
      setError('No se pudo cancelar la cita. Por favor, intente nuevamente.');
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm ${className}`}>
      {/* Encabezado */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Programador de Citas
        </h2>
      </div>
      
      {/* Controles principales */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-200 dark:border-gray-700">
        {/* Selector de fecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha
          </label>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => handleDateChange(new Date(e.target.value))}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        
        {/* Selector de médico */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Médico
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => handleDoctorChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} - {doctor.specialty}
              </option>
            ))}
          </select>
        </div>
        
        {/* Leyenda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Leyenda
          </label>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Disponible</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Ocupado</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Urgente</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mensajes de error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {/* Calendario/Grid de Citas */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {timeSlots.map((slot, index) => {
              // Encontrar la cita asociada al slot si existe
              const appointment = slot.appointmentId 
                ? appointments.find(a => a.id === slot.appointmentId)
                : null;
              
              // Determinar color basado en disponibilidad o tipo de cita
              let backgroundColor = slot.available 
                ? 'bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/30'
                : appointment
                  ? `bg-opacity-20 dark:bg-opacity-20 hover:bg-opacity-30 dark:hover:bg-opacity-30 ${
                      appointment.appointmentType === 'urgent'
                        ? 'bg-red-500 dark:bg-red-500'
                        : 'bg-blue-500 dark:bg-blue-500'
                    }`
                  : 'bg-gray-200 dark:bg-gray-700';
              
              return (
                <div
                  key={index}
                  onClick={() => handleSelectTimeSlot(slot)}
                  className={`p-2 rounded-md cursor-pointer ${backgroundColor} transition-colors border border-transparent ${
                    !slot.available && 'border-blue-300 dark:border-blue-700'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {slot.startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  {appointment && (
                    <div className="mt-1">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {appointment.patientName}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {getAppointmentTypeText(appointment.appointmentType)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Modal para crear/editar cita */}
      {isAppointmentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
                </h3>
                
                <div className="space-y-4">
                  {/* Selector de paciente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Paciente
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar paciente..."
                        value={patientSearchTerm}
                        onChange={(e) => setPatientSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      
                      {patientSearchTerm && (
                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-300 dark:border-gray-600 max-h-60 overflow-y-auto">
                          {filteredPatients.length > 0 ? (
                            filteredPatients.map((patient) => (
                              <div
                                key={patient.id}
                                onClick={() => {
                                  setSelectedPatientId(patient.id);
                                  setPatientSearchTerm(patient.name);
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                              >
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {patient.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Exp: {patient.recordNumber} • {patient.age} años
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-2 text-gray-500 dark:text-gray-400">
                              No se encontraron pacientes
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Fecha y hora */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={selectedTime ? selectedTime.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          if (selectedTime) {
                            const newDate = new Date(e.target.value);
                            newDate.setHours(
                              selectedTime.getHours(),
                              selectedTime.getMinutes(),
                              0,
                              0
                            );
                            setSelectedTime(newDate);
                          } else {
                            setSelectedTime(new Date(e.target.value));
                          }
                        }}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hora
                      </label>
                      <input
                        type="time"
                        value={selectedTime ? 
                          `${String(selectedTime.getHours()).padStart(2, '0')}:${String(selectedTime.getMinutes()).padStart(2, '0')}` : 
                          ''
                        }
                        onChange={(e) => {
                          if (selectedTime) {
                            const [hours, minutes] = e.target.value.split(':').map(Number);
                            const newTime = new Date(selectedTime);
                            newTime.setHours(hours, minutes, 0, 0);
                            setSelectedTime(newTime);
                          }
                        }}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Duración y tipo */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duración (min)
                      </label>
                      <select
                        value={appointmentDuration}
                        onChange={(e) => setAppointmentDuration(Number(e.target.value))}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value={15}>15 minutos</option>
                        <option value={30}>30 minutos</option>
                        <option value={45}>45 minutos</option>
                        <option value={60}>1 hora</option>
                        <option value={90}>1 hora 30 minutos</option>
                        <option value={120}>2 horas</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo de Cita
                      </label>
                      <select
                        value={appointmentType}
                        onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="initial">Primera Consulta</option>
                        <option value="followup">Seguimiento</option>
                        <option value="routine">Rutina</option>
                        <option value="urgent">Urgente</option>
                        <option value="procedure">Procedimiento</option>
                        <option value="lab_results">Resultados Laboratorio</option>
                        <option value="vaccination">Vacunación</option>
                        <option value="telehealth">Teleconsulta</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notas
                    </label>
                    <textarea
                      value={appointmentNotes}
                      onChange={(e) => setAppointmentNotes(e.target.value)}
                      rows={3}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    ></textarea>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSaveAppointment}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {editingAppointment ? 'Actualizar' : 'Guardar'}
                </button>
                
                {editingAppointment && (
                  <button
                    type="button"
                    onClick={handleCancelAppointment}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar Cita
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => setIsAppointmentModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}