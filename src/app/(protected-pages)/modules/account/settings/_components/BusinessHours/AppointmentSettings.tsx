'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Notification, toast, InputGroup, Form, FormItem, Checkbox } from '@/components/ui';
import { AppointmentSettingsConfig } from './types';

// Función temporal para traducciones mientras solucionamos el problema
const mockTranslation = (key: string) => {
  const translations: Record<string, string> = {
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.save': 'Guardar',
    'appointments.settings.fetch_error': 'Error al obtener la configuración',
    'appointments.settings.save_error': 'Error al guardar la configuración',
    'appointments.settings.save_success': 'Configuración guardada con éxito',
    'appointments.settings.appointment_settings.title': 'Configuración de Citas',
    'appointments.settings.appointment_settings.description': 'Configure las opciones generales para las citas.',
    'appointments.settings.appointment_settings.duration': 'Duración predeterminada',
    'appointments.settings.appointment_settings.buffer_time': 'Tiempo entre citas',
    'appointments.settings.appointment_settings.max_daily': 'Máximo de citas diarias',
    'appointments.settings.appointment_settings.min_notice': 'Tiempo mínimo de antelación',
    'appointments.settings.appointment_settings.max_future_days': 'Días máximos en el futuro',
    'appointments.settings.appointment_settings.reminder_time': 'Tiempo de recordatorio',
    'appointments.settings.appointment_settings.notification_email': 'Email de notificación',
    'appointments.settings.appointment_settings.require_approval': 'Requiere aprobación manual',
    'appointments.settings.appointment_settings.minutes': 'minutos',
    'appointments.settings.appointment_settings.days': 'días',
    'appointments.settings.appointment_settings.hours': 'horas',
    'appointments.settings.appointment_settings.unlimited': 'Sin límite',
    'appointments.settings.appointment_settings.notification_email_placeholder': 'email@ejemplo.com',
    'appointments.settings.errors.duration_required': 'La duración debe ser mayor que cero',
    'appointments.settings.errors.buffer_non_negative': 'El buffer no puede ser negativo',
    'appointments.settings.errors.max_non_negative': 'El máximo no puede ser negativo',
    'appointments.settings.errors.notice_non_negative': 'El tiempo de antelación no puede ser negativo',
    'appointments.settings.errors.future_days_required': 'Los días en el futuro deben ser mayores que cero',
    'appointments.settings.errors.reminder_non_negative': 'El tiempo de recordatorio no puede ser negativo',
    'appointments.settings.errors.invalid_email': 'El email no es válido'
  };
  
  return translations[key] || key.split('.').pop() || key;
};

