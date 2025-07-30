/**
 * frontend/src/app/(protected-pages)/modules/account/roles-permissions/_components/PermissionsGuideButton.tsx
 * Componente cliente para el botón de acceso a la guía de permisos.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import { RoleGate } from '@/components/core/permissions';
import { useTranslations } from 'next-intl';

const PermissionsGuideButton = () => {
  const t = useTranslations();

  return (
    <RoleGate role="super_admin">
      <Link href="/modules/account/roles-permissions/guide">
        <Button variant="plain" size="sm">
          {t('common.view')} {t('common.guidePermissions')}
        </Button>
      </Link>
    </RoleGate>
  );
};

export default PermissionsGuideButton;
