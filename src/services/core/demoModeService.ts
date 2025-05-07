/**
 * frontend/src/services/core/demoModeService.ts
 * Servicio para gestionar el modo demostración que permite cambiar entre planes y verticales.
 * @version 1.0.0
 * @created 2025-06-05
 */

import { useTenantStore, TenantPlan } from '@/stores/core/tenantStore';

// Planes predefinidos para modo demo
export const DEMO_PLANS: Record<string, TenantPlan> = {
  free: {
    id: 'plan-free',
    name: 'Free',
    level: 'free',
    features: [
      'feature_appointments_basic',
      'feature_patients_basic',
      'feature_chat_basic'
    ],
    verticals: [
      'medicina'
    ],
    limits: {
      users: 2,
      storage: 1, // GB
      api_calls: 100,
      tokens: 5000,
      tokens_reset_period: 'monthly'
    }
  },
  basic: {
    id: 'plan-basic',
    name: 'Basic',
    level: 'basic',
    features: [
      'feature_appointments',
      'feature_patients',
      'feature_records',
      'feature_chat',
      'feature_basic_reports'
    ],
    verticals: [
      'medicina',
      'salon',
      'restaurante'
    ],
    limits: {
      users: 5,
      storage: 10, // GB
      api_calls: 1000,
      tokens: 50000,
      tokens_reset_period: 'monthly'
    }
  },
  professional: {
    id: 'plan-pro',
    name: 'Professional',
    level: 'professional',
    features: [
      'feature_appointments',
      'feature_patients',
      'feature_records',
      'feature_documents',
      'feature_billing',
      'feature_chat',
      'feature_reports',
      'feature_integrations'
    ],
    verticals: [
      'medicina',
      'salon',
      'restaurante',
      'bienes_raices'
    ],
    limits: {
      users: 15,
      storage: 50, // GB
      api_calls: 10000,
      tokens: 250000,
      tokens_reset_period: 'monthly'
    }
  },
  enterprise: {
    id: 'plan-enterprise',
    name: 'Enterprise',
    level: 'enterprise',
    features: [
      'feature_appointments',
      'feature_patients',
      'feature_records',
      'feature_documents',
      'feature_billing',
      'feature_chat',
      'feature_reports',
      'feature_integrations',
      'feature_ai_assistant',
      'feature_voice_bot',
      'feature_advanced_analytics',
      'feature_custom_modules'
    ],
    verticals: [
      'medicina',
      'salon',
      'restaurante',
      'bienes_raices',
      'educacion',
      'retail'
    ],
    limits: {
      users: 50,
      storage: 250, // GB
      api_calls: 100000,
      tokens: 1000000,
      tokens_reset_period: 'monthly'
    }
  }
};

// Configuración de verticales
export const DEMO_VERTICALS: Record<string, string[]> = {
  medicina: [
    'appointments',
    'patients',
    'medical_records',
    'prescriptions',
    'billing'
  ],
  salon: [
    'appointments',
    'clients',
    'services',
    'inventory',
    'billing'
  ],
  bienes_raices: [
    'properties',
    'clients',
    'leads',
    'calendar',
    'documents',
    'billing'
  ],
  restaurante: [
    'reservations',
    'tables',
    'menu',
    'inventory',
    'orders',
    'billing'
  ],
  educacion: [
    'students',
    'courses',
    'schedule',
    'assignments',
    'grades',
    'billing'
  ],
  retail: [
    'products',
    'customers',
    'inventory',
    'sales',
    'analytics',
    'billing'
  ]
};

// Servicio para el modo demo
class DemoModeService {
  // Almacena estado previo a activar modo demo
  private originalPlan: TenantPlan | null = null;
  private originalVerticals: Record<string, boolean> = {};
  private originalModules: Record<string, boolean> = {};
  
  // Estado del modo demo
  private _isEnabled: boolean = false;
  
  /**
   * Obtiene si el modo demo está activado
   */
  get isEnabled(): boolean {
    return this._isEnabled;
  }
  
