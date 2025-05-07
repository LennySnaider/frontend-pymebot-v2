/**
 * frontend/src/app/(protected-pages)/superadmin/dashboard/page.tsx
 * Página principal del dashboard de superadmin con métricas
 * @version 1.1.0
 * @updated 2025-05-01
 */

'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/layouts/admin/AdminLayout'
import { Button, Card, Spinner } from '@/components/ui'
import VerticalUsageMetrics from './_components/VerticalUsageMetrics'
import { PiChartLineUpBold, PiStorefrontBold, PiRocketLaunchBold, PiArrowsCounterClockwiseBold } from 'react-icons/pi'
import { useVerticalsStore } from '@/app/(protected-pages)/superadmin/subscription-plans/_store/verticalsStore'
import { usePlansStore } from '@/app/(protected-pages)/superadmin/subscription-plans/_store/plansStore'
import { fetchDashboardMetrics } from '@/services/core/metricsService'

const SuperAdminDashboard = () => {
    // Cargar datos necesarios para las métricas
    const { verticals, fetchVerticals } = useVerticalsStore()
    const { plans, fetchPlans } = usePlansStore()
    const [metrics, setMetrics] = useState({ verticalsCount: 0, plansCount: 0, activeMetricsCount: 0 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // Función para cargar las métricas
    const loadMetrics = async () => {
        try {
            setLoading(true)
            const data = await fetchDashboardMetrics()
            setMetrics({
                verticalsCount: data.verticalsCount,
                plansCount: data.plansCount,
                activeMetricsCount: data.activeMetricsCount
            })
            setError(null)
        } catch (err) {
            console.error('Error loading dashboard metrics:', err)
            setError('Error al cargar las métricas')
        } finally {
            setLoading(false)
        }
    }
    
    // Efecto para cargar los datos de verticales y planes
    useEffect(() => {
        // Cargar datos al montar el componente si no están ya cargados
        if (verticals.length === 0) {
            fetchVerticals()
        }
        
        if (plans.length === 0) {
            fetchPlans()
        }
        
        // Cargar métricas cuando se hayan cargado verticales y planes
        if (verticals.length > 0 && plans.length > 0) {
            loadMetrics()
        }
    }, [verticals.length, plans.length, fetchVerticals, fetchPlans])
    
    return (
        <AdminLayout>
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Dashboard SuperAdmin</h2>
                    <Button 
                        size="sm" 
                        variant="twoTone" 
                        color="blue"
                        icon={<PiArrowsCounterClockwiseBold />}
                        onClick={loadMetrics}
                        loading={loading}
                    >
                        Actualizar
                    </Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <Card bodyClass="p-5">
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center mr-4">
                                <PiStorefrontBold className="text-2xl" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Verticales Activas</div>
                                <div className="text-2xl font-semibold">
                                    {loading ? (
                                        <Spinner size="sm" className="mr-1" />
                                    ) : (
                                        metrics.verticalsCount
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                    
                    <Card bodyClass="p-5">
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center mr-4">
                                <PiRocketLaunchBold className="text-2xl" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Planes Disponibles</div>
                                <div className="text-2xl font-semibold">
                                    {loading ? (
                                        <Spinner size="sm" className="mr-1" />
                                    ) : (
                                        metrics.plansCount
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                    
                    <Card bodyClass="p-5">
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 flex items-center justify-center mr-4">
                                <PiChartLineUpBold className="text-2xl" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Métricas Activadas</div>
                                <div className="text-2xl font-semibold">
                                    {loading ? (
                                        <Spinner size="sm" className="mr-1" />
                                    ) : (
                                        metrics.activeMetricsCount
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
                
                <div className="mb-8">
                    <VerticalUsageMetrics />
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                    <p>Datos actualizados en tiempo real. Las métricas se calculan a partir de los tenants activos en el sistema.</p>
                </div>
            </div>
        </AdminLayout>
    )
}

export default SuperAdminDashboard