'use client';

/**
 * frontend/src/app/(protected-pages)/superadmin/module-editor/_components/ModuleInfoDrawer.tsx
 * Drawer informativo para el Editor de Módulos que explica su uso y funcionalidades principales.
 * @version 1.0.0
 * @updated 2025-05-01
 */

import React from 'react';
import { Drawer, Button } from '@/components/ui';
import { useTranslations } from 'next-intl';
import { 
  TbInfoCircle, 
  TbPuzzle, 
  TbTools,
  TbPlugConnected 
} from 'react-icons/tb';

interface ModuleInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Drawer con información de ayuda sobre el Editor de Módulos
 */
export default function ModuleInfoDrawer({ isOpen, onClose }: ModuleInfoDrawerProps) {
  const t = useTranslations();

  return (
    <Drawer
      title={t('moduleEditor.infoDrawer.title', 'Acerca del Editor de Módulos')}
      isOpen={isOpen}
      onClose={onClose}
      onRequestClose={onClose}
      width={580}
    >
      <div className="p-4">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-primary-500/10 p-3 rounded-lg">
            <TbPuzzle className="text-primary-500 w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t('moduleEditor.infoDrawer.description', 'Gestiona módulos globales del sistema que pueden ser utilizados en diferentes verticales. Define características, configuraciones, y dependencias entre módulos.')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
              <TbInfoCircle className="w-5 h-5 mr-2 text-sky-500" />
              {t('moduleEditor.infoDrawer.whatAreModulesTitle', '¿Qué son los Módulos?')}
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 pl-6 list-disc">
              <li>
                {t('moduleEditor.infoDrawer.whatAreModulesPoint1', 'Bloques funcionales reutilizables que se integran en distintas verticales de negocio.')}
              </li>
              <li>
                {t('moduleEditor.infoDrawer.whatAreModulesPoint2', 'Cada módulo tiene configuraciones específicas que determinan su comportamiento.')}
              </li>
              <li>
                {t('moduleEditor.infoDrawer.whatAreModulesPoint3', 'Los módulos pueden tener dependencias con otros módulos para funcionar correctamente.')}
              </li>
              <li>
                {t('moduleEditor.infoDrawer.whatAreModulesPoint4', 'Se pueden activar o desactivar según el plan contratado o las necesidades del tenant.')}
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
              <TbTools className="w-5 h-5 mr-2 text-blue-500" />
              {t('moduleEditor.infoDrawer.administrationTitle', 'Administración')}
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 pl-6 list-disc">
              <li>
                {t('moduleEditor.infoDrawer.administrationPoint1', 'Crear, editar y eliminar módulos del sistema.')}
              </li>
              <li>
                {t('moduleEditor.infoDrawer.administrationPoint2', 'Organizar módulos por verticales y categorías.')}
              </li>
              <li>
                {t('moduleEditor.infoDrawer.administrationPoint3', 'Definir esquemas de configuración con validación de tipos.')}
              </li>
              <li>
                {t('moduleEditor.infoDrawer.administrationPoint4', 'Establecer dependencias entre módulos para garantizar su funcionamiento correcto.')}
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
              <TbPlugConnected className="w-5 h-5 mr-2 text-green-500" />
              {t('moduleEditor.infoDrawer.relationshipsTitle', 'Relaciones entre Módulos')}
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 pl-6 list-disc">
              <li>
                {t('moduleEditor.infoDrawer.relationshipsPoint1', 'Las dependencias garantizan que todos los módulos necesarios estén activados.')}
              </li>
              <li>
                {t('moduleEditor.infoDrawer.relationshipsPoint2', 'El sistema aplica automáticamente estas restricciones al asignar módulos a planes o tenants.')}
              </li>
              <li>
                {t('moduleEditor.infoDrawer.relationshipsPoint3', 'Al desactivar un módulo, el sistema verifica que no rompa dependencias de otros módulos.')}
              </li>
              <li>
                {t('moduleEditor.infoDrawer.relationshipsPoint4', 'Se pueden visualizar las relaciones entre módulos para entender mejor la arquitectura del sistema.')}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            variant="solid"
            onClick={onClose}
          >
            {t('moduleEditor.infoDrawer.closeButton', 'Entendido')}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
