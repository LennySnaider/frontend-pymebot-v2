'use client';

/**
 * frontend/src/app/(protected-pages)/superadmin/module-editor/_components/ModuleList.tsx
 * Componente de listado de módulos con funcionalidad de tabla.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React, { useState } from 'react';
import Table from '@/components/ui/Table';
const { Tr, Th, Td, THead, TBody } = Table;
import Pagination from '@/components/ui/Pagination';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import { useModuleContext } from '../context/ModuleContext';
import { useTranslations } from 'next-intl';
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams';
import { TbPencil, TbTrash, TbCopy, TbPlug } from 'react-icons/tb';

interface ModuleListProps {
  total: number;
  pageIndex: number;
  pageSize: number;
}

/**
 * Tabla de listado de módulos con acciones
 */
export default function ModuleList({ total, pageIndex, pageSize }: ModuleListProps) {
  const t = useTranslations();
  const { modules, setModuleDialog, getVerticalName } = useModuleContext();
  const { onAppendQueryParams } = useAppendQueryParams();
  
  // Estado local para el módulo a eliminar
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  
  // Manejadores de eventos
  const handlePageChange = (page: number) => {
    onAppendQueryParams({ pageIndex: page });
  };
  
  const handleEditModule = (moduleId: string) => {
    setModuleDialog({
      type: 'edit',
      open: true,
      moduleId,
    });
  };
  
  const handleDeleteModule = (moduleId: string) => {
    setModuleToDelete(moduleId);
    setModuleDialog({
      type: 'delete',
      open: true,
      moduleId,
    });
  };
  
  // Obtener color del badge según el estado
  const getStatusTagClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-0';
      case 'inactive':
        return 'text-amber-600 bg-amber-100 dark:text-amber-100 dark:bg-amber-500/20 border-0';
      case 'draft':
        return 'text-gray-600 bg-gray-100 dark:text-gray-100 dark:bg-gray-500/20 border-0';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-100 dark:bg-gray-500/20 border-0';
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <Table>
        <THead>
          <Tr>
            <Th>{t('common.name')}</Th>
            <Th>{t('common.vertical')}</Th>
            <Th>{t('common.code')}</Th>
            <Th>{t('common.dependencies')}</Th>
            <Th>{t('common.status')}</Th>
            <Th>{t('common.actions')}</Th>
          </Tr>
        </THead>
        <TBody>
          {modules.length === 0 ? (
            <Tr>
              <Td colSpan={6} className="text-center py-8">
                {t('common.no_modules_found')}
              </Td>
            </Tr>
          ) : (
            modules.map((module) => (
              <Tr key={module.id}>
                <Td className="font-medium">{module.name}</Td>
                <Td>{getVerticalName(module.verticalId)}</Td>
                <Td>
                  <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs">
                    {module.code}
                  </code>
                </Td>
                <Td>
                  {module.dependencies?.length ? (
                    <div className="flex items-center gap-1">
                      <TbPlug className="text-gray-500" />
                      <span>{module.dependencies.length}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">{t('common.none')}</span>
                  )}
                </Td>
                <Td>
                  <Tag className={getStatusTagClass(module.status)}>
                    {t(`common.${module.status}`)}
                  </Tag>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="plain"
                      size="xs"
                      icon={<TbPencil />}
                      onClick={() => handleEditModule(module.id)}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="plain"
                      size="xs"
                      icon={<TbCopy />}
                      onClick={() => {/* TODO: Implementar duplicación */}}
                    >
                      {t('common.duplicate')}
                    </Button>
                    <Button
                      variant="plain"
                      size="xs"
                      icon={<TbTrash />}
                      onClick={() => handleDeleteModule(module.id)}
                      customColorClass={() => 'text-error hover:text-error'}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </TBody>
      </Table>
      
      {total > 0 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
