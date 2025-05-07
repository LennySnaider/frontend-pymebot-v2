/**
 * frontend/src/app/(protected-pages)/superadmin/ia-config/page.tsx
 * Página de configuración de APIs para modelos de IA
 * @version 1.0.0
 * @created 2025-04-10
 */

'use client'

import React from 'react'
import HeaderBreadcrumbs from '@/components/shared/HeaderBreadcrumbs'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import { useTranslation } from '@/utils/hooks/useTranslation'
import IAConfigurationPanel from './_components/IAConfigurationPanel'

const IAConfigPage = () => {
    // Uso correcto de useTranslation
    const navT = useTranslation('nav')

    return (
        <>
            <HeaderBreadcrumbs
                heading={navT('superadmin.iaConfig')}
                links={[
                    { name: navT('dashboard.dashboard'), href: '/home' },
                    { name: navT('superadmin.tools') },
                    { name: navT('superadmin.iaConfig') },
                ]}
            />

            <AdaptiveCard className="mb-6" bodyClass="p-0">
                <div className="p-6">
                    <IAConfigurationPanel />
                </div>
            </AdaptiveCard>
        </>
    )
}

export default IAConfigPage
