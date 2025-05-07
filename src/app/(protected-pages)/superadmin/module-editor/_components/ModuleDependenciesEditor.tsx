'use client';

/**
 * frontend/src/app/(protected-pages)/superadmin/module-editor/_components/ModuleDependenciesEditor.tsx
 * Editor para gestionar las dependencias entre módulos.
 * Permite seleccionar qué módulos son requeridos para el funcionamiento del módulo actual.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React, { useState, useMemo, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { toast } from '@/components/ui/toast';
import { Notification } from '@/components/ui/Notification';
import { useTranslations } from 'next-intl';
import { TbAlertCircle, TbPlugConnected, TbInfoCircle, TbTrash, TbPlus } from 'react-icons/tb';
import { SafeSelect } from '@/components/shared/safe-components';
import type { Module } from '@/@types/superadmin';

interface ModuleDependenciesEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
  allModules: Module[];
  currentModuleId?: string;
}

/**
 * Editor para gestionar dependencias entre módulos
 */
export default function ModuleDependenciesEditor({
  value = [],
  onChange,
  allModules = [],
  currentModuleId,
}: ModuleDependenciesEditorProps) {
  const t = useTranslations();
  const [selectedModule, setSelectedModule] = useState<string>('');
  
  // Filtrar el módulo actual y los que ya son dependencias
  const availableModules = useMemo(() => {
    return allModules.filter(module => 
      module.id !== currentModuleId && 
      !value.includes(module.id)
    );
  }, [allModules, currentModuleId, value]);
  
  // Opciones para el selector de módulos
  const moduleOptions = useMemo(() => {
    return availableModules.map(module => ({
      label: module.name,
      value: module.id,
      // Añadir información adicional para mostrar en el selector
      data: {
        code: module.code,
        verticalId: module.verticalId,
      }
    }));
  }, [availableModules]);
  
  // Verificar dependencias circulares
  const checkCircularDependencies = (moduleId: string): boolean => {
    // Obtener el módulo seleccionado
    const module = allModules.find(m => m.id === moduleId);
    if (!module) return false;
    
    // Si el módulo actual ya depende del módulo seleccionado, habría dependencia circular
    if (module.dependencies?.includes(currentModuleId || '')) {
      return true;
    }
    
    // Comprobar recursivamente las dependencias del módulo seleccionado
    const checkRecursive = (depId: string, visited: Set<string> = new Set()): boolean => {
      if (visited.has(depId)) return false;
      visited.add(depId);
      
      const depModule = allModules.find(m => m.id === depId);
      if (!depModule) return false;
      
      if (depModule.dependencies?.includes(currentModuleId || '')) {
        return true;
      }
      
      return depModule.dependencies?.some(id => checkRecursive(id, visited)) || false;
    };
    
    return module.dependencies?.some(id => checkRecursive(id)) || false;
  };
  
  // Añadir dependencia
  const handleAddDependency = () => {
    if (!selectedModule) return;
    
    // Verificar dependencias circulares
    if (checkCircularDependencies(selectedModule)) {
      toast.push(
        <Notification title="Error" type="danger">
          No se puede añadir este módulo como dependencia ya que crearía una dependencia circular
        </Notification>
      );
      return;
    }
    
    // Añadir a la lista de dependencias
    const newDependencies = [...value, selectedModule];
    onChange(newDependencies);
    setSelectedModule('');
  };
  
  // Eliminar dependencia
  const handleRemoveDependency = (moduleId: string) => {
    const newDependencies = value.filter(id => id !== moduleId);
    onChange(newDependencies);
  };
  
  // Obtener detalles de un módulo por ID
  const getModuleDetails = (moduleId: string) => {
    return allModules.find(module => module.id === moduleId);
  };

  return (
    <div className="space-y-6">
      {/* Selector de módulos para añadir dependencia */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <SafeSelect
              options={moduleOptions}
              value={moduleOptions.find(opt => opt.value === selectedModule)}
              onChange={(option) => setSelectedModule(option?.value || '')}
              placeholder="Select a module to add as dependency"
              isDisabled={moduleOptions.length === 0}
              formatOptionLabel={(option) => (
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                    {option.data?.code}
                  </code>
                </div>
              )}
            />
          </div>
          <Button
            variant="solid"
            onClick={handleAddDependency}
            disabled={!selectedModule}
            icon={<TbPlus />}
          >
            Add Dependency
          </Button>
        </div>
        
        {moduleOptions.length === 0 && (
          <div className="flex items-center gap-2 mt-4 text-amber-500 text-sm">
            <TbInfoCircle />
            <span>
              No available modules to add as dependencies. Either all modules are already 
              added or there are no other modules defined.
            </span>
          </div>
        )}
      </Card>
      
      {/* Lista de dependencias actuales */}
      <div className="space-y-4">
        {value.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-lg border-gray-300 dark:border-gray-600">
            <div className="flex flex-col items-center gap-2">
              <TbPlugConnected className="text-3xl text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                No dependencies added yet. This module will function independently.
              </p>
            </div>
          </div>
        ) : (
          value.map(moduleId => {
            const module = getModuleDetails(moduleId);
            
            return (
              <Card key={moduleId} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">{module?.name || 'Unknown Module'}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                        {module?.code || 'unknown'}
                      </code>
                      <Badge className={
                        module?.status === 'active' ? 'bg-success' : 
                        module?.status === 'inactive' ? 'bg-warning' : 'bg-gray-500'
                      }>
                        {module?.status || 'unknown'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {module?.description || 'No description available'}
                    </p>
                  </div>
                  <Button
                    variant="plain"
                    icon={<TbTrash />}
                    onClick={() => handleRemoveDependency(moduleId)}
                    customColorClass={() => 'text-error hover:text-error'}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
      
      {/* Información adicional */}
      <div className="flex items-start gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
        <TbAlertCircle className="text-amber-500 mt-0.5" />
        <div>
          <h5 className="font-medium text-amber-500">About Dependencies</h5>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            When a module has dependencies, those modules must be enabled for this module to function.
            If you add dependencies, the system will automatically enforce this relationship when
            assigning modules to plans or tenants.
          </p>
        </div>
      </div>
    </div>
  );
}
