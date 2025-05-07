/**
 * frontend/src/app/(protected-pages)/superadmin/admin-tools/page.tsx
 * Página principal para las herramientas de administrador, accesible solo para superadmins.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared'
import { Settings, FileJson, Database, Users, BarChart } from 'lucide-react'
import AdminToolsOverview from './_components/AdminToolsOverview'
import { useMounted } from '@/hooks/useMounted'
import Loading from '@/components/shared/Loading'

const AdminToolsPage = () => {
    const mounted = useMounted()
    const [activeTab, setActiveTab] = useState('overview')

    if (!mounted) {
        return <Loading loading={true} />
    }

    return (
        <div className="container mx-auto py-4 h-full flex flex-col">
            <PageHeader
                title="Herramientas de Administrador"
                desc="Panel de herramientas avanzadas para la administración del sistema"
            />

            <Card className="flex-1 mt-4">
                <Tabs value={activeTab} onChange={(val) => setActiveTab(val)}>
                    <Tabs.TabList>
                        <Tabs.TabNav value="overview" icon={<Settings />}>
                            General
                        </Tabs.TabNav>
                        <Tabs.TabNav value="json-schemas" icon={<FileJson />}>
                            Esquemas JSON
                        </Tabs.TabNav>
                        <Tabs.TabNav value="system-vars" icon={<Database />}>
                            Variables del Sistema
                        </Tabs.TabNav>
                        <Tabs.TabNav value="user-management" icon={<Users />}>
                            Gestión de Usuarios
                        </Tabs.TabNav>
                        <Tabs.TabNav value="analytics" icon={<BarChart />}>
                            Analíticas
                        </Tabs.TabNav>
                    </Tabs.TabList>
                    <Tabs.TabContent value="overview">
                        <div className="p-4">
                            <AdminToolsOverview />
                        </div>
                    </Tabs.TabContent>
                    <Tabs.TabContent value="json-schemas">
                        <div className="p-4">
                            <h4 className="text-lg font-medium mb-2">Gestión de Esquemas JSON</h4>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                Acceda a la sección completa de esquemas JSON para administrar formularios dinámicos.
                            </p>
                            <div className="flex gap-2">
                                <a 
                                    href="/superadmin/admin-tools/json-schema-forms" 
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                >
                                    Ir a Esquemas JSON
                                </a>
                            </div>
                        </div>
                    </Tabs.TabContent>
                    <Tabs.TabContent value="system-vars">
                        <div className="p-4">
                            <h4 className="text-lg font-medium">Variables del Sistema</h4>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                Esta funcionalidad estará disponible próximamente.
                            </p>
                        </div>
                    </Tabs.TabContent>
                    <Tabs.TabContent value="user-management">
                        <div className="p-4">
                            <h4 className="text-lg font-medium">Gestión de Usuarios</h4>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                Esta funcionalidad estará disponible próximamente.
                            </p>
                        </div>
                    </Tabs.TabContent>
                    <Tabs.TabContent value="analytics">
                        <div className="p-4">
                            <h4 className="text-lg font-medium">Analíticas del Sistema</h4>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                Esta funcionalidad estará disponible próximamente.
                            </p>
                        </div>
                    </Tabs.TabContent>
                </Tabs>
            </Card>
        </div>
    )
}

export default AdminToolsPage
