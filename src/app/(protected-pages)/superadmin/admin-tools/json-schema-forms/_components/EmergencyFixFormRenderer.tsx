/**
 * frontend/src/app/(protected-pages)/superadmin/admin-tools/json-schema-forms/_components/EmergencyFixFormRenderer.tsx
 * Versión de emergencia del renderizador de formularios JSON, sin usar Checkbox
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Notification } from '@/components/ui/Notification';
import { toast } from '@/components/ui/toast';

/**
 * Componente de emergencia para mostrar mientras se resuelve el problema del Checkbox
 */
const EmergencyFixFormRenderer = () => {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg border border-yellow-200 max-w-xl mx-auto">
            <h3 className="font-bold text-lg mb-2">Mantenimiento en Progreso</h3>
            <p className="mb-3">
              El editor de formularios JSON Schema está temporalmente en mantenimiento para resolver un problema técnico.
            </p>
            <p>
              Estamos trabajando para restablecer la funcionalidad completa lo antes posible. Gracias por su paciencia.
            </p>
          </div>
          
          <Button
            variant="solid"
            color="primary"
            onClick={() => {
              toast.push(
                <Notification title="Notificación de actualización" type="info">
                  Le notificaremos cuando el editor esté disponible nuevamente.
                </Notification>
              );
            }}
          >
            Recibir notificación cuando esté disponible
          </Button>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-4 max-w-xl mx-auto">
            <h4 className="font-semibold mb-2">Alternativas disponibles:</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Utilizar el editor JSON manualmente para crear esquemas</li>
              <li>Utilizar las plantillas predefinidas desde la biblioteca</li>
              <li>Contactar al equipo de soporte para asistencia</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EmergencyFixFormRenderer;
