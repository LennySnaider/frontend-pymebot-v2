'use client'

import React, { useState } from 'react';
import { Tabs } from '@/components/ui';
import BusinessHoursSettings from './BusinessHours/BusinessHoursSettings';
import AppointmentSettings from './BusinessHours/AppointmentSettings';
import AppointmentTypesSettings from './BusinessHours/AppointmentTypesSettings';
import ExceptionsSettings from './BusinessHours/ExceptionsSettings';

// Función temporal para traducciones mientras solucionamos el problema
const mockTranslation = (key: string) => {
  const translations: Record<string, string> = {
    'appointments.settings.title': 'Configuración de Horarios del Negocio',
    'appointments.settings.description': 'Configure los horarios de atención, excepciones y tipos de citas para su negocio.',
    'appointments.settings.tabs.business_hours': 'Horarios',
    'appointments.settings.tabs.exceptions': 'Excepciones',
    'appointments.settings.tabs.appointment_settings': 'Configuración de Citas',
    'appointments.settings.tabs.appointment_types': 'Tipos de Cita'
  };
  
  return translations[key] || key.split('.').pop() || key;
};

const SettingsBusinessHours = () => {
  const [activeTab, setActiveTab] = useState('business-hours');
  
  // Función t para sustituir useTranslation temporalmente
  const t = mockTranslation;

  return (
    <div className="mb-8">
      <h3 className="mb-2 text-2xl font-bold">
        {t('appointments.settings.title')}
      </h3>
      <p className="text-gray-500 mb-6">
        {t('appointments.settings.description')}
      </p>

      <Tabs value={activeTab} onChange={(val) => setActiveTab(val)}>
        <Tabs.TabList>
          <Tabs.TabNav value="business-hours">
            {t('appointments.settings.tabs.business_hours')}
          </Tabs.TabNav>
          <Tabs.TabNav value="exceptions">
            {t('appointments.settings.tabs.exceptions')}
          </Tabs.TabNav>
          <Tabs.TabNav value="appointment-settings">
            {t('appointments.settings.tabs.appointment_settings')}
          </Tabs.TabNav>
          <Tabs.TabNav value="appointment-types">
            {t('appointments.settings.tabs.appointment_types')}
          </Tabs.TabNav>
        </Tabs.TabList>
        
        <Tabs.TabContent value="business-hours">
          <BusinessHoursSettings />
        </Tabs.TabContent>
        
        <Tabs.TabContent value="exceptions">
          <ExceptionsSettings />
        </Tabs.TabContent>
        
        <Tabs.TabContent value="appointment-settings">
          <AppointmentSettings />
        </Tabs.TabContent>
        
        <Tabs.TabContent value="appointment-types">
          <AppointmentTypesSettings />
        </Tabs.TabContent>
      </Tabs>
    </div>
  );
};

export default SettingsBusinessHours;