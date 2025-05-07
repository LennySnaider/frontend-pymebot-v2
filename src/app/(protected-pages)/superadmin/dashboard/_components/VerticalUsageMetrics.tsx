/**
 * frontend/src/app/(protected-pages)/superadmin/dashboard/_components/VerticalUsageMetrics.tsx
 * Componente para mostrar métricas de uso de verticales y planes por tenants
 * @version 1.1.0
 * @updated 2025-05-01
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, Avatar, Select, Spinner, Badge, Alert, Button } from '@/components/ui'
import { 
    PiChartBarBold, 
    PiArrowsCounterClockwiseBold,
    PiChartPieBold
} from 'react-icons/pi'
import { useVerticalsStore } from '@/app/(protected-pages)/superadmin/subscription-plans/_store/verticalsStore'
import { usePlansStore } from '@/app/(protected-pages)/superadmin/subscription-plans/_store/plansStore'
import { fetchDashboardMetrics } from '@/services/core/metricsService'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'

// Tipos de datos
interface VerticalMetric {
    id: string
    vertical_id: string
    vertical_name: string
    vertical_code: string
    count: number
    color: string
}

interface PlanMetric {
    id: string
    plan_id: string
    plan_name: string
    count: number
    color: string
}

interface TypeMetric {
    id: string
    type_id: string
    type_name: string
    vertical_name: string
    count: number
    color: string
}

// Colores para los gráficos
const CHART_COLORS = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
    '#f97316', // orange-500
    '#84cc16', // lime-500
]

const VerticalUsageMetrics = () => {
    // Estados
    const [verticalMetrics, setVerticalMetrics] = useState<VerticalMetric[]>([])
    const [planMetrics, setPlanMetrics] = useState<PlanMetric[]>([])
    const [typeMetrics, setTypeMetrics] = useState<TypeMetric[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [chartView, setChartView] = useState<'vertical' | 'plan' | 'type'>('vertical')
    const [selectedVertical, setSelectedVertical] = useState<string>('')
    
    // Obtener verticales y planes
    const { verticals } = useVerticalsStore()
    const { plans } = usePlansStore()
    
    // Cargar datos
    const fetchMetrics = async () => {
        setLoading(true)
        setError(null)
        
        try {
            // Obtener métricas del servicio
            const metrics = await fetchDashboardMetrics()
            
            // Procesar datos para verticales
            const processedVerticalMetrics: VerticalMetric[] = metrics.verticalUsageData.map((item, index) => ({
                id: `v-${item.id}`,
                vertical_id: item.id,
                vertical_name: item.name,
                vertical_code: item.code,
                count: item.count,
                color: CHART_COLORS[index % CHART_COLORS.length]
            }))
            
            // Procesar datos para planes
            const processedPlanMetrics: PlanMetric[] = metrics.planUsageData.map((item, index) => ({
                id: `p-${item.id}`,
                plan_id: item.id,
                plan_name: item.name,
                count: item.count,
                color: CHART_COLORS[index % CHART_COLORS.length]
            }))
            
            // Procesar datos para tipos
            const processedTypeMetrics: TypeMetric[] = metrics.typeUsageData.map((item, index) => ({
                id: `t-${item.id}`,
                type_id: item.id,
                type_name: item.type_name,
                vertical_name: item.vertical_name,
                count: item.count,
                color: CHART_COLORS[index % CHART_COLORS.length]
            }))
            
            // Actualizar el estado
            setVerticalMetrics(processedVerticalMetrics)
            setPlanMetrics(processedPlanMetrics)
            setTypeMetrics(processedTypeMetrics)
            
        } catch (err) {
            console.error('Error fetching metrics:', err)
            setError('Error al cargar las métricas de uso. Intente nuevamente más tarde.')
        } finally {
            setLoading(false)
        }
    }
    
    // Cargar datos al montar el componente
    useEffect(() => {
        if (verticals.length > 0 && plans.length > 0) {
            fetchMetrics()
        }
    }, [verticals, plans])
    
    // Opciones de verticales para filtro
    const verticalOptions = [
        { value: '', label: 'Todas las Verticales' },
        ...verticals.map(vertical => ({
            value: vertical.id,
            label: vertical.name
        }))
    ]
    
    // Filtrar datos por vertical si se selecciona una
    const filteredTypeMetrics = selectedVertical
        ? typeMetrics.filter(metric => {
            const verticalType = typeMetrics.find(t => t.type_id === metric.type_id)
            const vertical = verticals.find(v => v.name === verticalType?.vertical_name)
            return vertical?.id === selectedVertical
        })
        : typeMetrics
    
    // Filtrar datos por vertical si se selecciona una
    const filteredPlanMetrics = planMetrics
    
    // Transformar datos para gráfico de barras verticales
    const verticalBarData = verticalMetrics.map(metric => ({
        name: metric.vertical_name,
        value: metric.count,
        color: metric.color
    }))
    
    // Transformar datos para gráfico de barras planes
    const planBarData = filteredPlanMetrics.map(metric => ({
        name: metric.plan_name,
        value: metric.count,
        color: metric.color
    }))
    
    // Transformar datos para gráfico de barras tipos
    const typeBarData = filteredTypeMetrics.map(metric => ({
        name: metric.type_name,
        fullName: `${metric.type_name} (${metric.vertical_name})`,
        value: metric.count,
        color: metric.color
    }))
    
    // Determinar qué datos mostrar según la vista seleccionada
    const chartData = chartView === 'vertical' 
        ? verticalBarData 
        : chartView === 'plan' 
            ? planBarData 
            : typeBarData
    
    return (
        <Card bodyClass="p-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                    <PiChartBarBold className="text-blue-500 text-xl mr-2" />
                    <h5 className="text-lg font-medium">Métricas de Uso</h5>
                </div>
                <div className="flex items-center">
                    <Button
                        size="sm"
                        variant="plain"
                        icon={<PiArrowsCounterClockwiseBold />}
                        onClick={fetchMetrics}
                        loading={loading}
                        className="mr-2"
                    >
                        Actualizar
                    </Button>
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="col-span-2">
                    <div className="flex space-x-2 mb-4">
                        <Button
                            size="sm"
                            variant={chartView === 'vertical' ? 'solid' : 'twoTone'}
                            onClick={() => setChartView('vertical')}
                        >
                            Verticales
                        </Button>
                        <Button
                            size="sm"
                            variant={chartView === 'plan' ? 'solid' : 'twoTone'}
                            onClick={() => setChartView('plan')}
                        >
                            Planes
                        </Button>
                        <Button
                            size="sm"
                            variant={chartView === 'type' ? 'solid' : 'twoTone'}
                            onClick={() => setChartView('type')}
                        >
                            Tipos
                        </Button>
                        
                        {chartView === 'type' && (
                            <div className="ml-auto">
                                <Select
                                    options={verticalOptions}
                                    value={verticalOptions.find(o => o.value === selectedVertical)}
                                    onChange={(option) => setSelectedVertical(option?.value || '')}
                                    placeholder="Filtrar por vertical"
                                    className="min-w-[200px]"
                                    size="sm"
                                />
                            </div>
                        )}
                    </div>
                    
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Spinner size="lg" />
                        </div>
                    ) : error ? (
                        <Alert type="danger" showIcon className="mb-4">
                            {error}
                        </Alert>
                    ) : chartData.length === 0 ? (
                        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <PiChartPieBold className="mx-auto text-4xl text-gray-400 mb-2" />
                            <p className="text-gray-500">
                                No hay datos disponibles para mostrar
                            </p>
                        </div>
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{
                                        top: 5,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis 
                                        dataKey={chartView === 'type' ? 'fullName' : 'name'} 
                                        tick={{ fontSize: 12 }} 
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis 
                                        allowDecimals={false}
                                        tickFormatter={(value) => value.toString()}
                                    />
                                    <Tooltip 
                                        formatter={(value) => [`${value} tenants`, chartView === 'vertical' ? 'Vertical' : chartView === 'plan' ? 'Plan' : 'Tipo']}
                                        labelFormatter={(label) => [`${label}`]}
                                    />
                                    <Bar 
                                        dataKey="value" 
                                        name={chartView === 'vertical' ? 'Tenants por Vertical' : chartView === 'plan' ? 'Tenants por Plan' : 'Tenants por Tipo'}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
                
                <div>
                    <h6 className="font-medium mb-3">
                        {chartView === 'vertical' 
                            ? 'Uso por Vertical' 
                            : chartView === 'plan' 
                                ? 'Uso por Plan' 
                                : 'Uso por Tipo'}
                    </h6>
                    
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Spinner />
                        </div>
                    ) : error ? (
                        <Alert type="danger" showIcon className="mb-4">
                            {error}
                        </Alert>
                    ) : chartData.length === 0 ? (
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <p className="text-gray-500 text-sm">
                                No hay datos disponibles
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={30}
                                            outerRadius={60}
                                            fill="#8884d8"
                                            paddingAngle={2}
                                            dataKey="value"
                                            nameKey="name"
                                            label={(entry) => `${Math.round((entry.percent || 0) * 100)}%`}
                                            labelLine={false}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [`${value} tenants`, 'Cantidad']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                {chartData.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                                        <div className="flex items-center">
                                            <div 
                                                className="w-3 h-3 rounded-full mr-2" 
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <div className="text-sm">
                                                {chartView === 'type' ? item.fullName : item.name}
                                            </div>
                                        </div>
                                        <Badge className="bg-blue-500">
                                            {item.value}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Card>
    )
}

export default VerticalUsageMetrics