'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, InputNumber, Checkbox, Select, Notification, toast } from '@/components/ui';
import { AppointmentSettingsConfig } from './types';
import { fetchAppointmentSettings, saveAppointmentSettings } from './services';
import useTranslation from '@/utils/hooks/useTranslation';

export interface AppointmentSettingsProps {
  className?: string;
}

const AppointmentSettings = ({ className }: AppointmentSettingsProps) => {
  const { t } = useTranslation();
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
  
  useEffect(() => {
    // Cargar configuración al inicio
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchAppointmentSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      toast.push(
        <Notification title={t('common.error')} type="danger">
          {t('appointments.settings.fetch_error')}
        </Notification>
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field: keyof AppointmentSettingsConfig, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const handleSave = async () => {
    try {
      setSaving(true);
      
      await saveAppointmentSettings(settings);
      
      toast.push(
        <Notification title={t('common.success')} type="success">
          {t('appointments.settings.save_success')}
        </Notification>
      );
      
      // Recargar datos
      loadSettings();
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
    <div className={className}>
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
        <Card className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium">
                {t('appointments.settings.appointment_settings.duration')}
              </label>
              <InputNumber
                value={settings.appointment_duration}
                onChange={(value) => handleInputChange('appointment_duration', value)}
                min={5}
                max={480}
                suffix={t('appointments.settings.appointment_settings.minutes')}
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('appointments.settings.appointment_settings.duration_help')}
              </p>
            </div>
            
            <div>
              <label className="mb-2 block font-medium">
                {t('appointments.settings.appointment_settings.buffer')}
              </label>
              <InputNumber
                value={settings.buffer_time}
                onChange={(value) => handleInputChange('buffer_time', value)}
                min={0}
                max={120}
                suffix={t('appointments.settings.appointment_settings.minutes')}
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('appointments.settings.appointment_settings.buffer_help')}
              </p>
            </div>
            
            <div>
              <label className="mb-2 block font-medium">
                {t('appointments.settings.appointment_settings.max_daily')}
              </label>
              <InputNumber
                value={settings.max_daily_appointments !== null ? settings.max_daily_appointments : undefined}
                onChange={(value) => handleInputChange('max_daily_appointments', value !== undefined ? value : null)}
                min={1}
                max={1000}
                placeholder={t('appointments.settings.appointment_settings.unlimited')}
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('appointments.settings.appointment_settings.max_daily_help')}
              </p>
            </div>
            
            <div>
              <label className="mb-2 block font-medium">
                {t('appointments.settings.appointment_settings.min_notice')}
              </label>
              <InputNumber
                value={settings.min_notice_minutes}
                onChange={(value) => handleInputChange('min_notice_minutes', value)}
                min={0}
                max={10080} // 7 days in minutes
                suffix={t('appointments.settings.appointment_settings.minutes')}
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('appointments.settings.appointment_settings.min_notice_help')}
              </p>
            </div>
            
            <div>
              <label className="mb-2 block font-medium">
                {t('appointments.settings.appointment_settings.max_future')}
              </label>
              <InputNumber
                value={settings.max_future_days}
                onChange={(value) => handleInputChange('max_future_days', value)}
                min={1}
                max={365}
                suffix={t('appointments.settings.appointment_settings.days')}
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('appointments.settings.appointment_settings.max_future_help')}
              </p>
            </div>
            
            <div>
              <label className="mb-2 block font-medium">
                {t('appointments.settings.appointment_settings.reminder_time')}
              </label>
              <InputNumber
                value={settings.reminder_time_hours}
                onChange={(value) => handleInputChange('reminder_time_hours', value)}
                min={1}
                max={168} // 7 days in hours
                suffix={t('appointments.settings.appointment_settings.hours')}
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('appointments.settings.appointment_settings.reminder_time_help')}
              </p>
            </div>
            
            <div>
              <label className="mb-2 block font-medium">
                {t('appointments.settings.appointment_settings.notification_email')}
              </label>
              <Input
                value={settings.notification_email || ''}
                onChange={(e) => handleInputChange('notification_email', e.target.value)}
                placeholder="email@example.com"
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('appointments.settings.appointment_settings.notification_email_help')}
              </p>
            </div>
            
            <div className="flex items-center">
              <Checkbox
                checked={settings.require_approval}
                onChange={(e) => handleInputChange('require_approval', e.target.checked)}
              />
              <div className="ml-2">
                <p className="font-medium">
                  {t('appointments.settings.appointment_settings.require_approval')}
                </p>
                <p className="text-sm text-gray-500">
                  {t('appointments.settings.appointment_settings.require_approval_help')}
                </p>
              </div>
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
        </Card>
      )}
    </div>
  );
};

export default AppointmentSettings;
