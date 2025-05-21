'use client'

/**
 * Componente para inicializar sincronización global entre SalesFunnel y ChatList
 * Se monta una única vez por sesión para garantizar que está activo
 */

import { useEffect } from 'react'
import { startPollingSync, stopPollingSync } from '@/utils/directSyncLeadNames'

export default function GlobalSyncInitializer() {
  // Iniciar sincronización al montar y detener al desmontar
  useEffect(() => {
    console.log('GlobalSyncInitializer: Iniciando sincronización global directa');
    startPollingSync();
    
    return () => {
      console.log('GlobalSyncInitializer: Deteniendo sincronización global');
      stopPollingSync();
    };
  }, []);

  // Componente invisible - solo para inicializar sincronización
  return null;
}