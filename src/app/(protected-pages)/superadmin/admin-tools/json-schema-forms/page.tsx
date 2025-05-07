/**
 * frontend/src/app/(protected-pages)/superadmin/admin-tools/json-schema-forms/page.tsx
 * Página para la gestión de esquemas JSON y formularios dinámicos para superadministradores.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/shared'
import { useMounted } from '@/hooks/useMounted'
import Loading from '@/components/shared/Loading'
import { PiFileDuotone, PiEyeDuotone, PiListDuotone, PiTextboxDuotone } from 'react-icons/pi'
import JsonSchemaLibrary from './_components/JsonSchemaLibrary'
import EmergencyFixFormRenderer from './_components/EmergencyFixFormRenderer'
// El renderizador original utiliza SimpleCheckbox, debería funcionar correctamente
import JsonSchemaFormRenderer from './_components/JsonSchemaFormRenderer'
import JsonSchemaUsageStats from './_components/JsonSchemaUsageStats'

const JsonSchemaFormsPage = () => {
    const mounted = useMounted()
    const [activeTab, setActiveTab] = useState('library')

    if (!mounted) {
        return <Loading loading={true} />
    }

    return (
        <div className="container mx-auto py-4 h-full flex flex-col">
            <PageHeader
                title="Gestión de Esquemas JSON"
                desc="Cree, edite y administre esquemas JSON para formularios dinámicos"
                breadcrumbs={[
                    { text: 'Superadmin', path: '/superadmin' },
                    { text: 'Herramientas', path: '/superadmin/admin-tools' },
                    { text: 'Esquemas JSON', path: '/superadmin/admin-tools/json-schema-forms' },
                ]}
            />

            <Card className="flex-1 mt-4">
                <Tabs value={activeTab} onChange={(val) => setActiveTab(val)}>
                    <Tabs.TabList>
                        <Tabs.TabNav value="library" icon={<PiListDuotone />}>
                            Biblioteca de Esquemas
                        </Tabs.TabNav>
                        <Tabs.TabNav value="form-renderer" icon={<PiTextboxDuotone />}>
                            Renderizador de Formularios
                        </Tabs.TabNav>
                        <Tabs.TabNav value="usage-stats" icon={<PiEyeDuotone />}>
                            Estadísticas de Uso
                        </Tabs.TabNav>
                    </Tabs.TabList>

                    <Tabs.TabContent value="library">
                        <div className="p-4">
                            <JsonSchemaLibrary />
                        </div>
                    </Tabs.TabContent>

                    <Tabs.TabContent value="form-renderer">
                        <div className="p-4">
                            <JsonSchemaFormRenderer />
                        </div>
                    </Tabs.TabContent>

                    <Tabs.TabContent value="usage-stats">
                        <div className="p-4">
                            <JsonSchemaUsageStats />
                        </div>
                    </Tabs.TabContent>
                </Tabs>
            </Card>
        </div>
    )
}

export default JsonSchemaFormsPage
