'use client';

import React, { useState } from 'react';
import { Card, Tabs } from '@/components/ui';
import { Container } from '@/components/shared';
import BusinessHoursSettings from './BusinessHoursSettings';
import ExceptionsSettings from './ExceptionsSettings';
import AppointmentSettings from './AppointmentSettings';
import useTranslation from '@/utils/hooks/useTranslation';

export interface BusinessHoursPageProps {
  className?: string;
  showHeader?: boolean;
  defaultTab?: string;
  allowTabChange?: boolean;
}

const BusinessHoursPage = ({
  className,
  showHeader = true,
  defaultTab = 'business-hours',
  allowTabChange = true,
}: BusinessHoursPageProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (value: string) => {
    if (allowTabChange) {
      setActiveTab(value);
    }
  };

  return (
    <div className={className}>
      {showHeader && (
        <div className="mb-8">
          <h3 className="mb-2 text-2xl font-bold">
            {t('appointments.settings.title')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t('appointments.settings.description')}
          </p>
        </div>
      )}

      <Card>
        <div className="p-4">
          <Tabs value={activeTab} onChange={handleTabChange}>
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
            </Tabs.TabList>
            
            <Tabs.TabContent value="business-hours" className="pt-5">
              <BusinessHoursSettings />
            </Tabs.TabContent>
            
            <Tabs.TabContent value="exceptions" className="pt-5">
              <ExceptionsSettings />
            </Tabs.TabContent>
            
            <Tabs.TabContent value="appointment-settings" className="pt-5">
              <AppointmentSettings />
            </Tabs.TabContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};

export default BusinessHoursPage;
