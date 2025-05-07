'use client';

/**
 * frontend/src/app/(protected-pages)/modules/account/roles-permissions/_components/RolesPermissionsDeleteButton.tsx
 * Componente para el botón de eliminación de roles. Solo visible para super_admin.
 * 
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { useState } from 'react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useRolePermissionsStore } from '../_store/rolePermissionsStore';
import usePermissions from '@/lib/core/permissions';
import { TbTrash } from 'react-icons/tb';

interface RolesPermissionsDeleteButtonProps {
  roleId: string;
  className?: string;
}

const RolesPermissionsDeleteButton = ({ roleId, className }: RolesPermissionsDeleteButtonProps) => {
  const { isSuperAdmin } = usePermissions();
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  const roleList = useRolePermissionsStore((state) => state.roleList);
  const setRoleList = useRolePermissionsStore((state) => state.setRoleList);
  
  // Si no es super_admin, no mostramos el botón
  if (!isSuperAdmin()) {
    return null;
  }
  
  const handleOpenConfirm = () => {
    setConfirmOpen(true);
  };
  
  const handleCloseConfirm = () => {
    setConfirmOpen(false);
  };
  
  const handleDelete = () => {
    // Eliminamos el rol del listado
    const newRoleList = roleList.filter(role => role.id !== roleId);
    setRoleList(newRoleList);
    setConfirmOpen(false);
  };

  return (
    <>
      <Button
        size="sm"
        variant="plain"
        icon={<TbTrash />}
        className={`text-error hover:text-error hover:bg-error-100 dark:hover:bg-error-900/20 ${className || ''}`}
        onClick={handleOpenConfirm}
      />
      
      <ConfirmDialog
        isOpen={confirmOpen}
        type="danger"
        title="Delete Role"
        onClose={handleCloseConfirm}
        onRequestClose={handleCloseConfirm}
        onCancel={handleCloseConfirm}
        onConfirm={handleDelete}
      >
        <p>
          Are you sure you want to delete this role? This action cannot be undone and will remove
          all users from this role.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default RolesPermissionsDeleteButton;
