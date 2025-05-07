/**
 * frontend/src/app/(protected-pages)/superadmin/verticals/[id]/modules/page.tsx
 * Página para gestionar los módulos de una vertical específica.
 * Permite habilitar/deshabilitar módulos y asignarlos a planes.
 *
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { useState, useEffect } from 'react';
import { withPermissionCheck } from '@/components/hoc/withPermissionCheck';
import { useRouter, useParams } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { supabase } from '@/services/supabase/SupabaseClient';

interface Module {
  id: string;
  vertical_id: string;
  code: string;
  name: string;
  description: string;
  icon?: string | null;
  enabled: boolean;
  category?: string | null;
  required_modules?: string[] | null;
  config_schema?: any;
  created_at: string;
  updated_at: string;
}

interface Vertical {
  id: string;
  code: string;
  name: string;
  description: string;
  icon?: string | null;
  enabled: boolean;
  category?: string | null;
}

interface Plan {
  id: string;
  name: string;
  code: string;
  price: number;
  billing_cycle: string;
  enabled: boolean;
}

interface PlanModule {
  plan_id: string;
  module_id: string;
  enabled: boolean;
  restrictions?: any;
}

const ModulesPage = () => {
  const router = useRouter();
  const params = useParams();
  const verticalId = params.id as string;
  
  // Estado para vertical, módulos y planes
  const [vertical, setVertical] = useState<Vertical | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planModules, setPlanModules] = useState<Record<string, Record<string, PlanModule>>>({});
  
  // Estado para UI
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  
  // Cargar datos al montar el componente
  useEffect(() => {
    const loadModulesData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // 1. Cargar información de la vertical
        const { data: vertical, error: verticalError } = await supabase
          .from('verticals')
          .select('*')
          .eq('id', verticalId)
          .single();
        
        if (verticalError) {
          throw new Error('Error al cargar la vertical');
        }
        
        if (!vertical) {
          throw new Error('Vertical no encontrada');
        }
        
        setVertical(vertical);
        
        // 2. Cargar módulos de la vertical
        const { data: modules, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .eq('vertical_id', verticalId)
          .order('name');
        
        if (modulesError) {
          throw new Error('Error al cargar los módulos');
        }
        
        setModules(modules || []);
        
        // Extraer categorías únicas para el filtro
        if (modules) {
          const uniqueCategories = Array.from(
            new Set(modules.map(m => m.category).filter(Boolean))
          ) as string[];
          
          setCategories(uniqueCategories);
        }
        
        // 3. Cargar planes
        const { data: plans, error: plansError } = await supabase
          .from('plans')
          .select('*')
          .eq('enabled', true)
          .order('price');
        
        if (plansError) {
          throw new Error('Error al cargar los planes');
        }
        
        setPlans(plans || []);
        
        // 4. Cargar relaciones plan-módulo
        if (modules && plans) {
          const moduleIds = modules.map(m => m.id);
          const planIds = plans.map(p => p.id);
          
          if (moduleIds.length > 0 && planIds.length > 0) {
            const { data: planModulesData, error: planModulesError } = await supabase
              .from('plan_modules')
              .select('*')
              .in('module_id', moduleIds)
              .in('plan_id', planIds);
            
            if (planModulesError) {
              console.error('Error al cargar relaciones plan-módulo:', planModulesError);
              // No bloqueamos por este error
            }
            
            // Organizar los datos en una estructura anidada para fácil acceso
            // planModules[planId][moduleId] = planModuleData
            const planModulesMap: Record<string, Record<string, PlanModule>> = {};
            
            plans.forEach(plan => {
              planModulesMap[plan.id] = {};
              
              // Inicializar con todos los módulos deshabilitados
              modules.forEach(module => {
                planModulesMap[plan.id][module.id] = {
                  plan_id: plan.id,
                  module_id: module.id,
                  enabled: false,
                  restrictions: {}
                };
              });
            });
            
            // Actualizar con los datos reales
            if (planModulesData) {
              planModulesData.forEach(pm => {
                if (planModulesMap[pm.plan_id] && modules.some(m => m.id === pm.module_id)) {
                  planModulesMap[pm.plan_id][pm.module_id] = pm;
                }
              });
            }
            
            setPlanModules(planModulesMap);
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setLoadError(error instanceof Error ? error.message : 'Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (verticalId) {
      loadModulesData();
    }
  }, [verticalId]);
  
  // Filtrar módulos según categoría y búsqueda
  const filteredModules = modules.filter(module => {
    // Filtrar por categoría
    if (selectedCategory !== 'all' && module.category !== selectedCategory) {
      return false;
    }
    
    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        module.name.toLowerCase().includes(query) ||
        module.code.toLowerCase().includes(query) ||
        module.description.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Manejar cambio de estado de un módulo
  const handleToggleModule = async (moduleId: string, enabled: boolean) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      
      // Actualizar en la base de datos
      const { error } = await supabase
        .from('modules')
        .update({ enabled: !enabled, updated_at: new Date().toISOString() })
        .eq('id', moduleId);
      
      if (error) {
        throw new Error('Error al actualizar el módulo');
      }
      
      // Actualizar estado local
      setModules(prevModules => 
        prevModules.map(m => m.id === moduleId ? { ...m, enabled: !enabled } : m)
      );
      
      // Mostrar mensaje de éxito
      setSuccessMessage('Módulo actualizado correctamente');
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error al actualizar módulo:', error);
      setUpdateError(error instanceof Error ? error.message : 'Error al actualizar módulo');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Manejar cambio de estado de un módulo en un plan
  const handleTogglePlanModule = async (planId: string, moduleId: string, enabled: boolean) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      
      // Verificar si ya existe la relación plan-módulo
      const existsInPlan = planModules[planId]?.[moduleId]?.plan_id === planId;
      
      if (existsInPlan) {
        // Actualizar relación existente
        const { error } = await supabase
          .from('plan_modules')
          .update({ enabled: !enabled })
          .eq('plan_id', planId)
          .eq('module_id', moduleId);
        
        if (error) {
          throw new Error('Error al actualizar la relación plan-módulo');
        }
      } else {
        // Crear nueva relación
        const { error } = await supabase
          .from('plan_modules')
          .insert({
            plan_id: planId,
            module_id: moduleId,
            enabled: true,
            restrictions: {}
          });
        
        if (error) {
          throw new Error('Error al crear la relación plan-módulo');
        }
      }
      
      // Actualizar estado local
      setPlanModules(prevPlanModules => {
        const updatedMap = { ...prevPlanModules };
        
        if (!updatedMap[planId]) {
          updatedMap[planId] = {};
        }
        
        updatedMap[planId] = {
          ...updatedMap[planId],
          [moduleId]: {
            plan_id: planId,
            module_id: moduleId,
            enabled: !enabled,
            restrictions: updatedMap[planId]?.[moduleId]?.restrictions || {}
          }
        };
        
        return updatedMap;
      });
      
      // Mostrar mensaje de éxito
      setSuccessMessage('Configuración de plan actualizada correctamente');
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error al actualizar plan-módulo:', error);
      setUpdateError(error instanceof Error ? error.message : 'Error al actualizar configuración de plan');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Volver a la página de verticales
  const handleBack = () => {
    router.push('/superadmin/verticals');
  };
  
  // Si está cargando inicialmente
  if (isLoading) {
    return (
      <div className="container mx-auto py-16 px-4 flex items-center justify-center">
        <Spinner size="lg" color="primary" text="Cargando módulos..." />
      </div>
    );
  }
  
  // Si hay error al cargar
  if (loadError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 dark:text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Error al cargar módulos</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{loadError}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.refresh()}
              className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={handleBack}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Módulos de {vertical?.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Gestiona los módulos disponibles y su asignación a planes
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Link
              href={`/superadmin/verticals/${verticalId}/modules/new`}
              className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Nuevo Módulo
            </Link>
            
            <button
              onClick={handleBack}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Volver
            </button>
          </div>
        </div>
      </div>
      
      {/* Mensajes de éxito o error */}
      {successMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-700 dark:text-green-400">{successMessage}</p>
        </div>
      )}
      
      {updateError && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{updateError}</p>
          <button
            onClick={() => setUpdateError(null)}
            className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 mt-1"
          >
            Cerrar
          </button>
        </div>
      )}
      
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar
            </label>
            <input
              type="text"
              id="search"
              placeholder="Buscar por nombre, código o descripción..."
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Filtro de categoría */}
          <div className="w-full md:w-48">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoría
            </label>
            <select
              id="category"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Todas</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Lista de módulos */}
      {filteredModules.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No se encontraron módulos que coincidan con los criterios de búsqueda.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-primary-500 hover:text-primary-600 text-sm font-medium"
            >
              Limpiar filtros
            </button>
            <Link
              href={`/superadmin/verticals/${verticalId}/modules/new`}
              className="text-primary-500 hover:text-primary-600 text-sm font-medium"
            >
              Crear nuevo módulo
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabla de módulos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Módulo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Código
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredModules.map((module) => (
                    <tr key={module.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full">
                            {module.icon ? (
                              <img src={module.icon} alt={module.name} className="h-8 w-8" />
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400 text-lg font-bold">
                                {module.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {module.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {module.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-mono">
                          {module.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {module.category || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          module.enabled 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'
                        }`}>
                          {module.enabled ? 'Habilitado' : 'Deshabilitado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleToggleModule(module.id, module.enabled)}
                            disabled={isUpdating}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            title={module.enabled ? 'Deshabilitar' : 'Habilitar'}
                          >
                            {module.enabled ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                          <Link
                            href={`/superadmin/verticals/${verticalId}/modules/${module.id}`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <Link
                            href={`/superadmin/verticals/${verticalId}/modules/${module.id}/config`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Configuración"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Asignación a planes */}
          {plans.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                Asignación a Planes
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Configura qué módulos están disponibles en cada plan. Los módulos no asignados no serán accesibles para los tenants con ese plan.
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Módulo
                      </th>
                      {plans.map((plan) => (
                        <th key={plan.id} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <div>{plan.name}</div>
                          <div className="text-xs font-normal mt-1 text-gray-400 dark:text-gray-500 normal-case">
                            {plan.price > 0 ? `$${plan.price} / ${plan.billing_cycle}` : 'Gratis'}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredModules.map((module) => (
                      <tr key={module.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {module.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {module.code}
                          </div>
                        </td>
                        {plans.map((plan) => {
                          const isEnabled = planModules[plan.id]?.[module.id]?.enabled || false;
                          
                          return (
                            <td key={`${plan.id}-${module.id}`} className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleTogglePlanModule(plan.id, module.id, isEnabled)}
                                disabled={isUpdating || !module.enabled}
                                className={`w-5 h-5 rounded-md border ${
                                  isEnabled
                                    ? 'bg-primary-500 border-primary-500 dark:bg-primary-600 dark:border-primary-600'
                                    : 'bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600'
                                } ${
                                  !module.enabled || isUpdating
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }`}
                                title={isEnabled ? 'Desactivar en este plan' : 'Activar en este plan'}
                              >
                                {isEnabled && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  Nota: Los módulos deshabilitados no se pueden activar en ningún plan. Primero habilita el módulo.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Proteger la página con verificación de permisos
export default withPermissionCheck(ModulesPage, {
  requiredRole: 'super_admin',
  redirectUnauthorized: true,
  redirectUrl: '/app/unauthorized'
});
