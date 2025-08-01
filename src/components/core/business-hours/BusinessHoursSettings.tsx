'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Switcher, Input, Notification, toast } from '@/components/ui';
import { DaySchedule } from './types';
import { fetchBusinessHours, saveBusinessHours } from './services';
import useTranslation from '@/utils/hooks/useTranslation';

export interface BusinessHoursSettingsProps {
  className?: string;
}

const BusinessHoursSettings = ({ className }: BusinessHoursSettingsProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  
  // Día por defecto (nombres en español)
  const dayNames = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];
  
  useEffect(() => {
    // Cargar horarios al inicio
    loadBusinessHours();
  }, []);
  
  const loadBusinessHours = async () => {
    try {
      setLoading(true);
      
      const businessHours = await fetchBusinessHours();
      
      // Crear un arreglo con los 7 días de la semana
      const allDays: DaySchedule[] = Array.from({ length: 7 }, (_, index) => ({
        day_of_week: index,
        day_name: dayNames[index],
        is_closed: true,
        open_time: '09:00',
        close_time: '18:00',
      }));
      
      // Actualizar con los datos recibidos
      businessHours.forEach((hour: any) => {
        const dayIndex = hour.day_of_week;
        if (dayIndex >= 0 && dayIndex < 7) {
          allDays[dayIndex] = {
            ...allDays[dayIndex],
            id: hour.id,
            is_closed: hour.is_closed,
            open_time: hour.open_time,
            close_time: hour.close_time,
          };
        }
      });
      
      setSchedules(allDays);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      toast.push(
        <Notification title={t('common.error')} type="danger">
          {t('appointments.settings.fetch_error')}
        </Notification>
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleClosed = (index: number) => {
    setSchedules((prevSchedules) => {
      const newSchedules = [...prevSchedules];
      newSchedules[index] = {
        ...newSchedules[index],
        is_closed: !newSchedules[index].is_closed,
      };
      return newSchedules;
    });
  };
  
  const handleTimeChange = (index: number, field: 'open_time' | 'close_time', value: string) => {
    setSchedules((prevSchedules) => {
      const newSchedules = [...prevSchedules];
      newSchedules[index] = {
        ...newSchedules[index],
        [field]: value,
      };
      return newSchedules;
    });
  };
  
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Preparar datos para enviar
      const hoursToSave = schedules.map(day => ({
        day_of_week: day.day_of_week,
        is_closed: day.is_closed,
        open_time: day.open_time,
        close_time: day.close_time,
      }));
      
      await saveBusinessHours(hoursToSave);
      
      toast.push(
        <Notification title={t('common.success')} type="success">
          {t('appointments.settings.save_success')}
        </Notification>
      );
      
      // Recargar datos
      loadBusinessHours();
    } catch (error) {
      console.error('Error al guardar horarios:', error);
      toast.push(
        <Notification title={t('common.error')} type="danger">
          {t('appointments.settings.save_error')}
        </Notification>
      );
    } finally {
      setSaving(false);
    }
  };
  
  console.log('Schedules:', schedules); // Debug
  
  return (
    <div className={className}>
      <div className="mb-6">
        <h4 className="mb-4 text-lg font-semibold">
          {t('appointments.settings.business_hours.title')}
        </h4>
        <p className="mb-4 text-gray-500">
          {t('appointments.settings.business_hours.description')}
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : (
        <>
          <div className="mb-4 space-y-4">
            {schedules.map((daySchedule, index) => (
              <Card key={daySchedule.day_of_week} className="p-4">
                <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                  <div className="w-full md:w-32">
                    <span className="font-medium">{daySchedule.day_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Switcher
                      checked={!daySchedule.is_closed}
                      onChange={() => handleToggleClosed(index)}
                    />
                    <span className="text-sm font-medium">
                      {daySchedule.is_closed
                        ? t('appointments.settings.business_hours.closed')
                        : t('appointments.settings.business_hours.open')}
                    </span>
                  </div>
                  
                  {!daySchedule.is_closed && (
                    <>
                      <div className="flex-1">
                        <label className="mb-1 block text-sm">
                          {t('appointments.settings.business_hours.open_time')}
                        </label>
                        <Input
                          type="time"
                          value={daySchedule.open_time || '09:00'}
                          onChange={(e) => handleTimeChange(index, 'open_time', e.target.value)}
                          size="sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-sm">
                          {t('appointments.settings.business_hours.close_time')}
                        </label>
                        <Input
                          type="time"
                          value={daySchedule.close_time || '18:00'}
                          onChange={(e) => handleTimeChange(index, 'close_time', e.target.value)}
                          size="sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-end">
            <Button
              variant="solid"
              color="primary"
              onClick={handleSave}
              loading={saving}
            >
              {t('common.save')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessHoursSettings;
