/**
 * frontend/src/components/providers/core/VerticalsProvider.tsx
 * Provider para inicialización y gestión centralizada de verticales.
 * Carga las verticales disponibles para el tenant actual.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useCentralizedSession } from '@/contexts/CentralizedSessionContext';
import { useTenantStore } from '@/stores/core/tenantStore';
import verticalInitService from '@/services/core/verticalInitService';

// Importar inicializadores para registro
// Esto fuerza la ejecución del código que registra los inicializadores
import '@/components/verticals/medicina/initializer/register';
// Aquí se importarían otros inicializadores de verticales

interface VerticalsProviderProps {
  children: React.ReactNode;
}

/**
 * Provider que inicializa las verticales disponibles para el tenant actual
 */
export default function VerticalsProvider({ children }: VerticalsProviderProps) {
  const { session, status, isAuthenticated } = useCentralizedSession();
  const { currentTenant } = useTenantStore();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Memoizar la función de inicialización para evitar recrearla en cada render
  const initializeVerticals = useCallback(async () => {
    if (!currentTenant?.id || isInitializing || isInitialized) return;
    
    try {
      setIsInitializing(true);
      setError(null);
      
      console.log('Inicializando verticales para tenant:', currentTenant.id);
      
      // Inicializar todas las verticales disponibles para este tenant
      const results = await verticalInitService.initializeAllTenantVerticals(currentTenant.id);
      
      // Verificar si hubo errores
      const hasErrors = Object.values(results).some(result => !result);
      if (hasErrors) {
        console.warn('Algunas verticales no se pudieron inicializar:', results);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error inicializando verticales:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsInitializing(false);
    }
  }, [currentTenant?.id, isInitializing, isInitialized]);
  
  // Inicializar verticales cuando se carga el tenant
  useEffect(() => {
    // Solo inicializar si hay sesión activa y tenant cargado
    if (isAuthenticated && session?.user && currentTenant?.id) {
      initializeVerticals();
    }
    
    // Si cambia el tenant, reiniciar el proceso
    return () => {
      if (isInitialized) {
        setIsInitialized(false);
        // No reiniciamos aquí las verticales para evitar problemas de navegación
        // Solo marcamos como no inicializado para que se reinicie en el próximo render
      }
    };
  }, [isAuthenticated, session, currentTenant?.id, initializeVerticals]);
  
  // Reiniciar verticales cuando cambia el tenant
  useEffect(() => {
    // Este efecto se ejecuta cuando cambia el tenant
    if (isInitialized) {
      // Reiniciar estado para forzar reinicialización
      setIsInitialized(false);
    }
  }, [currentTenant?.id]);
  
  // Memoizar los componentes de estado para evitar re-renders innecesarios
  const loadingIndicator = useMemo(() => (
    isInitializing ? (
      <div className="fixed top-0 right-0 m-4 z-50 bg-primary-100 p-2 rounded-md text-sm text-primary-800 opacity-75">
        Inicializando módulos...
      </div>
    ) : null
  ), [isInitializing]);
  
  const errorIndicator = useMemo(() => (
    error ? (
      <div className="fixed top-0 right-0 m-4 z-50 bg-red-100 p-2 rounded-md text-sm text-red-800 opacity-75">
        Error cargando módulos: {error.message}
      </div>
    ) : null
  ), [error]);
  
  return (
    <>
      {loadingIndicator}
      {errorIndicator}
      {/* Renderizar hijos siempre, la inicialización ocurre en paralelo */}
      {children}
    </>
  );
}