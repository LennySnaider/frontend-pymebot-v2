/**
 * frontend/src/app/(protected-pages)/superadmin/module-editor/page.tsx
 * Página principal del editor de módulos para superadmin.
 * Permite crear, editar y configurar módulos para distintas verticales.
 * @version 1.0.0
 * @updated 2025-05-01
 */

import React from 'react';
import Container from '@/components/shared/Container';
import { getTranslations } from 'next-intl/server';
import { ModuleProvider } from './context/ModuleContext';
import ModuleList from './_components/ModuleList';
import ModuleEditorHeader from './_components/ModuleEditorHeader';
import ModuleDialog from './_components/ModuleDialog';
import DeleteModuleDialog from './_components/DeleteModuleDialog';
import RoleGate from '@/components/core/permissions/RoleGate';
import getModules from '@/server/actions/getModules';
import getVerticals from '@/server/actions/getVerticals';
import type { PageProps } from '@/@types/common';

export default async function ModuleEditorPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations();
  
  // Obtener la lista de módulos
  const modules = await getModules(params);
  
  // Obtener la lista de verticales para poder asociar módulos
  const verticals = await getVerticals({ status: 'active' });
  
  return (
    <RoleGate
      role="super_admin"
    >
      <ModuleProvider 
        initialModules={modules.list} 
        verticals={verticals.list}
        params={params}
      >
        <Container>
          <ModuleEditorHeader />
          
          <div className="mt-8">
            <ModuleList 
              total={modules.total}
              pageIndex={parseInt(params.pageIndex as string) || 1}
              pageSize={parseInt(params.pageSize as string) || 10}
            />
          </div>
          
          {/* Diálogos modales para crear/editar/eliminar módulos */}
          <ModuleDialog />
          <DeleteModuleDialog />
        </Container>
      </ModuleProvider>
    </RoleGate>
  );
}
