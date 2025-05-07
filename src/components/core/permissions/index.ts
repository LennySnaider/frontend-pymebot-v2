/**
 * frontend/src/components/core/permissions/index.ts
 * Punto de entrada para los componentes de permisos.
 * Exporta todos los componentes del sistema de permisos para fácil importación.
 * @version 2.0.0
 * @updated 2025-06-05
 */

// Componentes base de permisos
export { default as PermissionGate } from './PermissionGate';
export { default as VerticalGate } from './VerticalGate';
export { default as ModuleGate } from './ModuleGate';
export { default as FeatureGate } from './FeatureGate';
export { default as RoleGate } from './RoleGate';
export { default as PermissionButton } from './PermissionButton';
export { default as withPermission } from './withPermission';

// Componentes de límites de plan
export { default as LimitChecker } from './LimitChecker';
export { default as ResourceLimit } from './ResourceLimit';
export { default as FeatureLimit } from './FeatureLimit';

// Definir los tipos localmente según la implementación actual
export type UserRole = 'super_admin' | 'tenant_admin' | 'agent';

export type PermissionType = 
  | 'view'       // Permiso para ver/acceder
  | 'edit'       // Permiso para editar
  | 'create'     // Permiso para crear
  | 'delete'     // Permiso para eliminar
  | 'manage'     // Permiso total (administración)
  | 'execute'    // Permiso para ejecutar acciones
  | 'export'     // Permiso para exportar
  | 'import'     // Permiso para importar
  | 'publish'    // Permiso para publicar
  | 'approve'    // Permiso para aprobar
  | 'assign';    // Permiso para asignar

export interface PermissionScope {
  vertical?: string;   // Ámbito de vertical
  module?: string;     // Ámbito de módulo 
  feature?: string;    // Ámbito de característica
  resource?: string;   // Ámbito de recurso específico
}

// Exportar hooks relacionados con permisos
export { default as usePermissions } from '@/lib/core/permissions';
export { default as usePermissionsCheck } from '@/hooks/core/usePermissionsCheck';
export { usePlanLimits } from '@/hooks/core/usePlanLimits';