/**
 * frontend/src/app/(protected-pages)/superadmin/verticals/page.tsx
 * Página principal para la gestión de verticales por superadmin.
 * Permite listar, buscar, crear, editar y eliminar verticales.
 * 
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { withPermissionCheck } from '@/components/hoc/withPermissionCheck';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { supabase } from '@/services/supabase/SupabaseClient';

interface Vertical {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

const VerticalsPage = () => {
  const auth = useAuthContext();
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  // Cargar verticales desde Supabase
  const loadVerticals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Consulta base
      let query = supabase
        .from('verticals')
        .select('*')
        .order('name');

      // Aplicar filtros
      if (statusFilter === 'enabled') {
        query = query.eq('enabled', true);
      } else if (statusFilter === 'disabled') {
        query = query.eq('enabled', false);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setVerticals(data || []);
      
      // Extraer categorías únicas para el filtro
      if (data) {
        const uniqueCategories = Array.from(new Set(data.map(v => v.category).filter(Boolean)));
        setCategories(uniqueCategories);
      }
    } catch (err) {
      console.error('Error al cargar verticales:', err);
      setError('Error al cargar verticales. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, categoryFilter]);

  // Cargar verticales al montar el componente o cambiar filtros
  useEffect(() => {
    loadVerticals();
  }, [loadVerticals]);

  // Manejar cambio de estado de una vertical
  const handleToggleStatus = async (verticalId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('verticals')
        .update({ enabled: !currentStatus })
        .eq('id', verticalId);

      if (error) {
        throw error;
      }

      // Actualizar lista local
      setVerticals(prev => 
        prev.map(v => v.id === verticalId ? { ...v, enabled: !currentStatus } : v)
      );
    } catch (err) {
      console.error('Error al actualizar estado de vertical:', err);
      setError('Error al actualizar estado. Por favor intenta nuevamente.');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Gestión de Verticales
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Administra las verticales de negocio disponibles en el sistema
          </p>
        </div>
        
        <Link
          href="/superadmin/verticals/new"
          className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Crear Nueva Vertical
        </Link>
      </div>
      
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
          
          {/* Filtro de estado */}
          <div className="w-full md:w-48">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              id="status"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'enabled' | 'disabled')}
            >
              <option value="all">Todos</option>
              <option value="enabled">Habilitadas</option>
              <option value="disabled">Deshabilitadas</option>
            </select>
          </div>
          
          {/* Filtro de categoría */}
          <div className="w-full md:w-48">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoría
            </label>
            <select
              id="category"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
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
      
      {/* Estado de carga o error */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" color="primary" text="Cargando verticales..." />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={loadVerticals}
            className="mt-2 text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {/* Tabla de verticales */}
          {verticals.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No se encontraron verticales que coincidan con los criterios de búsqueda.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
                className="text-primary-500 hover:text-primary-600 text-sm font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vertical
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
                  {verticals.map((vertical) => (
                    <tr key={vertical.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full">
                            {vertical.icon ? (
                              <img src={vertical.icon} alt={vertical.name} className="h-8 w-8" />
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400 text-lg font-bold">
                                {vertical.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {vertical.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {vertical.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-mono">
                          {vertical.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {vertical.category || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          vertical.enabled 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'
                        }`}>
                          {vertical.enabled ? 'Habilitada' : 'Deshabilitada'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleToggleStatus(vertical.id, vertical.enabled)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            title={vertical.enabled ? 'Deshabilitar' : 'Habilitar'}
                          >
                            {vertical.enabled ? (
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
                            href={`/superadmin/verticals/${vertical.id}`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <Link
                            href={`/superadmin/verticals/${vertical.id}/modules`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Gestionar Módulos"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Proteger la página con verificación de permisos
export default withPermissionCheck(VerticalsPage, {
  requiredRole: 'super_admin',
  redirectUnauthorized: true,
  redirectUrl: '/app/unauthorized'
});
