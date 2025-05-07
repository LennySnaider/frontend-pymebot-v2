'use client';

/**
 * frontend/src/app/(protected-pages)/superadmin/module-editor/_components/ModuleDialog.tsx
 * Diálogo para crear o editar módulos.
 * Incluye formulario con validaciones y editor de configuración JSON.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React, { useEffect, useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Form, FormItem } from '@/components/ui/Form';
import { useModuleContext } from '../context/ModuleContext';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Select from '@/components/ui/Select';
import Tabs from '@/components/ui/tabs';
const { TabNav, TabList, TabContent } = Tabs;
import CodeEditor from '@/components/shared/CodeEditor';
import JsonSchemaEditor from './JsonSchemaEditor';
import ModuleDependenciesEditor from './ModuleDependenciesEditor';
import { toast } from '@/components/ui/toast';
import { Notification } from '@/components/ui/Notification';
import { SafeSelect } from '@/components/shared/safe-components';
import { TbAlertTriangle } from 'react-icons/tb';
import type { Module } from '@/@types/superadmin';

// Esquema de validación para el formulario
const moduleSchema = z.object({
  name: z.string().min(3, 'Module name must be at least 3 characters'),
  code: z.string().min(2, 'Module code must be at least 2 characters')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers and underscores allowed'),
  description: z.string().optional(),
  verticalId: z.string().min(1, 'Vertical is required'),
  status: z.enum(['active', 'inactive', 'draft']),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format x.y.z'),
  icon: z.string().optional(),
  configSchema: z.any().optional(),
  dependencies: z.array(z.string()).optional(),
});

type ModuleFormData = z.infer<typeof moduleSchema>;

/**
 * Diálogo para crear o editar módulos con formulario completo
 */
