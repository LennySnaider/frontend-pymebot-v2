'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Dialog, Input, Notification, toast, Table, Tag, Badge, Form, FormItem } from '@/components/ui';
import { BusinessLocation } from '@/app/api/appointments/settings/types';
import useTranslation from '@/utils/hooks/useTranslation';

// Implementación simple para el componente de ubicaciones
// En una fase posterior, se debería integrar con un servicio de geocodificación
// para obtener coordenadas a partir de direcciones

const LocationsSettings = () => {
  const { t } = useTranslation();
  
  return (
    <div className="p-4">
      <div className="mb-6">
        <h4 className="mb-4 text-lg font-semibold">
          {t('appointments.locations.title')}
        </h4>
        <p className="mb-4 text-gray-500">
          {t('appointments.locations.description')}
        </p>
      </div>
      
      <Card className="p-6 text-center">
        <h5 className="mb-4 text-lg font-semibold">
          {t('appointments.locations.coming_soon')}
        </h5>
        <p className="text-gray-500">
          {t('appointments.locations.future_feature')}
        </p>
        <div className="mt-6">
          <Badge color="purple">
            {t('appointments.locations.phase_3')}
          </Badge>
        </div>
      </Card>
    </div>
  );
};

export default LocationsSettings;