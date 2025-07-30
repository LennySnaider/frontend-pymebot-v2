'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormItem, Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslation } from '@/utils/hooks/useTranslation';
import { SystemVariablesService } from '@/services/SystemVariablesService';
import { FaEnvelope, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';

// Esquema de validación para el formulario
const emailSettingsSchema = z.object({
  RESEND_API_KEY: z.string().min(1, 'La API Key es requerida'),
  RESEND_DEFAULT_FROM: z.string().email('Debe ser un email válido'),
  RESEND_DEFAULT_REPLY_TO: z.string().email('Debe ser un email válido').optional(),
});

type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>;

const EmailSettingsPage: React.FC = () => {
  const t = useTranslation(); // Asegúrate de que esto devuelve una función, no un objeto
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testingEmail, setTestingEmail] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      RESEND_API_KEY: '',
      RESEND_DEFAULT_FROM: '',
      RESEND_DEFAULT_REPLY_TO: '',
    },
  });

  // Cargar configuración actual
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        
        const service = SystemVariablesService.getInstance();
        const variables = await service.getVariables(['RESEND_API_KEY', 'RESEND_DEFAULT_FROM', 'RESEND_DEFAULT_REPLY_TO']);
        
        // Establecer valores en el formulario
        setValue('RESEND_API_KEY', variables.RESEND_API_KEY || '');
        setValue('RESEND_DEFAULT_FROM', variables.RESEND_DEFAULT_FROM || '');
        setValue('RESEND_DEFAULT_REPLY_TO', variables.RESEND_DEFAULT_REPLY_TO || '');
      } catch (error) {
        console.error('Error cargando configuración de email:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [setValue]);

  // Guardar configuración
  const onSubmit = async (data: EmailSettingsFormValues) => {
    try {
      setSaving(true);
      
      const service = SystemVariablesService.getInstance();
      
      // Guardar cada variable
      await service.setVariable('RESEND_API_KEY', data.RESEND_API_KEY);
      await service.setVariable('RESEND_DEFAULT_FROM', data.RESEND_DEFAULT_FROM);
      
      if (data.RESEND_DEFAULT_REPLY_TO) {
        await service.setVariable('RESEND_DEFAULT_REPLY_TO', data.RESEND_DEFAULT_REPLY_TO);
      }
      
      alert('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error guardando configuración');
    } finally {
      setSaving(false);
    }
  };
  
  // Probar configuración
  const testEmailConfiguration = async () => {
    try {
      setTestingEmail(true);
      setTestStatus('idle');
      setTestMessage('');
      
      // Obtener valores actuales del formulario
      const formValues = {
        apiKey: (document.getElementById('RESEND_API_KEY') as HTMLInputElement).value,
        defaultFrom: (document.getElementById('RESEND_DEFAULT_FROM') as HTMLInputElement).value,
      };
      
      // Validar que tengamos los valores necesarios
      if (!formValues.apiKey || !formValues.defaultFrom) {
        throw new Error('Por favor completa la API Key y el Email remitente antes de probar');
      }
      
      // Llamar al endpoint de prueba
      const response = await axios.post('/api/admin/test-email', {
        apiKey: formValues.apiKey,
        from: formValues.defaultFrom,
        to: formValues.defaultFrom, // Enviamos a la misma dirección
        subject: 'Prueba de configuración de email',
        text: 'Este es un email de prueba para verificar la configuración de Resend.',
      });
      
      setTestStatus('success');
      setTestMessage('¡Email enviado correctamente! Por favor verifica tu bandeja de entrada.');
    } catch (error: any) {
      console.error('Error probando configuración de email:', error);
      setTestStatus('error');
      setTestMessage(error.response?.data?.error || error.message || 'Error enviando email de prueba');
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Configuración de Email</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Configuración de Resend</h2>
        
        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormItem
            label="API Key de Resend"
            invalid={!!errors.RESEND_API_KEY}
            errorMessage={errors.RESEND_API_KEY?.message}
            className="mb-4"
          >
            <Input
              id="RESEND_API_KEY"
              type="password"
              {...register('RESEND_API_KEY')}
              placeholder="re_1234567890abcdef1234567890abcdef"
            />
          </FormItem>
          
          <FormItem
            label="Email Remitente"
            invalid={!!errors.RESEND_DEFAULT_FROM}
            errorMessage={errors.RESEND_DEFAULT_FROM?.message}
            className="mb-4"
          >
            <Input
              id="RESEND_DEFAULT_FROM"
              type="email"
              {...register('RESEND_DEFAULT_FROM')}
              placeholder="no-reply@tudominio.com"
            />
          </FormItem>
          
          <FormItem
            label="Email de Respuesta (opcional)"
            invalid={!!errors.RESEND_DEFAULT_REPLY_TO}
            errorMessage={errors.RESEND_DEFAULT_REPLY_TO?.message}
            className="mb-6"
          >
            <Input
              id="RESEND_DEFAULT_REPLY_TO"
              type="email"
              {...register('RESEND_DEFAULT_REPLY_TO')}
              placeholder="soporte@tudominio.com"
            />
          </FormItem>
          
          {testStatus === 'success' && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md flex items-center">
              <FaCheck className="mr-2" />
              <span>{testMessage}</span>
            </div>
          )}
          
          {testStatus === 'error' && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md flex items-center">
              <FaTimes className="mr-2" />
              <span>{testMessage}</span>
            </div>
          )}
          
          <div className="flex space-x-3">
            <Button
              type="submit"
              variant="solid"
              disabled={saving}
              icon={saving ? <Spinner size={20} /> : undefined}
              className="w-full sm:w-auto"
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
            
            <Button
              type="button"
              variant="default"
              disabled={testingEmail || saving}
              icon={testingEmail ? <Spinner size={20} /> : <FaEnvelope />}
              className="w-full sm:w-auto"
              onClick={testEmailConfiguration}
            >
              {testingEmail ? 'Enviando...' : 'Probar Configuración'}
            </Button>
          </div>
        </Form>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-2">Información</h2>
        <p className="text-gray-600 mb-4">
          Esta configuración permite al sistema enviar emails usando el servicio Resend.
        </p>
        
        <h3 className="font-medium mb-1">Cómo obtener una API Key:</h3>
        <ol className="list-decimal list-inside text-gray-600 mb-4 space-y-1">
          <li>Regístrate en <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">Resend.com</a></li>
          <li>Ve a la sección de API Keys en tu dashboard</li>
          <li>Crea una nueva API Key y cópiala aquí</li>
        </ol>
        
        <h3 className="font-medium mb-1">Notas importantes:</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>El &quot;Email Remitente&quot; debe estar verificado en tu cuenta de Resend</li>
          <li>Para envíos masivos, asegúrate de configurar correctamente tu dominio en Resend</li>
          <li>El plan gratuito de Resend tiene limitaciones en el número de emails</li>
        </ul>
      </Card>
    </div>
  );
};

export default EmailSettingsPage;