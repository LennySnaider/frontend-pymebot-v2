/**
 * frontend/src/components/verticals/bienes_raices/features/AppointmentScheduler.tsx
 * Programador de citas para bienes raíces
 * @version 1.0.0
 * @updated 2025-06-05
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Form, FormItem } from '@/components/ui/Form';
import { Select } from '@/components/ui/Select';
import Dialog from '@/components/ui/Dialog';
import Avatar from '@/components/ui/Avatar';
import dayjs from 'dayjs';

// Definición de tipos
interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  type: string;
  image?: string;
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string;
    image?: string;
  };
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
}

interface Appointment {
  id: string;
  title: string;
  date: Date;
  duration: number; // en minutos
  type: 'visit' | 'virtual-tour' | 'meeting' | 'call';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  propertyId?: string;
  property?: Property;
  clientId: string;
  client: Client;
  agentId: string;
  agent: {
    id: string;
    name: string;
    image?: string;
  };
  createdAt: Date;
}

interface TimeSlot {
  startTime: string; // Formato "HH:MM"
  endTime: string; // Formato "HH:MM"
  available: boolean;
  appointment?: Appointment;
}

interface AppointmentSchedulerProps {
  properties?: Property[];
  clients?: Client[];
  agents?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    image?: string;
    specialties?: string[];
  }[];
  appointments?: Appointment[];
  onScheduleAppointment?: (appointmentData: {
    date: Date;
    propertyId?: string;
    clientId: string;
    agentId: string;
    type: string;
    duration: number;
    notes?: string;
  }) => Promise<void>;
  onCancelAppointment?: (appointmentId: string) => Promise<void>;
  onRescheduleAppointment?: (appointmentId: string, newDate: Date) => Promise<void>;
  workingHours?: {
    start: string; // Formato "HH:MM"
    end: string; // Formato "HH:MM"
    daysOff?: number[]; // 0 = Domingo, 6 = Sábado
  };
  className?: string;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  properties = [],
  clients = [],
  agents = [],
  appointments = [],
  onScheduleAppointment,
  onCancelAppointment,
  onRescheduleAppointment,
  workingHours = { start: '09:00', end: '18:00', daysOff: [0] },
  className = '',
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    clientId: '',
    propertyId: '',
    agentId: '',
    date: new Date(),
    time: '09:00',
    type: 'visit',
    duration: 30,
    notes: ''
  });
  
  // Generar horarios para el día seleccionado
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    
    // Verificar si es día de descanso
    const dayOfWeek = selectedDate.getDay();
    if (workingHours.daysOff?.includes(dayOfWeek)) {
      return [];
    }
    
    let currentTime = dayjs().set('hour', startHour).set('minute', startMinute).set('second', 0);
    const endTime = dayjs().set('hour', endHour).set('minute', endMinute).set('second', 0);
    
    // Intervalo de 30 minutos entre slots
    const slotInterval = 30;
    
    while (currentTime.isBefore(endTime)) {
      const startTimeStr = currentTime.format('HH:mm');
      const endTimeStr = currentTime.add(slotInterval, 'minute').format('HH:mm');
      
      const slotDate = dayjs(selectedDate)
        .set('hour', currentTime.hour())
        .set('minute', currentTime.minute())
        .toDate();
      
      // Buscar si hay cita en este horario
      const existingAppointment = appointments.find(app => {
        const appTime = dayjs(app.date);
        return dayjs(slotDate).isSame(appTime, 'date') && 
               appTime.hour() === currentTime.hour() && 
               appTime.minute() === currentTime.minute();
      });
      
      // Considerar disponibilidad
      const isAvailable = !existingAppointment && dayjs(slotDate).isAfter(dayjs());
      
      slots.push({
        startTime: startTimeStr,
        endTime: endTimeStr,
        available: isAvailable,
        appointment: existingAppointment
      });
      
      currentTime = currentTime.add(slotInterval, 'minute');
    }
    
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  // Agrupar slots por hora para mejor visualización
  const groupedTimeSlots: Record<string, TimeSlot[]> = {};
  
  timeSlots.forEach(slot => {
    const hour = slot.startTime.split(':')[0];
    if (!groupedTimeSlots[hour]) {
      groupedTimeSlots[hour] = [];
    }
    groupedTimeSlots[hour].push(slot);
  });
  
  // Manejar selección de slot para programar una cita
  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (slot.appointment) {
      // Ver detalles de la cita existente
      setSelectedAppointment(slot.appointment);
      setIsViewDialogOpen(true);
    } else if (slot.available) {
      // Programar nueva cita
      const [hours, minutes] = slot.startTime.split(':').map(Number);
      const dateTime = dayjs(selectedDate)
        .set('hour', hours)
        .set('minute', minutes)
        .toDate();
      
      setFormData({
        ...formData,
        date: dateTime,
        time: slot.startTime
      });
      
      setIsFormDialogOpen(true);
    }
  };
  
  // Manejar cambios en el formulario
  const handleFormChange = (name: string, value: any) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Manejar envío del formulario
  const handleFormSubmit = () => {
    if (onScheduleAppointment) {
      const [hours, minutes] = formData.time.split(':').map(Number);
      const appointmentDate = dayjs(formData.date)
        .set('hour', hours)
        .set('minute', minutes)
        .toDate();
      
      onScheduleAppointment({
        date: appointmentDate,
        propertyId: formData.propertyId || undefined,
        clientId: formData.clientId,
        agentId: formData.agentId,
        type: formData.type,
        duration: formData.duration,
        notes: formData.notes
      });
      
      setIsFormDialogOpen(false);
      
      // Reset del formulario
      setFormData({
        clientId: '',
        propertyId: '',
        agentId: '',
        date: new Date(),
        time: '09:00',
        type: 'visit',
        duration: 30,
        notes: ''
      });
    }
  };
  
  // Manejar cancelación de cita
  const handleCancelAppointment = () => {
    if (selectedAppointment && onCancelAppointment) {
      onCancelAppointment(selectedAppointment.id);
      setIsViewDialogOpen(false);
      setSelectedAppointment(null);
    }
  };
  
  // Obtener el tipo de cita traducido
  const getAppointmentTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      'visit': 'Visita presencial',
      'virtual-tour': 'Tour virtual',
      'meeting': 'Reunión',
      'call': 'Llamada'
    };
    
    return types[type] || type;
  };
  
  // Obtener cliente por ID
  const getClientById = (clientId: string): Client | undefined => {
    return clients.find(client => client.id === clientId);
  };
  
  // Obtener agente por ID
  const getAgentById = (agentId: string): any | undefined => {
    return agents.find(agent => agent.id === agentId);
  };
  
  // Obtener propiedad por ID
  const getPropertyById = (propertyId: string): Property | undefined => {
    return properties.find(property => property.id === propertyId);
  };
  
  return (
    <>
      <Card className={`overflow-hidden ${className}`}>
        <div className="flex flex-col md:flex-row border-b border-gray-200 dark:border-gray-700">
          <div className="md:w-80 p-4 border-r border-gray-200 dark:border-gray-700">
            <h4 className="font-bold text-lg mb-4">Programar Citas</h4>
            
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date as Date)}
              className="w-full mb-4"
              dateFormat="MMMM d, yyyy"
              placeholderText="Seleccionar fecha"
              isClearable={false}
            />
            
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {dayjs(selectedDate).format('dddd, D [de] MMMM [de] YYYY')}
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <Button 
                size="sm" 
                variant="solid"
                onClick={() => {
                  setFormData({
                    ...formData,
                    date: selectedDate
                  });
                  setIsFormDialogOpen(true);
                }}
              >
                Nueva Cita
              </Button>
              
              <Button 
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Hoy
              </Button>
            </div>
          </div>
          
          <div className="flex-grow p-4">
            <h4 className="font-bold text-lg mb-4">Horarios Disponibles</h4>
            
            {Object.keys(groupedTimeSlots).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(groupedTimeSlots).map(([hour, slots]) => (
                  <div key={hour} className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 font-medium border-b border-gray-200 dark:border-gray-700">
                      {hour}:00
                    </div>
                    <div className="p-2">
                      {slots.map((slot, index) => (
                        <div
                          key={`${slot.startTime}-${index}`}
                          onClick={() => handleTimeSlotSelect(slot)}
                          className={`
                            p-2 my-1 rounded-md cursor-pointer
                            ${slot.appointment 
                              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                              : slot.available 
                                ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-800' 
                                : 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                            }
                          `}
                        >
                          <div className="flex justify-between items-center">
                            <span>{slot.startTime} - {slot.endTime}</span>
                            {slot.appointment && (
                              <span className={`
                                text-xs px-2 py-0.5 rounded-full
                                ${slot.appointment.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 
                                 slot.appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 
                                 slot.appointment.status === 'completed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' : 
                                 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}
                              `}>
                                {slot.appointment.status === 'confirmed' ? 'Confirmada' : 
                                 slot.appointment.status === 'scheduled' ? 'Programada' : 
                                 slot.appointment.status === 'completed' ? 'Completada' : 'Cancelada'}
                              </span>
                            )}
                          </div>
                          
                          {slot.appointment && (
                            <div className="mt-1">
                              <div className="flex items-center gap-2">
                                {slot.appointment.client?.image && (
                                  <Avatar 
                                    src={slot.appointment.client.image} 
                                    alt={slot.appointment.client.name}
                                    size={20}
                                    shape="circle"
                                  />
                                )}
                                <div className="text-sm font-medium truncate">
                                  {slot.appointment.client?.name || 'Cliente'}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {getAppointmentTypeLabel(slot.appointment.type)}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  {workingHours.daysOff?.includes(selectedDate.getDay())
                    ? 'Día no laborable'
                    : 'No hay horarios disponibles para esta fecha'}
                </div>
                <Button 
                  size="sm"
                  onClick={() => {
                    // Encontrar el próximo día disponible
                    let nextDate = dayjs(selectedDate).add(1, 'day');
                    while (workingHours.daysOff?.includes(nextDate.day())) {
                      nextDate = nextDate.add(1, 'day');
                    }
                    setSelectedDate(nextDate.toDate());
                  }}
                >
                  Ver siguiente día disponible
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {/* Diálogo de formulario para nueva cita */}
      <Dialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onRequestClose={() => setIsFormDialogOpen(false)}
        width={600}
      >
        <h4 className="text-lg font-bold mb-4">Programar Nueva Cita</h4>
        
        <Form>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormItem
              label="Cliente"
            >
              <Select
                options={clients.map(client => ({
                  value: client.id,
                  label: client.name
                }))}
                onChange={(option) => handleFormChange('clientId', option?.value)}
                value={clients
                  .filter(client => client.id === formData.clientId)
                  .map(client => ({
                    value: client.id,
                    label: client.name
                  }))[0]}
              />
            </FormItem>
            
            <FormItem
              label="Agente"
            >
              <Select
                options={agents.map(agent => ({
                  value: agent.id,
                  label: agent.name
                }))}
                onChange={(option) => handleFormChange('agentId', option?.value)}
                value={agents
                  .filter(agent => agent.id === formData.agentId)
                  .map(agent => ({
                    value: agent.id,
                    label: agent.name
                  }))[0]}
              />
            </FormItem>
          </div>
          
          <FormItem
            label="Propiedad (opcional)"
          >
            <Select
              options={[
                { value: '', label: 'Sin propiedad específica' },
                ...properties.map(property => ({
                  value: property.id,
                  label: `${property.title} - ${property.address}`
                }))
              ]}
              onChange={(option) => handleFormChange('propertyId', option?.value)}
              value={
                formData.propertyId === '' 
                  ? { value: '', label: 'Sin propiedad específica' }
                  : properties
                      .filter(property => property.id === formData.propertyId)
                      .map(property => ({
                        value: property.id,
                        label: `${property.title} - ${property.address}`
                      }))[0]
              }
            />
          </FormItem>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormItem
              label="Fecha"
            >
              <DatePicker
                selected={formData.date}
                onChange={(date) => handleFormChange('date', date)}
                dateFormat="MMMM d, yyyy"
                placeholderText="Seleccionar fecha"
                className="w-full"
              />
            </FormItem>
            
            <FormItem
              label="Hora"
            >
              <Select
                options={[
                  { value: '09:00', label: '09:00' },
                  { value: '09:30', label: '09:30' },
                  { value: '10:00', label: '10:00' },
                  { value: '10:30', label: '10:30' },
                  { value: '11:00', label: '11:00' },
                  { value: '11:30', label: '11:30' },
                  { value: '12:00', label: '12:00' },
                  { value: '12:30', label: '12:30' },
                  { value: '13:00', label: '13:00' },
                  { value: '13:30', label: '13:30' },
                  { value: '14:00', label: '14:00' },
                  { value: '14:30', label: '14:30' },
                  { value: '15:00', label: '15:00' },
                  { value: '15:30', label: '15:30' },
                  { value: '16:00', label: '16:00' },
                  { value: '16:30', label: '16:30' },
                  { value: '17:00', label: '17:00' },
                  { value: '17:30', label: '17:30' }
                ]}
                onChange={(option) => handleFormChange('time', option?.value)}
                value={{ 
                  value: formData.time, 
                  label: formData.time 
                }}
              />
            </FormItem>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormItem
              label="Tipo de Cita"
            >
              <Select
                options={[
                  { value: 'visit', label: 'Visita presencial' },
                  { value: 'virtual-tour', label: 'Tour virtual' },
                  { value: 'meeting', label: 'Reunión' },
                  { value: 'call', label: 'Llamada' }
                ]}
                onChange={(option) => handleFormChange('type', option?.value)}
                value={{ 
                  value: formData.type, 
                  label: getAppointmentTypeLabel(formData.type) 
                }}
              />
            </FormItem>
            
            <FormItem
              label="Duración (minutos)"
            >
              <Select
                options={[
                  { value: 30, label: '30 minutos' },
                  { value: 60, label: '1 hora' },
                  { value: 90, label: '1 hora 30 minutos' },
                  { value: 120, label: '2 horas' }
                ]}
                onChange={(option) => handleFormChange('duration', Number(option?.value))}
                value={{ 
                  value: formData.duration, 
                  label: `${formData.duration} minutos` 
                }}
              />
            </FormItem>
          </div>
          
          <FormItem
            label="Notas (opcional)"
          >
            <Input.TextArea 
              rows={3}
              placeholder="Notas sobre la cita..."
              value={formData.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
            />
          </FormItem>
        </Form>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button
            onClick={() => setIsFormDialogOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="solid"
            onClick={handleFormSubmit}
            disabled={!formData.clientId || !formData.agentId}
          >
            Programar Cita
          </Button>
        </div>
      </Dialog>
      
      {/* Diálogo de visualización de cita */}
      {selectedAppointment && (
        <Dialog
          isOpen={isViewDialogOpen}
          onClose={() => setIsViewDialogOpen(false)}
          onRequestClose={() => setIsViewDialogOpen(false)}
          width={600}
        >
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-lg font-bold">{selectedAppointment.title || 'Detalles de la Cita'}</h4>
            <span className={`
              text-xs px-2 py-1 rounded-full
              ${selectedAppointment.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 
               selectedAppointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 
               selectedAppointment.status === 'completed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' : 
               'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}
            `}>
              {selectedAppointment.status === 'confirmed' ? 'Confirmada' : 
               selectedAppointment.status === 'scheduled' ? 'Programada' : 
               selectedAppointment.status === 'completed' ? 'Completada' : 'Cancelada'}
            </span>
          </div>
          
          <div className="mb-4">
            <div className="font-medium mb-1">Fecha y Hora</div>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {dayjs(selectedAppointment.date).format('DD/MM/YYYY HH:mm')}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({selectedAppointment.duration} min)
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="font-medium mb-1">Cliente</div>
              <div className="flex items-center gap-2">
                {selectedAppointment.client?.image && (
                  <Avatar 
                    src={selectedAppointment.client.image} 
                    alt={selectedAppointment.client.name}
                    size={32}
                    shape="circle"
                  />
                )}
                <div>
                  <div>{selectedAppointment.client?.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedAppointment.client?.email}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-1">Agente</div>
              <div className="flex items-center gap-2">
                {selectedAppointment.agent?.image && (
                  <Avatar 
                    src={selectedAppointment.agent.image} 
                    alt={selectedAppointment.agent.name}
                    size={32}
                    shape="circle"
                  />
                )}
                <div>
                  <div>{selectedAppointment.agent?.name}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="font-medium mb-1">Tipo de Cita</div>
            <div>
              {getAppointmentTypeLabel(selectedAppointment.type)}
            </div>
          </div>
          
          {selectedAppointment.property && (
            <div className="mb-4">
              <div className="font-medium mb-1">Propiedad</div>
              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                <div className="font-medium">{selectedAppointment.property.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {selectedAppointment.property.address}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{selectedAppointment.property.type}</span>
                  <span className="font-bold">${selectedAppointment.property.price.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
          
          {selectedAppointment.notes && (
            <div className="mb-4">
              <div className="font-medium mb-1">Notas</div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                {selectedAppointment.notes}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && onCancelAppointment && (
              <Button
                onClick={handleCancelAppointment}
                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              >
                Cancelar Cita
              </Button>
            )}
            
            {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && onRescheduleAppointment && (
              <Button
                onClick={() => {
                  setIsViewDialogOpen(false);
                  
                  // Pre-llenar formulario para reprogramación
                  const appointmentTime = dayjs(selectedAppointment.date).format('HH:mm');
                  
                  setFormData({
                    clientId: selectedAppointment.clientId,
                    propertyId: selectedAppointment.propertyId || '',
                    agentId: selectedAppointment.agentId,
                    date: selectedAppointment.date,
                    time: appointmentTime,
                    type: selectedAppointment.type as any,
                    duration: selectedAppointment.duration,
                    notes: selectedAppointment.notes || ''
                  });
                  
                  setIsFormDialogOpen(true);
                }}
              >
                Reprogramar
              </Button>
            )}
            
            <Button
              variant="solid"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
};

export default AppointmentScheduler;