  /**
   * Activa o desactiva el modo demo
   * @param enabled Estado deseado
   */
  toggleDemoMode(enabled: boolean, userRole?: string): void {
    // Si el estado es igual al actual, no hacer nada
    if (enabled === this._isEnabled) return;
    
    // Solo permitir a super_admin activar el modo demo
    if (userRole && userRole !== 'super_admin') return;
    
    const { currentTenant, updateTenantPlan, updateTenantSettings } = useTenantStore.getState();
    
    // Si no hay tenant actual, no hacer nada
    if (!currentTenant) return;
    
    if (enabled) {
      // Guardar estado actual antes de activar
      this.originalPlan = { ...currentTenant.plan };
      this.originalVerticals = {};
      this.originalModules = {};
      
      // Guardar estado de verticales
      if (currentTenant.settings.verticals) {
        Object.keys(currentTenant.settings.verticals).forEach(vertical => {
          this.originalVerticals[vertical] = currentTenant.settings.verticals?.[vertical]?.enabled ?? false;
        });
      }
      
      // Guardar estado de módulos
      if (currentTenant.settings.modules) {
        Object.keys(currentTenant.settings.modules).forEach(module => {
          this.originalModules[module] = currentTenant.settings.modules?.[module]?.enabled ?? false;
        });
      }
      
      // Activar modo demo con plan Professional por defecto
      this.changeDemoPlan('professional');
    } else {
      // Restaurar estado original
      if (this.originalPlan) {
        updateTenantPlan(this.originalPlan);
      }
      
      // Restaurar verticales
      if (Object.keys(this.originalVerticals).length > 0) {
        const updatedVerticals: Record<string, { enabled: boolean; settings?: Record<string, any> }> = {};
        
        Object.keys(this.originalVerticals).forEach(vertical => {
          updatedVerticals[vertical] = {
            enabled: this.originalVerticals[vertical],
            settings: currentTenant.settings.verticals?.[vertical]?.settings
          };
        });
        
        updateTenantSettings({
          verticals: updatedVerticals
        });
      }
      
      // Restaurar módulos
      if (Object.keys(this.originalModules).length > 0) {
        const updatedModules: Record<string, { enabled: boolean; settings?: Record<string, any> }> = {};
        
        Object.keys(this.originalModules).forEach(module => {
          updatedModules[module] = {
            enabled: this.originalModules[module],
            settings: currentTenant.settings.modules?.[module]?.settings
          };
        });
        
        updateTenantSettings({
          modules: updatedModules
        });
      }
      
      // Limpiar estados guardados
      this.originalPlan = null;
      this.originalVerticals = {};
      this.originalModules = {};
    }
    
    // Actualizar estado
    this._isEnabled = enabled;
  }
  
  /**
   * Cambia el plan en modo demo
   * @param planLevel Nivel de plan ('free', 'basic', 'professional', 'enterprise')
   */
  changeDemoPlan(planLevel: 'free' | 'basic' | 'professional' | 'enterprise' | 'custom'): boolean {
    // Si el modo demo no está activado, no hacer nada
    if (!this._isEnabled) return false;
    
    const { updateTenantPlan, updateTenantSettings, currentTenant } = useTenantStore.getState();
    
    // Obtener configuración del plan
    const demoPlan = DEMO_PLANS[planLevel];
    if (!demoPlan) return false;
    
    // Actualizar el plan
    updateTenantPlan(demoPlan);
    
    // Actualizar verticales disponibles
    const updatedVerticals: Record<string, { enabled: boolean; settings?: Record<string, any> }> = {};
    
    // Habilitar solo las verticales incluidas en el plan
    Object.keys(DEMO_VERTICALS).forEach(vertical => {
      updatedVerticals[vertical] = {
        enabled: demoPlan.verticals.includes(vertical),
        settings: currentTenant?.settings?.verticals?.[vertical]?.settings || {}
      };
    });
    
    // Actualizar módulos disponibles
    const updatedModules: Record<string, { enabled: boolean; settings?: Record<string, any> }> = {};
    
    // Determinar módulos habilitados según el plan y las verticales
    demoPlan.verticals.forEach(vertical => {
      const verticalModules = DEMO_VERTICALS[vertical] || [];
      
      verticalModules.forEach(module => {
        // Habilitar módulo si la característica correspondiente está en el plan
        const hasFeature = demoPlan.features.some(feature => 
          feature === `feature_${module}` || 
          feature === `feature_${module}_basic` ||
          feature === `feature_${module}_advanced`
        );
        
        updatedModules[module] = {
          enabled: hasFeature,
          settings: currentTenant?.settings?.modules?.[module]?.settings || {}
        };
      });
    });
    
    // Actualizar configuración
    updateTenantSettings({
      verticals: updatedVerticals,
      modules: updatedModules
    });
    
    console.log('DemoMode: Plan cambiado a', planLevel);
    console.log('DemoMode: Verticales habilitadas', demoPlan.verticals);
    
    return true;
  }
  
  /**
   * Cambia la vertical activa en modo demo
   * @param verticalCode Código de la vertical
   */
  changeActiveVertical(verticalCode: string): boolean {
    // Si el modo demo no está activado, no hacer nada
    if (!this._isEnabled) return false;
    
    const { currentTenant } = useTenantStore.getState();
    
    // Si no hay tenant actual, no hacer nada
    if (!currentTenant) return false;
    
    // Verificar si la vertical está disponible en el plan actual
    if (!currentTenant.plan.verticals.includes(verticalCode)) {
      console.error(`Vertical ${verticalCode} no disponible en el plan demo actual`);
      return false;
    }
    
    // En este caso, no necesitamos hacer cambios adicionales, ya que la vertical
    // ya está habilitada en el plan. La navegación a la vertical la manejará
    // el componente que utilice esta función.
    
    return true;
  }
  
  /**
   * Obtiene la lista de planes disponibles en modo demo
   */
  getAvailablePlans(): TenantPlan[] {
    return Object.values(DEMO_PLANS);
  }
  
  /**
   * Obtiene las verticales disponibles según el plan actual
   */
  getAvailableVerticals(): string[] {
    const { currentTenant } = useTenantStore.getState();
    
    // Si no hay tenant o el modo demo no está activado, devolver lista vacía
    if (!currentTenant || !this._isEnabled) {
      return [];
    }
    
    return currentTenant.plan.verticals || [];
  }
}

// Exportar instancia única
export const demoModeService = new DemoModeService();
export default demoModeService;