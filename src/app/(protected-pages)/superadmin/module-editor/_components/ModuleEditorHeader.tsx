'use client';

/**
 * frontend/src/app/(protected-pages)/superadmin/module-editor/_components/ModuleEditorHeader.tsx
 * Componente de encabezado para el editor de módulos.
 * Contiene el título y acciones principales.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React, { useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import DebouceInput from '@/components/shared/DebouceInput';
import { useModuleContext } from '../context/ModuleContext';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { TbPlus, TbSearch, TbInfoCircle } from 'react-icons/tb';
import { SafeSelect } from '@/components/shared/safe-components';
import ModuleInfoDrawer from './ModuleInfoDrawer';

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Draft', value: 'draft' },
];

/**
 * Encabezado del editor de módulos con acciones y filtros
 */
export default function ModuleEditorHeader() {
  const t = useTranslations();
  const {
    verticals,
    setModuleDialog,
    filterData,
    setFilterData,
  } = useModuleContext();
  
  // Estado para controlar el drawer de información
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  
  // Opciones para el selector de verticales
  const verticalOptions = useMemo(() => {
    const options = [{ label: 'All Verticals', value: '' }];
    
    verticals.forEach(vertical => {
      options.push({
        label: vertical.name,
        value: vertical.id,
      });
    });
    
    return options;
  }, [verticals]);
  
  // Manejadores de eventos
  const handleCreateModule = () => {
    setModuleDialog({
      type: 'new',
      open: true,
    });
  };
  
  const handleVerticalFilter = (verticalId: string) => {
    setFilterData({ vertical: verticalId });
  };
  
  const handleStatusFilter = (status: string) => {
    setFilterData({ status });
  };
  
  const handleSearch = (query: string) => {
    setFilterData({ query });
  };
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('common.module_editor')}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="solid"
            onClick={handleCreateModule}
            icon={<TbPlus />}
          >
            {t('common.create_module')}
          </Button>
          <Button
            shape="circle"
            variant="plain"
            size="sm"
            icon={<TbInfoCircle className="text-lg" />}
            onClick={() => setInfoDrawerOpen(true)}
            title={t('moduleEditor.helpButtonTitle', 'Ayuda')}
          />
        </div>
      </div>
      
      {/* Drawer informativo */}
      <ModuleInfoDrawer 
        isOpen={infoDrawerOpen} 
        onClose={() => setInfoDrawerOpen(false)} 
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <DebouceInput
          placeholder={t('common.search')}
          prefix={<TbSearch className="text-lg" />}
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={filterData.query}
          className="w-full sm:max-w-xs"
          size="sm"
        />
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Usar SafeSelect para evitar errores de hidratación */}
          <SafeSelect
            options={verticalOptions}
            value={verticalOptions.find(
              opt => opt.value === filterData.vertical
            )}
            onChange={(option) => handleVerticalFilter(option?.value || '')}
            className="min-w-[150px]"
            placeholder={t('common.vertical')}
            size="sm"
          />
          
          <SafeSelect
            options={statusOptions}
            value={statusOptions.find(
              opt => opt.value === filterData.status
            )}
            onChange={(option) => handleStatusFilter(option?.value || '')}
            className="min-w-[150px]"
            placeholder={t('common.status')}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
