'use client';

/**
 * CentralizedSessionContext.tsx
 * Contexto centralizado para compartir la sesión y evitar múltiples llamadas a useSession
 * @version 1.0.0
 * @updated 2025-01-25
 */

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

interface CentralizedSessionContextType {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isLoading: boolean;
  isAuthenticated: boolean;
}

const CentralizedSessionContext = createContext<CentralizedSessionContextType | undefined>(undefined);

export const CentralizedSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Intentar usar NextAuth primero
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  
  // Estado para nuestra sesión personalizada
  const [customSession, setCustomSession] = useState<Session | null>(null);
  const [customStatus, setCustomStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  
  // Si NextAuth falla, usar nuestro sistema personalizado
  useEffect(() => {
    // Solo intentar cargar sesión personalizada si NextAuth no está cargando
    if (nextAuthStatus === 'loading') return;
    
    // Si NextAuth tiene sesión, limpiar custom
    if (nextAuthSession && nextAuthStatus === 'authenticated') {
      if (customSession || customStatus !== 'loading') {
        setCustomSession(null);
        setCustomStatus('loading');
      }
      return;
    }
    
    // Solo cargar sesión personalizada si NextAuth falló y no tenemos custom
    if (nextAuthStatus === 'unauthenticated' && customStatus === 'loading') {
      let cancelled = false;
      
      const loadCustomSession = async () => {
        try {
          const response = await fetch('/api/auth/custom-session');
          if (!cancelled) {
            if (response.ok) {
              const data = await response.json();
              setCustomSession(data);
              setCustomStatus('authenticated');
            } else {
              setCustomSession(null);
              setCustomStatus('unauthenticated');
            }
          }
        } catch (error) {
          if (!cancelled) {
            console.error('Error loading custom session:', error);
            setCustomSession(null);
            setCustomStatus('unauthenticated');
          }
        }
      };
      
      loadCustomSession();
      
      return () => {
        cancelled = true;
      };
    }
  }, [nextAuthStatus, nextAuthSession]);
  
  // Usar NextAuth si funciona, sino usar custom
  const session = nextAuthSession || customSession;
  const status = nextAuthSession ? nextAuthStatus : customStatus;
  
  // Debug temporal para ver el estado de la sesión
  // Comentado para evitar spam en consola
  // console.log('CentralizedSessionProvider Debug:', { 
  //   session, 
  //   status, 
  //   userRole: session?.user?.role,
  //   userEmail: session?.user?.email,
  //   isUsingCustomAuth: !nextAuthSession && !!customSession
  // });
  
  // Memoizar el valor del contexto para evitar re-renders innecesarios
  const value = useMemo(() => ({
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated'
  }), [session, status]);
  
  return (
    <CentralizedSessionContext.Provider value={value}>
      {children}
    </CentralizedSessionContext.Provider>
  );
};

// Hook personalizado para usar la sesión centralizada
export const useCentralizedSession = () => {
  const context = useContext(CentralizedSessionContext);
  if (context === undefined) {
    throw new Error('useCentralizedSession must be used within a CentralizedSessionProvider');
  }
  return context;
};

// Hook de compatibilidad que reemplaza useSession
export const useSessionOptimized = () => {
  const { session, status } = useCentralizedSession();
  return { data: session, status };
};