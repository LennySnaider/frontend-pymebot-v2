/**
 * frontend/src/app/(protected-pages)/superadmin/admin-tools/json-schema-forms/_components/JsonSchemaUsageStats.tsx
 * Componente para visualizar estadísticas de uso de esquemas JSON en el sistema.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import Chart from '@/components/shared/Chart'
import { 
    PiChartPieDuotone,
    PiCalendarDuotone,
    PiUsersDuotone,
    PiArrowUpRightBold,
    PiDatabaseDuotone,
    PiBuildingsDuotone,
    PiFileDuotone
} from 'react-icons/pi'
import dynamic from 'next/dynamic'

// Colores para las gráficas
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#A4DE6C', '#D0ED57']

// Carga dinámica de los componentes de recharts para evitar errores de SSR
const RechartsComponents = dynamic(() => import('recharts').then(mod => {
  const { PieChart, Cell, Pie, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } = mod
  return { PieChart, Cell, Pie, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid }
}), { ssr: false })

// Datos simulados de uso de esquemas
const usageData = [
    {
        id: '1',
        name: 'Formulario de Contacto',
        category: 'form',
        uses: 42,
        tenants: 8,
        lastUsed: '2025-04-28T14:30:00',
    },
    {
        id: '2',
        name: 'Encuesta de Satisfacción',
        category: 'survey',
        uses: 18,
        tenants: 3,
        lastUsed: '2025-04-27T10:15:00',
    },
    {
        id: '3',
        name: 'Perfil de Usuario',
        category: 'user',
        uses: 57,
        tenants: 12,
        lastUsed: '2025-04-29T09:45:00',
    },
    {
        id: '4',
        name: 'Registro de Producto',
        category: 'product',
        uses: 24,
        tenants: 5,
        lastUsed: '2025-04-26T16:20:00',
    },
    {
        id: '5',
        name: 'Solicitud de Servicio',
        category: 'service',
        uses: 31,
        tenants: 7,
        lastUsed: '2025-04-28T11:10:00',
    },
    {
        id: '6',
        name: 'Formulario de Pedido',
        category: 'order',
        uses: 36,
        tenants: 6,
        lastUsed: '2025-04-29T13:25:00',
    },
]

// Datos agrupados por categoría
const categoryData = [
    { name: 'Formularios', value: 42, category: 'form' },
    { name: 'Encuestas', value: 18, category: 'survey' },
    { name: 'Usuarios', value: 57, category: 'user' },
    { name: 'Productos', value: 24, category: 'product' },
    { name: 'Servicios', value: 31, category: 'service' },
    { name: 'Pedidos', value: 36, category: 'order' },
]

// Datos por tenant
const tenantData = [
    { name: 'Salón de Belleza', schemas: 4, uses: 28 },
    { name: 'Consultorio Médico', schemas: 3, uses: 45 },
    { name: 'Inmobiliaria', schemas: 2, uses: 19 },
    { name: 'Seguros', schemas: 5, uses: 37 },
    { name: 'Retail', schemas: 3, uses: 23 },
]

// Datos para el gráfico de tendencia
const trendData = [
    { name: 'Ene', uses: 120 },
    { name: 'Feb', uses: 145 },
    { name: 'Mar', uses: 178 },
    { name: 'Abr', uses: 208 },
    { name: 'May', uses: 243 },
    { name: 'Jun', uses: 264 },
    { name: 'Jul', uses: 281 },
    { name: 'Ago', uses: 307 },
    { name: 'Sep', uses: 342 },
    { name: 'Oct', uses: 389 },
    { name: 'Nov', uses: 421 },
    { name: 'Dic', uses: 457 },
]

// Conversión de datos para gráficos compatibles con Chart
const categoryChartData = {
    series: [{ data: categoryData.map(item => item.value) }],
    labels: categoryData.map(item => item.name),
}

// Datos para gráfico de tenants
const tenantChartData = {
    series: [
        {
            name: 'Esquemas',
            data: tenantData.map(item => item.schemas)
        },
        {
            name: 'Usos',
            data: tenantData.map(item => item.uses)
        }
    ],
    xAxis: tenantData.map(item => item.name)
}

// Datos para gráfico de tendencia
const trendChartData = {
    series: [
        {
            name: 'Usos Totales',
            data: trendData.map(item => item.uses)
        }
    ],
    xAxis: trendData.map(item => item.name)
}

// Componente para mostrar estadísticas de uso
const JsonSchemaUsageStats = () => {
    const [timeRange, setTimeRange] = useState('month')
    
    // Calcular totales
    const totalSchemas = usageData.length
    const totalUses = usageData.reduce((sum, schema) => sum + schema.uses, 0)
    const totalTenants = Math.max(...usageData.map(schema => schema.tenants))
    
    // Top esquemas por uso
    const topSchemas = [...usageData].sort((a, b) => b.uses - a.uses).slice(0, 3)
    
    // Función para renderizar el color por categoría
    const getCategoryColor = (category: string) => {
        const colorMap: Record<string, string> = {
            form: 'bg-blue-500',
            survey: 'bg-green-500',
            user: 'bg-purple-500',
            product: 'bg-amber-500',
            service: 'bg-red-500',
            order: 'bg-indigo-500',
        }
        
        return colorMap[category] || 'bg-gray-500'
    }
    
    // Función para formatear fechas
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium">Estadísticas de Uso de Esquemas JSON</h4>
                <div className="w-48">
                    <Select
                        options={[
                            { value: 'week', label: 'Última Semana' },
                            { value: 'month', label: 'Último Mes' },
                            { value: 'quarter', label: 'Último Trimestre' },
                            { value: 'year', label: 'Último Año' },
                            { value: 'all', label: 'Todo el Tiempo' },
                        ]}
                        value={timeRange}
                        onChange={setTimeRange}
                    />
                </div>
            </div>

            {/* Cards de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
                            <PiFileDuotone size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total de Esquemas</div>
                            <div className="text-2xl font-semibold">{totalSchemas}</div>
                        </div>
                    </div>
                </Card>
                
                <Card className="p-4">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
                            <PiChartPieDuotone size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total de Usos</div>
                            <div className="text-2xl font-semibold">{totalUses}</div>
                        </div>
                    </div>
                </Card>
                
                <Card className="p-4">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-4">
                            <PiBuildingsDuotone size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Tenants Activos</div>
                            <div className="text-2xl font-semibold">{totalTenants}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                    <h5 className="font-medium mb-4">Uso por Categoría</h5>
                    <div className="h-72">
                        {RechartsComponents ? (
                            <RechartsComponents.ResponsiveContainer width="100%" height="100%">
                                <RechartsComponents.PieChart>
                                    <RechartsComponents.Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <RechartsComponents.Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </RechartsComponents.Pie>
                                    <RechartsComponents.Tooltip formatter={(value) => [`${value} usos`, 'Usos']} />
                                    <RechartsComponents.Legend />
                                </RechartsComponents.PieChart>
                            </RechartsComponents.ResponsiveContainer>
                        ) : (
                            <div className="flex justify-center items-center h-full">
                                <p>Cargando gráfico...</p>
                            </div>
                        )}
                    </div>
                </Card>
                
                <Card className="p-4">
                    <h5 className="font-medium mb-4">Top Tenants por Uso</h5>
                    <div className="h-72">
                        {RechartsComponents ? (
                            <RechartsComponents.ResponsiveContainer width="100%" height="100%">
                                <RechartsComponents.BarChart
                                    data={tenantData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <RechartsComponents.CartesianGrid strokeDasharray="3 3" />
                                    <RechartsComponents.XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <RechartsComponents.YAxis />
                                    <RechartsComponents.Tooltip />
                                    <RechartsComponents.Legend />
                                    <RechartsComponents.Bar dataKey="uses" name="Usos" fill="#8884d8" />
                                    <RechartsComponents.Bar dataKey="schemas" name="Esquemas" fill="#82ca9d" />
                                </RechartsComponents.BarChart>
                            </RechartsComponents.ResponsiveContainer>
                        ) : (
                            <div className="flex justify-center items-center h-full">
                                <p>Cargando gráfico...</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Tendencia de uso */}
            <Card className="p-4">
                <h5 className="font-medium mb-4">Tendencia de Uso</h5>
                <div className="h-72">
                    {RechartsComponents ? (
                        <RechartsComponents.ResponsiveContainer width="100%" height="100%">
                            <RechartsComponents.BarChart
                                data={trendData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <RechartsComponents.CartesianGrid strokeDasharray="3 3" />
                                <RechartsComponents.XAxis dataKey="name" />
                                <RechartsComponents.YAxis />
                                <RechartsComponents.Tooltip />
                                <RechartsComponents.Legend />
                                <RechartsComponents.Bar dataKey="uses" name="Usos Totales" fill="#0088FE" />
                            </RechartsComponents.BarChart>
                        </RechartsComponents.ResponsiveContainer>
                    ) : (
                        <div className="flex justify-center items-center h-full">
                            <p>Cargando gráfico...</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Tabla de esquemas más usados */}
            <Card className="p-4">
                <h5 className="font-medium mb-4">Esquemas Más Utilizados</h5>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Esquema
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Categoría
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Usos
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Tenants
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Último Uso
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                            {usageData.map((schema) => (
                                <tr key={schema.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium">{schema.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge className={`${getCategoryColor(schema.category)} text-white`}>
                                            {schema.category}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="font-medium">{schema.uses}</span>
                                            {topSchemas.includes(schema) && (
                                                <PiArrowUpRightBold className="ml-1 text-green-500" size={16} />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <PiBuildingsDuotone className="mr-1 text-gray-500" size={14} />
                                            <span>{schema.tenants}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-gray-600 dark:text-gray-400">
                                            {formatDate(schema.lastUsed)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <h5 className="font-medium mb-2 text-blue-700 dark:text-blue-300">
                    Notas para el Superadmin
                </h5>
                <ul className="list-disc pl-4 text-blue-600 dark:text-blue-400 space-y-2">
                    <li>Las estadísticas de uso ayudan a identificar qué esquemas son más populares entre los tenants.</li>
                    <li>Considere crear esquemas predefinidos adicionales basados en los patrones de uso populares.</li>
                    <li>Los esquemas con bajo uso podrían requerir mejoras o promoción adicional para los tenants.</li>
                    <li>El uso creciente de esquemas JSON indica una adopción exitosa de la funcionalidad de formularios dinámicos.</li>
                </ul>
            </div>
        </div>
    )
}

export default JsonSchemaUsageStats