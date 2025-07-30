'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { useTranslation } from '@/utils/hooks/useTranslation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { FaCheckCircle, FaTimesCircle, FaCalendarCheck } from 'react-icons/fa';

interface AppointmentData {
  id: string;
  date: string;
  time: string;
  customerName: string;
  location?: string;
  status: string;
  notes?: string;
}

const AppointmentValidationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const t = useTranslation();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [validationStatus, setValidationStatus] = useState<'validating' | 'valid' | 'invalid' | 'error'>('validating');
  
  // Verificar la cita al cargar la página
  useEffect(() => {
    const validateAppointment = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Obtener los datos de la cita
        const response = await axios.get(`/api/appointments/validate/${id}`);
        setAppointment(response.data);
        
        // Marcar la cita como validada
        await axios.post(`/api/appointments/validate/${id}`);
        
        setValidationStatus('valid');
      } catch (err: any) {
        console.error('Error validando cita:', err);
        setError(err.response?.data?.error || 'Error al validar la cita');
        setValidationStatus(err.response?.status === 404 ? 'invalid' : 'error');
      } finally {
        setLoading(false);
      }
    };
    
    validateAppointment();
  }, [id]);
  
  // Renderizar pantalla de carga
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('Validando cita')}</h1>
          <p className="text-gray-500">{t('Por favor espera mientras verificamos tu cita...')}</p>
        </Card>
      </div>
    );
  }
  
  // Renderizar error
  if (validationStatus === 'error' || validationStatus === 'invalid') {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <div className="text-red-500 mb-4">
            <FaTimesCircle size={60} className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {validationStatus === 'invalid' ? t('Cita no encontrada') : t('Error de validación')}
          </h1>
          <p className="text-gray-500 mb-6">
            {error || t('No pudimos validar esta cita. La cita puede no existir o ya ha sido validada.')}
          </p>
          <Button 
            variant="solid" 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            {t('Volver al inicio')}
          </Button>
        </Card>
      </div>
    );
  }
  
  // Renderizar confirmación
  return (
    <div className="h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="text-green-500 mb-4 text-center">
          <FaCheckCircle size={60} className="mx-auto" />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-center">{t('¡Cita Validada!')}</h1>
        
        {appointment && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <FaCalendarCheck className="text-blue-500 mr-3" size={24} />
              <div>
                <p className="text-sm text-gray-500">{t('Fecha y hora')}</p>
                <p className="font-medium">{appointment.date} - {appointment.time}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-gray-500">{t('Cliente')}:</p>
                <p className="font-medium">{appointment.customerName}</p>
              </div>
              
              {appointment.location && (
                <div className="flex justify-between">
                  <p className="text-gray-500">{t('Ubicación')}:</p>
                  <p className="font-medium">{appointment.location}</p>
                </div>
              )}
              
              {appointment.notes && (
                <div className="mt-2">
                  <p className="text-gray-500">{t('Notas')}:</p>
                  <p className="bg-gray-50 p-2 rounded mt-1 text-sm">{appointment.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex space-x-3">
          <Button
            variant="plain"
            onClick={() => window.location.href = '/'}
            className="flex-1"
          >
            {t('Volver al inicio')}
          </Button>
          <Button
            variant="solid"
            onClick={() => window.location.href = '/appointments'}
            className="flex-1"
          >
            {t('Ver todas las citas')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AppointmentValidationPage;