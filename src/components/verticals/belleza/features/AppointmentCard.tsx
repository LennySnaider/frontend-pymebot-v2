/**
 * frontend/src/components/verticals/belleza/features/AppointmentCard.tsx
 * Tarjeta de cita para servicios de belleza
 * @version 1.0.0
 * @updated 2025-06-05
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Tag from '@/components/ui/Tag';
import dayjs from 'dayjs';

interface Service {
  id: string;
  name: string;
  duration: number; // en minutos
  price: number;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profileImage?: string;
}

interface AppointmentCardProps {
  id: string;
  date: Date;
  client: Client;
  services: Service[];
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
  onComplete?: (id: string) => void;
  onView?: (id: string) => void;
  className?: string;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  id,
  date,
  client,
  services,
  status,
  notes,
  onReschedule,
  onCancel,
  onComplete,
  onView,
  className = '',
}) => {
  // Calcular duración total
  const totalDuration = services.reduce((acc, service) => acc + service.duration, 0);
  
  // Formatear hora de fin
  const endTime = dayjs(date).add(totalDuration, 'minute');
  
  // Calcular precio total
  const totalPrice = services.reduce((acc, service) => acc + service.price, 0);
  
  // Determinar clase de estado
  const statusClasses = {
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  
  // Textos de estado
  const statusText = {
    scheduled: 'Programada',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Tag className={statusClasses[status]}>
                {statusText[status]}
              </Tag>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ID: {id.slice(0, 8)}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-1">{dayjs(date).format('DD/MM/YYYY')}</h3>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {dayjs(date).format('HH:mm')} - {endTime.format('HH:mm')} 
              <span className="ml-1 text-gray-500">({totalDuration} min)</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">${totalPrice.toFixed(2)}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {services.length} servicio{services.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <Avatar 
            size={40} 
            shape="circle" 
            src={client.profileImage} 
            alt={client.name}
          />
          <div>
            <div className="font-semibold">{client.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{client.phone}</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm font-medium mb-1">Servicios:</div>
          <ul className="space-y-1">
            {services.map((service) => (
              <li key={service.id} className="text-sm flex justify-between">
                <span>{service.name} ({service.duration} min)</span>
                <span>${service.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        {notes && (
          <div className="mb-4">
            <div className="text-sm font-medium mb-1">Notas:</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded">
              {notes}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          {status !== 'completed' && status !== 'cancelled' && (
            <>
              {onComplete && (
                <Button 
                  size="sm" 
                  variant={status === 'confirmed' ? 'solid' : 'default'}
                  onClick={() => onComplete(id)}
                >
                  Completar
                </Button>
              )}
              {onReschedule && (
                <Button 
                  size="sm" 
                  onClick={() => onReschedule(id)}
                >
                  Reprogramar
                </Button>
              )}
              {onCancel && (
                <Button 
                  size="sm" 
                  variant="plain"
                  onClick={() => onCancel(id)}
                  className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                >
                  Cancelar
                </Button>
              )}
            </>
          )}
          {onView && (
            <Button 
              size="sm" 
              variant="plain"
              onClick={() => onView(id)}
            >
              Ver detalles
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AppointmentCard;