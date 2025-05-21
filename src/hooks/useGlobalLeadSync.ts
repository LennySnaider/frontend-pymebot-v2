/**
 * useGlobalLeadSync.ts
 * 
 * Hook para sincronizar datos de leads entre SalesFunnel y ChatList
 * utilizando el caché global de leads.
 */

import { useEffect, useState } from 'react';
import globalLeadCache from '@/stores/globalLeadCache';

// Opciones para el hook
interface UseGlobalLeadSyncOptions {
  componentName: string;        // Nombre del componente para logs
  onUpdate?: (leadId: string, name: string, stage?: string) => void;  // Callback opcional
}

/**
 * Hook para sincronizar leads con el caché global
 */
export default function useGlobalLeadSync(options: UseGlobalLeadSyncOptions) {
  const { componentName, onUpdate } = options;
  
  // Estado local para forzar re-renders cuando haya actualizaciones
  const [lastUpdate, setLastUpdate] = useState(0);
  
  useEffect(() => {
    console.log(`${componentName}: Iniciando sincronización con GlobalLeadCache`);
    
    // Suscribirse a actualizaciones
    const unsubscribe = globalLeadCache.subscribe((leadId, data) => {
      console.log(`${componentName}: Recibida actualización para lead ${leadId}:`, data);
      
      // Ejecutar callback si existe
      if (onUpdate) {
        onUpdate(leadId, data.name, data.stage);
      }
      
      // Forzar re-render
      setLastUpdate(Date.now());
    });
    
    // Limpiar suscripción al desmontar
    return () => {
      console.log(`${componentName}: Deteniendo sincronización con GlobalLeadCache`);
      unsubscribe();
    };
  }, [componentName, onUpdate]);
  
  // Retornar funciones útiles
  return {
    getLeadName: (leadId: string): string => {
      const data = globalLeadCache.getLeadData(leadId);
      return data?.name || '';
    },
    
    getLeadStage: (leadId: string): string | undefined => {
      const data = globalLeadCache.getLeadData(leadId);
      return data?.stage;
    },
    
    updateLead: (leadId: string, name: string, stage?: string): void => {
      globalLeadCache.updateLeadData(leadId, { name, stage });
    },
    
    // Propiedad para tener acceso al timestamp de última actualización
    // Útil para forzar re-renders cuando cambian los datos
    lastUpdate
  };
}