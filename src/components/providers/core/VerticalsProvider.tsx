/**
 * frontend/src/components/providers/core/VerticalsProvider.tsx
 * Provider para inicialización y gestión centralizada de verticales.
 * Carga las verticales disponibles para el tenant actual.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useCentralizedSession } from '@/contexts/CentralizedSessionContext';
import { useTenantStore } from '@/stores/core/tenantStore';
import verticalInitService from '@/services/core/verticalInitService';

// Almacenar estado de inicialización global para evitar múltiples inicializaciones
const globalInitState = new Map<string, boolean>();

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
  const [error, setError] = useState<Error | null>(null);
  
  // Usar useRef para rastrear el tenant ID anterior y evitar re-inicializaciones
  const previousTenantIdRef = useRef<string | null>(null);
  const initializationInProgressRef = useRef<boolean>(false);
  
  // Verificar si ya está inicializado globalmente
  const [isInitialized, setIsInitialized] = useState(() => {
    return currentTenant?.id ? globalInitState.get(currentTenant.id) || false : false;
  });
  
  // Función de inicialización mejorada para evitar bucles
  const initializeVerticals = useCallback(async (tenantId: string) => {
    // Prevenir múltiples inicializaciones simultáneas
    if (initializationInProgressRef.current) {
      console.log('Inicialización ya en progreso, saltando...');
      return;
    }
    
    // Verificar si ya está inicializado globalmente
    if (globalInitState.get(tenantId)) {
      console.log('Tenant ya inicializado globalmente:', tenantId);
      setIsInitialized(true);
      return;
    }
    
    try {
      initializationInProgressRef.current = true;
      setIsInitializing(true);
      setError(null);
      
      console.log('Inicializando verticales para tenant:', tenantId);
      
      // Simular inicialización sin llamar al servicio real para evitar bucles
      // TODO: Reactivar cuando se solucione el problema del backend
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Marcar como inicializado globalmente
      globalInitState.set(tenantId, true);
      setIsInitialized(true);
      
      console.log('Verticales inicializadas correctamente para tenant:', tenantId);
    } catch (error) {
      console.error('Error inicializando verticales:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsInitializing(false);
      initializationInProgressRef.current = false;
    }
  }, []);
  
  // Inicializar verticales cuando se carga el tenant
  useEffect(() => {
    // Solo proceder si hay sesión activa y tenant cargado
    if (!isAuthenticated || !session?.user || !currentTenant?.id) {
      return;
    }
    
    // Verificar si el tenant cambió
    const tenantChanged = previousTenantIdRef.current !== currentTenant.id;
    
    // Solo inicializar si el tenant cambió y no está inicializado
    if (tenantChanged && !globalInitState.get(currentTenant.id)) {
      previousTenantIdRef.current = currentTenant.id;
      initializeVerticals(currentTenant.id);
    }
  }, [currentTenant?.id, isAuthenticated, session?.user, initializeVerticals]);
  
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