/**
 * frontend/src/app/(protected-pages)/modules/account/roles-permissions/guide/page.tsx
 * Página de guía para el sistema de permisos que muestra ejemplos de uso de los componentes
 * de control de acceso basados en permisos.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import Container from '@/components/shared/Container';
import PermissionGuideExample from '../_components/PermissionGuideExample';
import { RoleGate } from '@/components/core/permissions';
import { useTranslations } from 'next-intl';

export default function PermissionsGuidePage() {
  const t = useTranslations();
  return (
    <Container>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3>{t('common.guidePermissions')}</h3>
        </div>
        <div className="mb-4 text-gray-600 dark:text-gray-400">
          <p>
            {t('common.permissionsGuideDesc1')}
            {t('common.permissionsGuideDesc2')}
          </p>
        </div>
      </div>

      {/* Solo mostrar la guía a super_admin */}
      <RoleGate 
        allowedRoles={['super_admin']}
        fallback={
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="text-yellow-800 dark:text-yellow-400 font-medium text-lg mb-2">
              {t('common.restrictedAccess')}
            </h4>
            <p className="text-yellow-700 dark:text-yellow-300">
              {t('common.permissionGuideSuperAdminOnly')}
            </p>
          </div>
        }
      >
        <PermissionGuideExample />
      </RoleGate>
    </Container>
  );
}
