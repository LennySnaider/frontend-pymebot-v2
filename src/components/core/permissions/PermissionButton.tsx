/**
 * frontend/src/components/core/permissions/PermissionButton.tsx
 * Botón o enlace que se habilita/deshabilita o muestra/oculta según los permisos del usuario.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { ReactNode, ComponentProps, forwardRef } from 'react';
import Button from '@/components/ui/Button';
import usePermissions, { PermissionType, PermissionScope, UserRole } from '@/lib/core/permissions';
import { Icons } from '@/components/ui/Icons';

type ButtonBaseProps = ComponentProps<typeof Button>;

interface PermissionButtonProps extends ButtonBaseProps {
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
   * Contenido del botón
   */
  children: ReactNode;

  /**
   * Si es true, el botón se oculta en lugar de deshabilitarse cuando no tiene permisos
   * @default false
   */
  hideOnNoPermission?: boolean;

  /**
   * Si es true, muestra un tooltip explicando por qué está deshabilitado
   * @default true
   */
  showTooltip?: boolean;

  /**
   * Mensaje personalizado para el tooltip
   */
  tooltipMessage?: string;
}

/**
 * Botón que se habilita/deshabilita o muestra/oculta según los permisos del usuario
 * 
 * @example
 * // Botón para crear que se deshabilita si no tiene permisos
 * <PermissionButton 
 *   permissionType="create" 
 *   scope={{ vertical: 'salon', module: 'clients' }}
 *   variant="primary"
 * >
 *   Crear cliente
 * </PermissionButton>
 * 
 * @example
 * // Botón para eliminar que se oculta si no tiene permisos
 * <PermissionButton 
 *   permissionType="delete" 
 *   scope={{ vertical: 'restaurant', module: 'menu' }}
 *   variant="danger"
 *   hideOnNoPermission
 * >
 *   Eliminar elemento
 * </PermissionButton>
 */
const PermissionButton = forwardRef<HTMLButtonElement, PermissionButtonProps>(
  ({ 
    permissionType, 
    scope, 
    requiredRole, 
    children, 
    hideOnNoPermission = false,
    showTooltip = true,
    tooltipMessage,
    ...buttonProps 
  }, ref) => {
    const { hasPermission, hasRole } = usePermissions();

    // Verificar rol primero si está especificado
    if (requiredRole && !hasRole(requiredRole)) {
      if (hideOnNoPermission) return null;
      
      const message = tooltipMessage || 'No tienes permisos suficientes para esta acción';
      
      return (
        <Button
          {...buttonProps}
          disabled
          title={showTooltip ? message : undefined}
          ref={ref}
        >
          {children}
        </Button>
      );
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
      if (hideOnNoPermission) return null;
      
      const message = tooltipMessage || 'No tienes permisos suficientes para esta acción';
      
      return (
        <Button
          {...buttonProps}
          disabled
          title={showTooltip ? message : undefined}
          ref={ref}
        >
          {children}
        </Button>
      );
    }

    // Si tiene permisos, renderizar botón normal
    return (
      <Button
        {...buttonProps}
        ref={ref}
      >
        {children}
      </Button>
    );
  }
);

PermissionButton.displayName = 'PermissionButton';

export default PermissionButton;
