'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Checkbox, Input, TimeInput, Select, Notification, toast } from '@/components/ui';
import { DaySchedule } from '../types';
import useTranslation from '@/utils/hooks/useTranslation';

const BusinessHoursSettings = () => {
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
    fetchBusinessHours();
  }, []);
  
  const fetchBusinessHours = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/business/hours');
      
      if (!response.ok) {
        toast.push(
          <Notification title={t('common.error')} type="danger">
            {t('appointments.settings.fetch_error')}
          </Notification>
        );
        throw new Error('Error al obtener horarios');
      }
      
      const data = await response.json();
      
      // Mapear los horarios recibidos
      const businessHours = data.regular_hours || [];
      
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
        allDays[dayIndex] = {
          ...allDays[dayIndex],
          id: hour.id,
          is_closed: hour.is_closed,
          open_time: hour.open_time,
          close_time: hour.close_time,
        };
      });
      
      setSchedules(allDays);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
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
      
      const response = await fetch('/api/business/hours', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hoursToSave),
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar horarios');
      }
      
      toast.push(
        <Notification title={t('common.success')} type="success">
          {t('appointments.settings.save_success')}
        </Notification>
      );
      
      // Recargar datos
      fetchBusinessHours();
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
  
  return (
    <div className="p-4">
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
                  
                  <div className="flex items-center">
                    <Checkbox
                      checked={!daySchedule.is_closed}
                      onChange={() => handleToggleClosed(index)}
                    />
                    <span className="ml-2">
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
                        <TimeInput
                          timeInputProps={{
                            value: daySchedule.open_time,
                            onChange: (value) => handleTimeChange(index, 'open_time', value),
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-sm">
                          {t('appointments.settings.business_hours.close_time')}
                        </label>
                        <TimeInput
                          timeInputProps={{
                            value: daySchedule.close_time,
                            onChange: (value) => handleTimeChange(index, 'close_time', value),
                          }}
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