export default function ModuleDialog() {
  const t = useTranslations();
  const {
    moduleDialog,
    setModuleDialog,
    modules,
    setModules,
    verticals,
    getModuleById,
  } = useModuleContext();
  
  // Estado para esquema JSON
  const [configSchema, setConfigSchema] = useState<object>({});
  
  // Estado para dependencias
  const [dependencies, setDependencies] = useState<string[]>([]);
  
  // Configuración del formulario con React Hook Form
  const { 
    control, 
    handleSubmit, 
    reset, 
    setValue,
    formState: { errors } 
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      verticalId: '',
      status: 'draft',
      version: '1.0.0',
      icon: 'TbBox',
      configSchema: {},
      dependencies: [],
    }
  });
  
  // Cargar datos del módulo si es edición
  useEffect(() => {
    if (moduleDialog.type === 'edit' && moduleDialog.moduleId) {
      const module = getModuleById(moduleDialog.moduleId);
      
      if (module) {
        reset({
          name: module.name,
          code: module.code,
          description: module.description || '',
          verticalId: module.verticalId,
          status: module.status as 'active' | 'inactive' | 'draft',
          version: module.version,
          icon: module.icon || 'TbBox',
        });
        
        // Establecer esquema y dependencias
        setConfigSchema(module.configSchema || {});
        setDependencies(module.dependencies || []);
      }
    } else {
      // Reset para creación
      reset({
        name: '',
        code: '',
        description: '',
        verticalId: '',
        status: 'draft',
        version: '1.0.0',
        icon: 'TbBox',
        configSchema: {},
        dependencies: [],
      });
      setConfigSchema({});
      setDependencies([]);
    }
  }, [moduleDialog.type, moduleDialog.moduleId, getModuleById, reset]);
  
  // Sincronizar esquema y dependencias con el formulario
  useEffect(() => {
    setValue('configSchema', configSchema);
    setValue('dependencies', dependencies);
  }, [configSchema, dependencies, setValue]);
  
  // Opciones para selección
  const verticalOptions = verticals.map(vertical => ({
    label: vertical.name,
    value: vertical.id,
  }));
  
  const statusOptions = [
    { label: t('moduleEditor.active'), value: 'active' },
    { label: t('moduleEditor.inactive'), value: 'inactive' },
    { label: t('moduleEditor.draft'), value: 'draft' },
  ];
  
  // Manejadores de eventos
  const handleClose = () => {
    setModuleDialog({
      type: '',
      open: false,
    });
  };
  
  const handleSave = (data: ModuleFormData) => {
    try {
      // Combinar datos del formulario con esquema y dependencias
      const moduleData: Module = {
        ...data,
        id: moduleDialog.moduleId || `module-${Date.now()}`,
        configSchema,
        dependencies,
      };
      
      if (moduleDialog.type === 'edit' && moduleDialog.moduleId) {
        // Actualizar módulo existente
        const updatedModules = modules.map(module => 
          module.id === moduleDialog.moduleId ? moduleData : module
        );
        setModules(updatedModules);
        toast.push(
          <Notification title={t('moduleEditor.module_updated')} type="success">
            {t('moduleEditor.module_updated_message', { name: data.name })}
          </Notification>
        );
      } else {
        // Crear nuevo módulo
        setModules([...modules, moduleData]);
        toast.push(
          <Notification title={t('moduleEditor.module_created')} type="success">
            {t('moduleEditor.module_created_message', { name: data.name })}
          </Notification>
        );
      }
      
      // Cerrar diálogo
      handleClose();
      
      // Aquí se agregaría la lógica para guardar en la API
      // saveModuleToDatabase(moduleData);
    } catch (error) {
      console.error('Error saving module:', error);
      toast.push(
        <Notification title={t('moduleEditor.error_saving_module')} type="danger" duration={5000}>
          {t('moduleEditor.error_saving_module_message')}
        </Notification>
      );
    }
  };
  
  return (
    <Dialog
      isOpen={moduleDialog.open && moduleDialog.type !== 'delete'}
      width={1200}
      onClose={handleClose}
      onRequestClose={handleClose}
      contentClassName="max-h-[90vh] overflow-y-auto"
    >
      <h4>
        {moduleDialog.type === 'edit' ? t('moduleEditor.edit_module') : t('moduleEditor.create_module')}
      </h4>
      
      <Tabs defaultValue="general">
        <TabList>
          <TabNav value="general">{t('moduleEditor.general')}</TabNav>
          <TabNav value="schema">{t('moduleEditor.configuration_schema')}</TabNav>
          <TabNav value="dependencies">{t('moduleEditor.dependencies')}</TabNav>
        </TabList>
        
        <div className="p-4">
          <TabContent value="general">
          <Form onSubmit={handleSubmit(handleSave)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem
                label={t('moduleEditor.module_name')}
                invalid={!!errors.name}
                errorMessage={errors.name?.message}
              >
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input {...field} />}
                />
              </FormItem>
              
              <FormItem
                label={t('moduleEditor.module_code')}
                invalid={!!errors.code}
                errorMessage={errors.code?.message}
              >
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => <Input {...field} />}
                />
              </FormItem>
              
              <FormItem
                label={t('moduleEditor.vertical')}
                invalid={!!errors.verticalId}
                errorMessage={errors.verticalId?.message}
              >
                <Controller
                  name="verticalId"
                  control={control}
                  render={({ field }) => (
                    <SafeSelect
                      {...field}
                      options={verticalOptions}
                      value={verticalOptions.find(
                        opt => opt.value === field.value
                      )}
                      onChange={(option) => field.onChange(option?.value || '')}
                    />
                  )}
                />
              </FormItem>
              
              <FormItem
                label={t('moduleEditor.status')}
                invalid={!!errors.status}
                errorMessage={errors.status?.message}
              >
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <SafeSelect
                      {...field}
                      options={statusOptions}
                      value={statusOptions.find(
                        opt => opt.value === field.value
                      )}
                      onChange={(option) => 
                        field.onChange(option?.value as 'active' | 'inactive' | 'draft' || 'draft')
                      }
                    />
                  )}
                />
              </FormItem>
              
              <FormItem
                label={t('moduleEditor.version')}
                invalid={!!errors.version}
                errorMessage={errors.version?.message}
              >
                <Controller
                  name="version"
                  control={control}
                  render={({ field }) => <Input {...field} />}
                />
              </FormItem>
              
              <FormItem
                label={t('moduleEditor.icon')}
                invalid={!!errors.icon}
                errorMessage={errors.icon?.message}
              >
                <Controller
                  name="icon"
                  control={control}
                  render={({ field }) => <Input {...field} />}
                />
              </FormItem>
              
              <FormItem
                label={t('moduleEditor.description')}
                invalid={!!errors.description}
                errorMessage={errors.description?.message}
                className="col-span-1 md:col-span-2"
              >
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => <Input {...field} textArea />}
                />
              </FormItem>
            </div>
          </Form>
          </TabContent>
          <TabContent value="schema">
          <div className="mb-2">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <TbAlertTriangle />
              <span className="text-sm">
                {t('moduleEditor.configuration_schema_description')}
              </span>
            </div>
            <div className="editor-container" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <JsonSchemaEditor
                value={configSchema}
                onChange={setConfigSchema}
              />
            </div>
          </div>
          </TabContent>
          <TabContent value="dependencies">
          <div className="mb-2">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <TbAlertTriangle />
              <span className="text-sm">
                {t('moduleEditor.dependencies_description')}
              </span>
            </div>
            <ModuleDependenciesEditor
              value={dependencies}
              onChange={setDependencies}
              allModules={modules}
              currentModuleId={moduleDialog.moduleId}
            />
          </div>
          </TabContent>
        </div>
      </Tabs>
      
      <div className="flex justify-end mt-6">
        <Button
          className="ltr:mr-2 rtl:ml-2"
          variant="plain"
          onClick={handleClose}
        >
          {t('moduleEditor.cancel')}
        </Button>
        <Button
          variant="solid"
          onClick={handleSubmit(handleSave)}
        >
          {moduleDialog.type === 'edit' ? t('moduleEditor.update') : t('moduleEditor.create')}
        </Button>
      </div>
    </Dialog>
  );
}
