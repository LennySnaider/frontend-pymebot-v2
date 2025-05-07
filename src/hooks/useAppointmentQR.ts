'use client';

import { useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentDetails {
  id: string;
  date: Date;
  time: string;
  customer: {
    id: string;
    name: string;
    email?: string;
  };
  location?: string;
  notes?: string;
  status: string;
}

interface UseAppointmentQROptions {
  baseUrl?: string;
  defaultTenantName?: string;
}

interface SendQREmailParams {
  appointment: AppointmentDetails;
  email?: string;
  name?: string;
}

export const useAppointmentQR = (options: UseAppointmentQROptions = {}) => {
  const { baseUrl = typeof window !== 'undefined' ? window.location.origin : '', defaultTenantName = 'PymeBot' } = options;
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Genera la URL de validación para el QR
  const generateValidationUrl = (appointmentId: string): string => {
    return `${baseUrl}/appointments/validate/${appointmentId}`;
  };
  
  // Genera la URL para la imagen QR
  const generateQRImageUrl = (appointmentId: string): string => {
    // La URL de la API incluye el ID de la cita para generar un QR único
    return `${baseUrl}/api/appointments/qr/${appointmentId}/image`;
  };
  
  // Envía el código QR por email
  const sendQREmail = async ({ appointment, email, name }: SendQREmailParams) => {
    setLoading(true);
    setError(null);
    
    try {
      // Formatear la fecha
      const formattedDate = format(appointment.date, 'EEEE, d MMMM yyyy', { locale: es });
      
      // Obtener la URL del QR
      const qrCodeUrl = generateQRImageUrl(appointment.id);
      const validationUrl = generateValidationUrl(appointment.id);
      
      // Preparar datos para la API
      const emailData = {
        to: email || appointment.customer.email,
        recipientName: name || appointment.customer.name,
        appointmentDate: formattedDate,
        appointmentTime: appointment.time,
        qrCodeUrl,
        appointmentLocation: appointment.location,
        appointmentDetails: appointment.notes,
        validationUrl,
        tenantName: defaultTenantName,
      };
      
      // Validar que haya un email
      if (!emailData.to) {
        throw new Error('Se requiere un email para enviar el código QR');
      }
      
      // Enviar la solicitud a la API
      const response = await axios.post('/api/appointments/qr-email', emailData);
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al enviar el QR por email';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    generateQRImageUrl,
    generateValidationUrl,
    sendQREmail,
    loading,
    error,
  };
};

export default useAppointmentQR;