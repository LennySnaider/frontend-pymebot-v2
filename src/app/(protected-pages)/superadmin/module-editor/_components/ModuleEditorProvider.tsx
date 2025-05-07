'use client';

/**
 * frontend/src/app/(protected-pages)/superadmin/module-editor/_components/ModuleEditorProvider.tsx
 * Proveedor de contexto para el editor de módulos.
 * Gestiona el estado compartido entre componentes del editor.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams';
import type { Module, Vertical } from '@/@types/superadmin';

interface FilterData {
  vertical: string;
  status: string;
  query: string;
}

interface DialogState {
  type: 'new' | 'edit' | 'delete' | '';
  open: boolean;
  moduleId?: string;
}

interface ModuleEditorContextType {
  // Estado
  modules: Module[];
  verticals: Vertical[];
  selectedModule: string;
  filterData: FilterData;
  moduleDialog: DialogState;
  
  // Acciones
  setModules: (modules: Module[]) => void;
  setSelectedModule: (id: string) => void;
  setFilterData: (data: Partial<FilterData>) => void;
  setModuleDialog: (dialog: DialogState) => void;
  
  // Helpers
  getModuleById: (id: string) => Module | undefined;
  getVerticalById: (id: string) => Vertical | undefined;
  getVerticalName: (id: string) => string;
}

// Valor por defecto para el contexto
const defaultFilterData: FilterData = {
  vertical: '',
  status: '',
  query: '',
};

// Crear el contexto
const ModuleEditorContext = createContext<ModuleEditorContextType | undefined>(undefined);

interface ModuleEditorProviderProps {
  children: ReactNode;
  initialModules: Module[];
  verticals: Vertical[];
  params: Record<string, string>;
}

/**
 * Proveedor de contexto para compartir estado entre componentes del editor de módulos
 */
export default function ModuleEditorProvider({
  children,
  initialModules,
  verticals,
  params,
}: ModuleEditorProviderProps) {
  // Estado local
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [moduleDialog, setModuleDialog] = useState<DialogState>({
    type: '',
    open: false,
  });
  
  // Filtros
  const [filterData, setFilterDataState] = useState<FilterData>({
    vertical: params.vertical as string || defaultFilterData.vertical,
    status: params.status as string || defaultFilterData.status,
    query: params.query as string || defaultFilterData.query,
  });
  
  // Hook para actualizar la URL
  const { onAppendQueryParams } = useAppendQueryParams();
  
  // Función para actualizar filtros y URL
  const setFilterData = (data: Partial<FilterData>) => {
    const newFilterData = { ...filterData, ...data };
    setFilterDataState(newFilterData);
    
    // Actualizar la URL
    onAppendQueryParams({
      ...data,
      pageIndex: 1, // Resetear a primera página al filtrar
    });
  };
  
  // Helpers para búsqueda por ID
  const getModuleById = (id: string) => modules.find(module => module.id === id);
  const getVerticalById = (id: string) => verticals.find(vertical => vertical.id === id);
  const getVerticalName = (id: string) => {
    const vertical = getVerticalById(id);
    return vertical ? vertical.name : 'Unknown';
  };
  
  // Memoizar el valor del contexto
  const contextValue = useMemo(() => ({
    modules,
    verticals,
    selectedModule,
    filterData,
    moduleDialog,
    setModules,
    setSelectedModule,
    setFilterData,
    setModuleDialog,
    getModuleById,
    getVerticalById,
    getVerticalName,
  }), [
    modules,
    verticals,
    selectedModule,
    filterData,
    moduleDialog,
  ]);
  
  return (
    <ModuleEditorContext.Provider value={contextValue}>
      {children}
    </ModuleEditorContext.Provider>
  );
}

/**
 * Hook personalizado para acceder al contexto del editor de módulos
 */
export function useModuleEditor() {
  const context = useContext(ModuleEditorContext);
  
  if (!context) {
    throw new Error('useModuleEditor must be used within a ModuleEditorProvider');
  }
  
  return context;
}
