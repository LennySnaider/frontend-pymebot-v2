'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormItem, Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslation } from '@/utils/hooks/useTranslation';
import { SystemVariablesService } from '@/services/SystemVariablesService';
import { FaRegClock, FaCog } from 'react-icons/fa';

const BusinessHoursSettingsPage: React.FC = () => {
  const t = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [hoursConfig, setHoursConfig] = useState({
    DEFAULT_BUSINESS_START_TIME: '',
    DEFAULT_BUSINESS_END_TIME: '',
    DEFAULT_BUSINESS_DAYS: '',
    DEFAULT_APPOINTMENT_DURATION: '',
  });

  // Cargar configuración actual
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        
        const service = SystemVariablesService.getInstance();
        const variables = await service.getVariables([
          'DEFAULT_BUSINESS_START_TIME',
          'DEFAULT_BUSINESS_END_TIME',
          'DEFAULT_BUSINESS_DAYS',
          'DEFAULT_APPOINTMENT_DURATION'
        ]);
        
        setHoursConfig({
          DEFAULT_BUSINESS_START_TIME: variables.DEFAULT_BUSINESS_START_TIME || '09:00',
          DEFAULT_BUSINESS_END_TIME: variables.DEFAULT_BUSINESS_END_TIME || '18:00',
          DEFAULT_BUSINESS_DAYS: variables.DEFAULT_BUSINESS_DAYS || '1,2,3,4,5',
          DEFAULT_APPOINTMENT_DURATION: variables.DEFAULT_APPOINTMENT_DURATION || '60',
        });
      } catch (error) {
        console.error('Error cargando configuración de horarios:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHoursConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Guardar configuración
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const service = SystemVariablesService.getInstance();
      
      // Guardar cada variable
      await service.setVariable('DEFAULT_BUSINESS_START_TIME', hoursConfig.DEFAULT_BUSINESS_START_TIME);
      await service.setVariable('DEFAULT_BUSINESS_END_TIME', hoursConfig.DEFAULT_BUSINESS_END_TIME);
      await service.setVariable('DEFAULT_BUSINESS_DAYS', hoursConfig.DEFAULT_BUSINESS_DAYS);
      await service.setVariable('DEFAULT_APPOINTMENT_DURATION', hoursConfig.DEFAULT_APPOINTMENT_DURATION);
      
      alert('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
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
      <h1 className="text-2xl font-bold mb-6">Configuración de Horarios de Negocio</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Horarios Predeterminados</h2>
        
        <Form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormItem
              label="Hora de inicio de jornada"
              className="mb-4"
            >
              <Input
                type="time"
                name="DEFAULT_BUSINESS_START_TIME"
                value={hoursConfig.DEFAULT_BUSINESS_START_TIME}
                onChange={handleChange}
              />
            </FormItem>
            
            <FormItem
              label="Hora de fin de jornada"
              className="mb-4"
            >
              <Input
                type="time"
                name="DEFAULT_BUSINESS_END_TIME"
                value={hoursConfig.DEFAULT_BUSINESS_END_TIME}
                onChange={handleChange}
              />
            </FormItem>
          </div>
          
          <FormItem
            label="Días de trabajo (1=Lunes, 7=Domingo)"
            helperText="Ingrese los números de los días separados por comas (ej: 1,2,3,4,5)"
            className="mb-4"
          >
            <Input
              type="text"
              name="DEFAULT_BUSINESS_DAYS"
              value={hoursConfig.DEFAULT_BUSINESS_DAYS}
              onChange={handleChange}
              placeholder="1,2,3,4,5"
            />
          </FormItem>
          
          <FormItem
            label="Duración predeterminada de citas (en minutos)"
            className="mb-6"
          >
            <Input
              type="number"
              name="DEFAULT_APPOINTMENT_DURATION"
              value={hoursConfig.DEFAULT_APPOINTMENT_DURATION}
              onChange={handleChange}
              min="15"
              max="480"
              step="15"
            />
          </FormItem>
          
          <Button
            type="submit"
            variant="solid"
            disabled={saving}
            icon={saving ? <Spinner size={20} /> : <FaCog />}
            className="w-full sm:w-auto"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </Form>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-2">Información</h2>
        <p className="text-gray-600 mb-4">
          Esta configuración establece los horarios predeterminados que se utilizarán para nuevos negocios y módulos que requieran planificación de citas.
        </p>
        
        <h3 className="font-medium mb-1">Nota importante:</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>Los días de la semana se representan con números del 1 al 7, donde 1 es Lunes y 7 es Domingo.</li>
          <li>La duración de citas se establece en minutos y afecta cómo se muestran los intervalos disponibles en los calendarios.</li>
          <li>Cada negocio podrá personalizar estos valores en su configuración específica.</li>
        </ul>
      </Card>
    </div>
  );
};

export default BusinessHoursSettingsPage;