'use client';

/**
 * frontend/src/app/(protected-pages)/superadmin/module-editor/context/ModuleContext.tsx
 * Contexto mejorado para la gestión de módulos en el editor.
 * Proporciona estado centralizado y acciones para manipular módulos.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { createContext, useContext, ReactNode, useState, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from '@/components/ui/toast';
import { Notification } from '@/components/ui/Notification';
import { Module, Vertical } from '@/@types/superadmin';

// Tipos de filtro
interface FilterData {
  vertical: string;
  status: string;
  query: string;
}

// Estado del diálogo
interface DialogState {
  type: 'new' | 'edit' | 'delete' | '';
  open: boolean;
  moduleId?: string;
}

// Tipo de contexto
interface ModuleContextType {
  // Estado
  modules: Module[];
  verticals: Vertical[];
  selectedModule: string;
  filterData: FilterData;
  moduleDialog: DialogState;
  loading: boolean;
  
  // Acciones
  setModules: (modules: Module[]) => void;
  addModule: (module: Module) => void;
  updateModule: (moduleId: string, updates: Partial<Module>) => void;
  deleteModule: (moduleId: string) => void;
  setSelectedModule: (id: string) => void;
  setFilterData: (data: Partial<FilterData>) => void;
  setModuleDialog: (dialog: DialogState) => void;
  refreshModules: () => Promise<void>;
  
  // Helpers
  getModuleById: (id: string) => Module | undefined;
  getVerticalById: (id: string) => Vertical | undefined;
  getVerticalName: (id: string) => string;
  checkDependencies: (moduleId: string) => string[];
}

// Valor por defecto para el filtro
const defaultFilterData: FilterData = {
  vertical: '',
  status: '',
  query: '',
};

// Crear el contexto
const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

interface ModuleProviderProps {
  children: ReactNode;
  initialModules: Module[];
  verticals: Vertical[];
  params: Record<string, string>;
}

/**
 * Proveedor mejorado para el contexto de módulos
 */
export function ModuleProvider({
  children,
  initialModules,
  verticals,
  params,
}: ModuleProviderProps) {
  // Estado
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [moduleDialog, setModuleDialog] = useState<DialogState>({
    type: '',
    open: false,
  });
  const [loading, setLoading] = useState<boolean>(false);
  
  // Hooks
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Filtros
  const [filterData, setFilterDataInternal] = useState<FilterData>({
    vertical: params.vertical as string || defaultFilterData.vertical,
    status: params.status as string || defaultFilterData.status,
    query: params.query as string || defaultFilterData.query,
  });
  
  // Función para actualizar URL con filtros
  const setFilterData = useCallback((data: Partial<FilterData>) => {
    const newFilterData = { ...filterData, ...data };
    setFilterDataInternal(newFilterData);
    
    // Crear nuevos parámetros de búsqueda
    const newParams = new URLSearchParams(searchParams.toString());
    
    // Agregar/actualizar filtros
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    
    // Resetear a primera página al filtrar
    newParams.set('pageIndex', '1');
    
    // Actualizar URL
    router.push(`${pathname}?${newParams.toString()}`);
  }, [filterData, router, pathname, searchParams]);
  
  // Función para agregar un módulo
  const addModule = useCallback((module: Module) => {
    setModules(prev => [...prev, module]);
    toast.push(
      <Notification title="Módulo Creado" type="success">
        Módulo &quot;{module.name}&quot; creado correctamente
      </Notification>
    );
  }, []);
  
  // Función para actualizar un módulo
  const updateModule = useCallback((moduleId: string, updates: Partial<Module>) => {
    setModules(prev => 
      prev.map(module => 
        module.id === moduleId
          ? { ...module, ...updates }
          : module
      )
    );
    toast.push(
      <Notification title="Módulo Actualizado" type="success">
        Módulo actualizado correctamente
      </Notification>
    );
  }, []);
  
  // Función para eliminar un módulo
  const deleteModule = useCallback((moduleId: string) => {
    // Verificar dependencias antes de eliminar
    const dependentModules = modules.filter(module => 
      module.dependencies?.includes(moduleId)
    );
    
    if (dependentModules.length > 0) {
      toast.push(
        <Notification title="Error" type="danger">
          No se puede eliminar este módulo. Es requerido por {dependentModules.length} otros módulos.
        </Notification>
      );
      return;
    }
    
    setModules(prev => prev.filter(module => module.id !== moduleId));
    toast.push(
      <Notification title="Módulo Eliminado" type="success">
        Módulo eliminado correctamente
      </Notification>
    );
  }, [modules]);
  
  // Función para refrescar módulos (simulada)
  const refreshModules = useCallback(async () => {
    try {
      setLoading(true);
      // En un entorno real, aquí se haría la llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      // No hacemos nada más porque es una simulación
      toast.push(
        <Notification title="Módulos Actualizados" type="success">
          Lista de módulos actualizada correctamente
        </Notification>
      );
    } catch (error) {
      console.error('Error refreshing modules:', error);
      toast.push(
        <Notification title="Error" type="danger">
          Error al actualizar la lista de módulos
        </Notification>
      );
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Funciones auxiliares
  const getModuleById = useCallback((id: string) => 
    modules.find(module => module.id === id),
  [modules]);
  
  const getVerticalById = useCallback((id: string) => 
    verticals.find(vertical => vertical.id === id),
  [verticals]);
  
  const getVerticalName = useCallback((id: string) => {
    const vertical = getVerticalById(id);
    return vertical ? vertical.name : 'Unknown';
  }, [getVerticalById]);
  
  // Verificar módulos que dependen del módulo proporcionado
  const checkDependencies = useCallback((moduleId: string): string[] => {
    return modules
      .filter(module => module.dependencies?.includes(moduleId))
      .map(module => module.id);
  }, [modules]);
  
  // Memoizar valor del contexto
  const contextValue = useMemo(() => ({
    // Estado
    modules,
    verticals,
    selectedModule,
    filterData,
    moduleDialog,
    loading,
    
    // Acciones
    setModules,
    addModule,
    updateModule,
    deleteModule,
    setSelectedModule,
    setFilterData,
    setModuleDialog,
    refreshModules,
    
    // Helpers
    getModuleById,
    getVerticalById,
    getVerticalName,
    checkDependencies,
  }), [
    modules,
    verticals,
    selectedModule,
    filterData,
    moduleDialog,
    loading,
    addModule,
    updateModule,
    deleteModule,
    setFilterData,
    refreshModules,
    getModuleById,
    getVerticalById,
    getVerticalName,
    checkDependencies
  ]);
  
  return (
    <ModuleContext.Provider value={contextValue}>
      {children}
    </ModuleContext.Provider>
  );
}

/**
 * Hook personalizado para acceder al contexto de módulos
 */
export function useModuleContext() {
  const context = useContext(ModuleContext);
  
  if (!context) {
    throw new Error('useModuleContext must be used within a ModuleProvider');
  }
  
  return context;
}
