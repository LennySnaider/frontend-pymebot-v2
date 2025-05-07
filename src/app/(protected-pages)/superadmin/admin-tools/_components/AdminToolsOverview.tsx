/**
 * frontend/src/app/(protected-pages)/superadmin/admin-tools/_components/AdminToolsOverview.tsx
 * Componente que muestra una descripción general de las herramientas administrativas disponibles.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { FileJson, Database, Users, BarChart, Settings, Tool } from '../icons'

interface AdminToolCardProps {
    title: string
    description: string
    icon: React.ReactNode
    linkTo: string
    available?: boolean
}

const AdminToolCard = ({ title, description, icon, linkTo, available = true }: AdminToolCardProps) => {
    const router = useRouter()

    return (
        <Card
            className={`p-4 h-full flex flex-col ${
                available
                    ? 'cursor-pointer hover:shadow-md transition-shadow'
                    : 'opacity-75 cursor-not-allowed'
            }`}
            onClick={() => available && router.push(linkTo)}
        >
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    {icon}
                </div>
                <div>
                    <h4 className="font-medium mb-1">{title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                </div>
            </div>
            <div className="mt-auto pt-4">
                <Button
                    disabled={!available}
                    variant={available ? 'twoTone' : 'plain'}
                    block
                >
                    {available ? 'Acceder' : 'Próximamente'}
                </Button>
            </div>
        </Card>
    )
}

const AdminToolsOverview = () => {
    const adminTools = [
        {
            title: 'Esquemas JSON',
            description: 'Cree y administre esquemas JSON para formularios dinámicos en toda la plataforma.',
            icon: <FileJson size={24} className="text-blue-600 dark:text-blue-400" />,
            linkTo: '/superadmin/admin-tools/json-schema-forms',
            available: true,
        },
        {
            title: 'Variables del Sistema',
            description: 'Configure variables del sistema accesibles desde cualquier módulo o vertical.',
            icon: <Database size={24} className="text-green-600 dark:text-green-400" />,
            linkTo: '/superadmin/admin-tools/system-variables',
            available: false,
        },
        {
            title: 'Gestión de Usuarios',
            description: 'Administre usuarios, permisos y roles a nivel global del sistema.',
            icon: <Users size={24} className="text-purple-600 dark:text-purple-400" />,
            linkTo: '/superadmin/admin-tools/user-management',
            available: false,
        },
        {
            title: 'Analíticas del Sistema',
            description: 'Visualice métricas y estadísticas de uso de toda la plataforma.',
            icon: <BarChart size={24} className="text-orange-600 dark:text-orange-400" />,
            linkTo: '/superadmin/admin-tools/analytics',
            available: false,
        },
        {
            title: 'Configuración Global',
            description: 'Ajuste configuraciones que afectan a toda la plataforma.',
            icon: <Settings size={24} className="text-red-600 dark:text-red-400" />,
            linkTo: '/superadmin/admin-tools/global-settings',
            available: false,
        },
        {
            title: 'Herramientas de Desarrollo',
            description: 'Utilidades para desarrolladores y administradores técnicos.',
            icon: <Tool size={24} className="text-gray-600 dark:text-gray-400" />,
            linkTo: '/superadmin/admin-tools/dev-tools',
            available: false,
        },
    ]

    return (
        <div>
            <h4 className="text-lg font-medium mb-4">Herramientas Disponibles</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminTools.map((tool, index) => (
                    <AdminToolCard key={index} {...tool} />
                ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <h5 className="font-medium mb-2 text-blue-700 dark:text-blue-300">
                    Acceso Restringido
                </h5>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                    Estas herramientas son de uso exclusivo para superadministradores del sistema.
                    Las modificaciones realizadas aquí pueden afectar a todos los tenants y verticales
                    de la plataforma. Utilice con precaución.
                </p>
            </div>
        </div>
    )
}

export default AdminToolsOverview
