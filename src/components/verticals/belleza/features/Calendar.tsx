/**
 * frontend/src/components/verticals/belleza/features/Calendar.tsx
 * Calendario para gestión de citas del servicio de belleza
 * @version 1.0.0
 * @updated 2025-06-05
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import classNames from 'classnames';
import dayjs from 'dayjs';

interface Appointment {
  id: string;
  date: Date;
  clientName: string;
  serviceName: string;
  duration: number; // en minutos
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

interface TimeSlot {
  time: string; // formato "HH:MM"
  appointment?: Appointment;
  isAvailable: boolean;
}

interface CalendarProps {
  appointments?: Appointment[];
  workingHours?: {
    start: string; // formato "HH:MM"
    end: string; // formato "HH:MM"
    interval: number; // en minutos
  };
  onAppointmentClick?: (appointment: Appointment) => void;
  onTimeSlotClick?: (date: Date, timeSlot: string) => void;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({
  appointments = [],
  workingHours = { start: '09:00', end: '18:00', interval: 30 },
  onAppointmentClick,
  onTimeSlotClick,
  className = '',
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Generar slots horarios según horario laboral
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    
    let currentTime = dayjs().set('hour', startHour).set('minute', startMinute).set('second', 0);
    const endTime = dayjs().set('hour', endHour).set('minute', endMinute).set('second', 0);
    
    while (currentTime.isBefore(endTime)) {
      const timeStr = currentTime.format('HH:mm');
      const currentDateTime = dayjs(selectedDate)
        .set('hour', currentTime.hour())
        .set('minute', currentTime.minute())
        .toDate();
      
      // Buscar si hay cita en este horario
      const appointment = appointments.find(app => {
        const appTime = dayjs(app.date);
        const slotTime = dayjs(currentDateTime);
        return appTime.isSame(slotTime, 'date') && 
               appTime.hour() === slotTime.hour() && 
               appTime.minute() === slotTime.minute();
      });
      
      // Verificar disponibilidad (aquí se podría implementar lógica más compleja)
      const isAvailable = !appointment && dayjs(currentDateTime).isAfter(dayjs());
      
      slots.push({
        time: timeStr,
        appointment: appointment,
        isAvailable: isAvailable
      });
      
      currentTime = currentTime.add(workingHours.interval, 'minute');
    }
    
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  // Manejar clic en un slot de tiempo
  const handleTimeSlotClick = (slot: TimeSlot) => {
    if (slot.appointment) {
      onAppointmentClick && onAppointmentClick(slot.appointment);
    } else if (slot.isAvailable) {
      const [hours, minutes] = slot.time.split(':').map(Number);
      const dateTime = dayjs(selectedDate)
        .set('hour', hours)
        .set('minute', minutes)
        .toDate();
      
      onTimeSlotClick && onTimeSlotClick(dateTime, slot.time);
    }
  };
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-lg">Calendario de citas</h3>
      </div>
      
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date as Date)}
          className="w-full"
        />
      </div>
      
      <div className="p-4">
        <div className="text-sm font-medium mb-3">
          {dayjs(selectedDate).format('dddd, D [de] MMMM [de] YYYY')}
        </div>
        
        <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto">
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              onClick={() => handleTimeSlotClick(slot)}
              className={classNames(
                'p-3 rounded-md cursor-pointer transition-all',
                slot.appointment ? 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50' : 
                  slot.isAvailable ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700' : 
                  'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60'
              )}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{slot.time}</span>
                {slot.appointment && (
                  <span className={classNames(
                    'text-xs px-2 py-1 rounded-full',
                    slot.appointment.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                    slot.appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
                    slot.appointment.status === 'completed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  )}>
                    {slot.appointment.status === 'confirmed' ? 'Confirmada' :
                     slot.appointment.status === 'scheduled' ? 'Programada' :
                     slot.appointment.status === 'completed' ? 'Completada' : 'Cancelada'}
                  </span>
                )}
              </div>
              
              {slot.appointment && (
                <div className="mt-1">
                  <div className="font-semibold">{slot.appointment.clientName}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {slot.appointment.serviceName} 
                    <span className="ml-1">({slot.appointment.duration} min)</span>
                  </div>
                </div>
              )}
              
              {!slot.appointment && slot.isAvailable && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Disponible
                </div>
              )}
              
              {!slot.appointment && !slot.isAvailable && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  No disponible
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default Calendar;