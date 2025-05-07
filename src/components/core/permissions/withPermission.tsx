/**
 * frontend/src/components/core/permissions/withPermission.tsx
 * HOC (High Order Component) que envuelve un componente y verifica permisos.
 * Útil para proteger componentes completos y reutilizar lógica de permisos.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { ComponentType, FC } from 'react';
import usePermissions, { PermissionType, PermissionScope, UserRole } from '@/lib/core/permissions';

interface WithPermissionProps {
  /**
   * Tipo de permiso requerido (view, edit, create, delete, etc.)
   */
  permissionType: PermissionType | PermissionType[];

  /**
   * Ámbito del permiso (vertical, módulo, característica)
   */
  scope: PermissionScope;

  /**
   * Rol mínimo requerido (opcional)
   */
  requiredRole?: UserRole;

  /**
   * Componente a mostrar cuando no tiene permisos
   */
  FallbackComponent?: ComponentType<any>;
}

/**
 * HOC que verifica si el usuario tiene los permisos necesarios antes de renderizar el componente.
 * 
 * @example
 * // Proteger un componente para que solo sea accesible con permiso de edición
 * const ProtectedEditor = withPermission({
 *   permissionType: 'edit',
 *   scope: { vertical: 'salon', module: 'clients' }
 * })(ClientEditor);
 * 
 * // Uso con Fallback personalizado
 * const ProtectedDashboard = withPermission({
 *   permissionType: 'view',
 *   scope: { module: 'analytics' },
 *   FallbackComponent: UpgradePlanMessage
 * })(AnalyticsDashboard);
 */
const withPermission = <P extends object>({
  permissionType,
  scope,
  requiredRole,
  FallbackComponent
}: WithPermissionProps) => {
  return (Component: ComponentType<P>): FC<P> => {
    const WithPermissionComponent: FC<P> = (props) => {
      const { hasPermission, hasRole } = usePermissions();

      // Verificar rol primero si está especificado
      if (requiredRole && !hasRole(requiredRole)) {
        return FallbackComponent ? <FallbackComponent /> : null;
      }

      // Verificar permisos
      let hasRequiredPermission = false;

      // Si es un array de tipos de permiso, verificar si tiene al menos uno
      if (Array.isArray(permissionType)) {
        hasRequiredPermission = permissionType.some(type => 
          hasPermission(type, scope)
        );
      } else {
        // Verificar permiso único
        hasRequiredPermission = hasPermission(permissionType, scope);
      }

      if (!hasRequiredPermission) {
        return FallbackComponent ? <FallbackComponent /> : null;
      }

      // Si tiene permisos, renderizar componente original
      return <Component {...props} />;
    };

    // Mantener nombre del componente original para DevTools
    const wrappedName = Component.displayName || Component.name || 'Component';
    WithPermissionComponent.displayName = `withPermission(${wrappedName})`;

    return WithPermissionComponent;
  };
};

export default withPermission;
