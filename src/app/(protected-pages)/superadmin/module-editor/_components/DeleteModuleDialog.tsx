'use client';

/**
 * frontend/src/app/(protected-pages)/superadmin/module-editor/_components/DeleteModuleDialog.tsx
 * Diálogo de confirmación para eliminar módulos.
 * Incluye comprobación de dependencias y advertencias.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React, { useState, useEffect } from 'react';
import { useModulesStore } from '@/app/(protected-pages)/superadmin/subscription-plans/_store/modulesStore';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { useModuleContext } from '../context/ModuleContext';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/toast';
import { Notification } from '@/components/ui/Notification';
import { TbAlertCircle, TbPlugConnected, TbTrash } from 'react-icons/tb';
import type { Module } from '@/@types/superadmin';

/**
 * Diálogo de confirmación para eliminar módulos con comprobación de dependencias
 */
export default function DeleteModuleDialog() {
  const t = useTranslations();
  const {
    moduleDialog,
    setModuleDialog,
    modules,
    setModules,
    getModuleById,
  } = useModuleContext();
  
  // Acceso al store de módulos para usar la función deleteModule
  const { deleteModule: deleteModuleFromApi } = useModulesStore();
  
  // Estados locales
  const [isDeleting, setIsDeleting] = useState(false);
  const [dependentModules, setDependentModules] = useState<Module[]>([]);
  
  // Buscar módulos que dependen del módulo a eliminar
  useEffect(() => {
    if (moduleDialog.type === 'delete' && moduleDialog.moduleId) {
      const moduleId = moduleDialog.moduleId;
      // Encontrar módulos que dependen del módulo actual
      const dependents = modules.filter(module => 
        module.dependencies?.includes(moduleId)
      );
      setDependentModules(dependents);
    } else {
      setDependentModules([]);
    }
  }, [moduleDialog.type, moduleDialog.moduleId, modules]);
  
  // Obtener detalles del módulo a eliminar
  const moduleToDelete = moduleDialog.moduleId ? getModuleById(moduleDialog.moduleId) : undefined;
  
  // Verificar si el diálogo debe estar abierto
  const isOpen = moduleDialog.open && moduleDialog.type === 'delete';
  
  // Manejadores de eventos
  const handleClose = () => {
    setModuleDialog({
      type: '',
      open: false,
    });
  };
  
  const handleDelete = async () => {
    if (!moduleDialog.moduleId || !moduleToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Llamada al API para eliminar el módulo
      // Esta llamada ahora tiene validaciones sobre planes activos
      await deleteModuleFromApi(moduleDialog.moduleId);
      
      // Eliminar el módulo de la lista local
      const updatedModules = modules.filter(
        module => module.id !== moduleDialog.moduleId
      );
      setModules(updatedModules);
      
      // Mostrar notificación de éxito
      toast.push(
        <Notification title="Módulo Eliminado" type="success">
          Módulo &quot;{moduleToDelete.name}&quot; eliminado correctamente
        </Notification>
      );
      
      // Cerrar diálogo
      handleClose();
    } catch (error) {
      console.error('Error deleting module:', error);
      
      // Mostrar el mensaje específico del error si existe
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Ha ocurrido un error al eliminar el módulo. Por favor, inténtelo de nuevo.';
      
      toast.push(
        <Notification title="Error" type="danger" duration={8000}>
          {errorMessage}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Si no hay módulo a eliminar, no mostrar nada
  if (!moduleToDelete) return null;
  
  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      onRequestClose={handleClose}
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
          <TbTrash className="text-3xl" />
        </div>
        <h4 className="text-lg font-semibold mb-2">
          Delete Module
        </h4>
        <p className="text-gray-500 dark:text-gray-400">
          Are you sure you want to delete &quot;{moduleToDelete.name}&quot;? This action cannot be undone.
        </p>
      </div>
      
      {/* Advertencia de dependencias si existen */}
      {dependentModules.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
          <div className="flex gap-2 items-start">
            <TbAlertCircle className="text-amber-500 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-medium text-amber-700 dark:text-amber-400">
                Warning: Other modules depend on this
              </h5>
              <p className="text-amber-700 dark:text-amber-400 text-sm mb-3">
                The following modules depend on &quot;{moduleToDelete.name}&quot;. Deleting it may cause those modules to malfunction:
              </p>
              <ul className="space-y-1 text-sm">
                {dependentModules.map(module => (
                  <li key={module.id} className="flex items-center gap-1">
                    <TbPlugConnected className="text-amber-500" />
                    <span>{module.name}</span>
                    <code className="ml-1 text-xs bg-amber-100 dark:bg-amber-900/30 px-1 rounded">
                      {module.code}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-2">
        <Button
          variant="plain"
          onClick={handleClose}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          variant="solid"
          customColorClass={() => 'bg-error text-white hover:bg-error-dark'}
          onClick={handleDelete}
          loading={isDeleting}
          icon={<TbTrash />}
        >
          Delete Module
        </Button>
      </div>
    </Dialog>
  );
}
