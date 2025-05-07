'use client';

import React, { useState } from 'react';
import { Card, Button, Tabs } from '@/components/ui';
import { Container } from '@/components/shared';
import BusinessHoursSettings from './_components/BusinessHoursSettings';
import AppointmentSettings from './_components/AppointmentSettings';
import AppointmentTypesSettings from './_components/AppointmentTypesSettings';
import ExceptionsSettings from './_components/ExceptionsSettings';
import LocationsSettings from './_components/LocationsSettings';
import useTranslation from '@/utils/hooks/useTranslation';

const BusinessHoursPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('business-hours');

  return (
    <Container>
      <div className="mb-8">
        <h3 className="mb-2 text-2xl font-bold">
          {t('appointments.settings.title')}
        </h3>
        <p className="text-gray-500">
          {t('appointments.settings.description')}
        </p>
      </div>

      <Card>
        <div className="p-4">
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
              <Tabs.TabNav value="locations">
                {t('appointments.settings.tabs.locations')}
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
            
            <Tabs.TabContent value="locations">
              <LocationsSettings />
            </Tabs.TabContent>
          </Tabs>
        </div>
      </Card>
    </Container>
  );
};

export default BusinessHoursPage;