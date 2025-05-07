'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Form } from '@/components/ui/Form';
import { FormItem } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { FaEnvelope } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';

// Esquema de validación para el formulario
const sendQREmailSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'El nombre es requerido'),
});

type SendQREmailFormValues = z.infer<typeof sendQREmailSchema>;

interface SendQREmailButtonProps {
  appointmentDate: string;
  appointmentTime: string;
  qrCodeUrl: string;
  appointmentLocation?: string;
  appointmentDetails?: string;
  validationUrl?: string;
  tenantName?: string;
  prefilledEmail?: string;
  prefilledName?: string;
  className?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

const SendQREmailButton: React.FC<SendQREmailButtonProps> = ({
  appointmentDate,
  appointmentTime,
  qrCodeUrl,
  appointmentLocation,
  appointmentDetails,
  validationUrl,
  tenantName,
  prefilledEmail = '',
  prefilledName = '',
  className = '',
  onSuccess,
  onError,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SendQREmailFormValues>({
    resolver: zodResolver(sendQREmailSchema),
    defaultValues: {
      email: prefilledEmail,
      name: prefilledName,
    },
  });

  const openDialog = () => {
    setIsDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    reset();
  };

  const onSubmit = async (data: SendQREmailFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/appointments/qr-email', {
        to: data.email,
        recipientName: data.name,
        appointmentDate,
        appointmentTime,
        qrCodeUrl,
        appointmentLocation,
        appointmentDetails,
        validationUrl,
        tenantName,
      });

      setSuccess('Email enviado correctamente');
      onSuccess && onSuccess(response.data);
      
      // Cerrar el diálogo después de un breve retraso
      setTimeout(() => {
        closeDialog();
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al enviar el email';
      setError(errorMessage);
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="default" 
        onClick={openDialog}
        className={className}
        icon={<FaEnvelope />}
      >
        Enviar QR por Email
      </Button>

      <Dialog
        isOpen={isDialogOpen}
        onRequestClose={closeDialog}
        title="Enviar QR por Email"
      >
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Envía el código QR de la cita al email del cliente.
          </p>

          <Form onSubmit={handleSubmit(onSubmit)}>
            <FormItem
              label="Nombre del Destinatario"
              invalid={!!errors.name}
              errorMessage={errors.name?.message}
              className="mb-4"
            >
              <Input
                type="text"
                {...register('name')}
                placeholder="Nombre completo"
                autoComplete="name"
              />
            </FormItem>

            <FormItem
              label="Email"
              invalid={!!errors.email}
              errorMessage={errors.email?.message}
              className="mb-6"
            >
              <Input
                type="email"
                {...register('email')}
                placeholder="ejemplo@correo.com"
                autoComplete="email"
              />
            </FormItem>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4">
                {success}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="plain"
                onClick={closeDialog}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="solid"
                type="submit"
                disabled={loading}
                icon={loading ? <Spinner size={20} /> : <FaEnvelope />}
              >
                {loading ? 'Enviando...' : 'Enviar Email'}
              </Button>
            </div>
          </Form>
        </div>
      </Dialog>
    </>
  );
};

export default SendQREmailButton;