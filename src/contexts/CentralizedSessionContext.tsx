'use client';

/**
 * CentralizedSessionContext.tsx
 * Contexto centralizado para compartir la sesión y evitar múltiples llamadas a useSession
 * @version 1.0.0
 * @updated 2025-01-25
 */

import React, { createContext, useContext, useMemo } from 'react';
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
  // Una sola llamada a useSession para toda la aplicación
  const { data: session, status } = useSession();
  
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