/**
 * frontend/src/hooks/core/useDemoMode.ts
 * Hook para acceder al servicio de modo demo desde componentes.
 * @version 1.0.0
 * @created 2025-06-05
 */

import { useState, useEffect } from 'react';
import { demoModeService, DEMO_PLANS, DEMO_VERTICALS } from '@/services/core/demoModeService';
import { TenantPlan } from '@/stores/core/tenantStore';
import usePermissions from '@/lib/core/permissions';

/**
 * Hook para gestionar el modo demo
 */
export function useDemoMode() {
  const [isEnabled, setIsEnabled] = useState(demoModeService.isEnabled);
  const { role } = usePermissions();
  
  // Solo super_admin puede usar el modo demo
  const canUseDemoMode = role === 'super_admin';
  
  // Efecto para sincronizar el estado
  useEffect(() => {
    // Actualizar estado local según el servicio
    setIsEnabled(demoModeService.isEnabled);
    
    // No hay un mecanismo de eventos para suscribirse a cambios del servicio
    // Idealmente, implementaríamos un sistema de eventos si esto fuera necesario
  }, []);
  
  /**
   * Activa o desactiva el modo demo
   */
  const toggleDemoMode = (enabled: boolean) => {
    if (!canUseDemoMode) return false;
    
    demoModeService.toggleDemoMode(enabled, role);
    setIsEnabled(enabled);
    return true;
  };
  
  /**
   * Cambia el plan en modo demo
   */
  const changePlan = (planLevel: 'free' | 'basic' | 'professional' | 'enterprise' | 'custom') => {
    if (!isEnabled || !canUseDemoMode) return false;
    const result = demoModeService.changeDemoPlan(planLevel);
    // Forzar rerender para actualizar el estado
    setIsEnabled(demoModeService.isEnabled);
    return result;
  };
  
  /**
   * Cambia la vertical activa
   */
  const changeVertical = (verticalCode: string) => {
    if (!isEnabled || !canUseDemoMode) return false;
    return demoModeService.changeActiveVertical(verticalCode);
  };
  
  /**
   * Obtiene todos los planes disponibles en modo demo
   */
  const getAvailablePlans = (): TenantPlan[] => {
    return Object.values(DEMO_PLANS);
  };
  
  /**
   * Obtiene las verticales disponibles para el plan actual
   */
  const getAvailableVerticals = (): string[] => {
    if (!isEnabled) return [];
    return demoModeService.getAvailableVerticals();
  };
  
  /**
   * Obtiene todos los módulos disponibles para una vertical
   */
  const getModulesForVertical = (verticalCode: string): string[] => {
    return DEMO_VERTICALS[verticalCode] || [];
  };
  
  return {
    isEnabled,
    canUseDemoMode,
    toggleDemoMode,
    changePlan,
    changeVertical,
    getAvailablePlans,
    getAvailableVerticals,
    getModulesForVertical,
    // Exportar constantes para conveniencia
    PLANS: DEMO_PLANS,
    VERTICALS: DEMO_VERTICALS
  };
}

export default useDemoMode;