const AppointmentSettings = () => {
  // Función t para sustituir useTranslation temporalmente
  const t = mockTranslation;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppointmentSettingsConfig>({
    appointment_duration: 30,
    buffer_time: 0,
    max_daily_appointments: null,
    min_notice_minutes: 60,
    max_future_days: 30,
    require_approval: false,
    reminder_time_hours: 24,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Cargar configuración al inicio
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/appointments/settings');
      
      if (!response.ok) {
        toast.push(
          <Notification title={t('common.error')} type="danger">
            {t('appointments.settings.fetch_error')}
          </Notification>
        );
        throw new Error('Error al obtener configuración');
      }
      
      const data = await response.json();
      setSettings(data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      setLoading(false);
    }
  };
  
  const handleInputChange = (field: keyof AppointmentSettingsConfig, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (settings.appointment_duration <= 0) {
      newErrors.appointment_duration = t('appointments.settings.errors.duration_required');
    }
    
    if (settings.buffer_time < 0) {
      newErrors.buffer_time = t('appointments.settings.errors.buffer_non_negative');
    }
    
    if (settings.max_daily_appointments !== null && settings.max_daily_appointments < 0) {
      newErrors.max_daily_appointments = t('appointments.settings.errors.max_non_negative');
    }
    
    if (settings.min_notice_minutes < 0) {
      newErrors.min_notice_minutes = t('appointments.settings.errors.notice_non_negative');
    }
    
    if (settings.max_future_days <= 0) {
      newErrors.max_future_days = t('appointments.settings.errors.future_days_required');
    }
    
    if (settings.reminder_time_hours < 0) {
      newErrors.reminder_time_hours = t('appointments.settings.errors.reminder_non_negative');
    }
    
    if (settings.notification_email && 
        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(settings.notification_email)) {
      newErrors.notification_email = t('appointments.settings.errors.invalid_email');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    try {
      if (!validateForm()) {
        return;
      }
      
      setSaving(true);
      
      const response = await fetch('/api/appointments/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar configuración');
      }
      
      toast.push(
        <Notification title={t('common.success')} type="success">
          {t('appointments.settings.save_success')}
        </Notification>
      );
      
      // Recargar datos
      fetchSettings();
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.push(
        <Notification title={t('common.error')} type="danger">
          {t('appointments.settings.save_error')}
        </Notification>
      );
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="p-4">
      <div className="mb-6">
        <h4 className="mb-4 text-lg font-semibold">
          {t('appointments.settings.appointment_settings.title')}
        </h4>
        <p className="mb-4 text-gray-500">
          {t('appointments.settings.appointment_settings.description')}
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : (
        <Form layout="vertical">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormItem
              label={t('appointments.settings.appointment_settings.duration')}
              invalid={!!errors.appointment_duration}
              errorMessage={errors.appointment_duration}
            >
              <InputGroup>
                <Input
                  type="number"
                  value={settings.appointment_duration}
                  onChange={(e) => handleInputChange('appointment_duration', parseInt(e.target.value) || 0)}
                />
                <InputGroup.Addon>{t('appointments.settings.appointment_settings.minutes')}</InputGroup.Addon>
              </InputGroup>
            </FormItem>
            
            <FormItem
              label={t('appointments.settings.appointment_settings.buffer_time')}
              invalid={!!errors.buffer_time}
              errorMessage={errors.buffer_time}
            >
              <InputGroup>
                <Input
                  type="number"
                  value={settings.buffer_time}
                  onChange={(e) => handleInputChange('buffer_time', parseInt(e.target.value) || 0)}
                />
                <InputGroup.Addon>{t('appointments.settings.appointment_settings.minutes')}</InputGroup.Addon>
              </InputGroup>
            </FormItem>
            
            <FormItem
              label={t('appointments.settings.appointment_settings.max_daily')}
              invalid={!!errors.max_daily_appointments}
              errorMessage={errors.max_daily_appointments}
            >
              <Input
                type="number"
                value={settings.max_daily_appointments === null ? '' : settings.max_daily_appointments}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseInt(e.target.value);
                  handleInputChange('max_daily_appointments', value);
                }}
                placeholder={t('appointments.settings.appointment_settings.unlimited')}
              />
            </FormItem>
            
            <FormItem
              label={t('appointments.settings.appointment_settings.min_notice')}
              invalid={!!errors.min_notice_minutes}
              errorMessage={errors.min_notice_minutes}
            >
              <InputGroup>
                <Input
                  type="number"
                  value={settings.min_notice_minutes}
                  onChange={(e) => handleInputChange('min_notice_minutes', parseInt(e.target.value) || 0)}
                />
                <InputGroup.Addon>{t('appointments.settings.appointment_settings.minutes')}</InputGroup.Addon>
              </InputGroup>
            </FormItem>
            
            <FormItem
              label={t('appointments.settings.appointment_settings.max_future_days')}
              invalid={!!errors.max_future_days}
              errorMessage={errors.max_future_days}
            >
              <InputGroup>
                <Input
                  type="number"
                  value={settings.max_future_days}
                  onChange={(e) => handleInputChange('max_future_days', parseInt(e.target.value) || 0)}
                />
                <InputGroup.Addon>{t('appointments.settings.appointment_settings.days')}</InputGroup.Addon>
              </InputGroup>
            </FormItem>
            
            <FormItem
              label={t('appointments.settings.appointment_settings.reminder_time')}
              invalid={!!errors.reminder_time_hours}
              errorMessage={errors.reminder_time_hours}
            >
              <InputGroup>
                <Input
                  type="number"
                  value={settings.reminder_time_hours}
                  onChange={(e) => handleInputChange('reminder_time_hours', parseInt(e.target.value) || 0)}
                />
                <InputGroup.Addon>{t('appointments.settings.appointment_settings.hours')}</InputGroup.Addon>
              </InputGroup>
            </FormItem>
            
            <FormItem
              label={t('appointments.settings.appointment_settings.notification_email')}
              invalid={!!errors.notification_email}
              errorMessage={errors.notification_email}
            >
              <Input
                type="email"
                value={settings.notification_email || ''}
                onChange={(e) => handleInputChange('notification_email', e.target.value)}
                placeholder={t('appointments.settings.appointment_settings.notification_email_placeholder')}
              />
            </FormItem>
            
            <div className="col-span-1 md:col-span-2">
              <Checkbox
                checked={settings.require_approval}
                onChange={(e) => handleInputChange('require_approval', e.target.checked)}
              >
                {t('appointments.settings.appointment_settings.require_approval')}
              </Checkbox>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button
              variant="solid"
              color="primary"
              onClick={handleSave}
              loading={saving}
            >
              {t('common.save')}
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default AppointmentSettings;