/**
 * frontend/src/services/core/metricsService.ts
 * Servicio para obtener métricas para el dashboard de SuperAdmin
 * @version 1.0.0
 * @created 2025-05-01
 */

import { supabase } from '@/services/supabase/SupabaseClient'

// Tipos de métricas
export interface DashboardMetrics {
  verticalsCount: number
  plansCount: number
  activeMetricsCount: number
  verticalUsageData: Array<{
    id: string
    name: string
    code: string
    count: number
  }>
  planUsageData: Array<{
    id: string
    name: string
    count: number
  }>
  typeUsageData: Array<{
    id: string
    type_name: string
    vertical_name: string
    count: number
  }>
}

/**
 * Obtiene las métricas para el dashboard de SuperAdmin
 * @returns Objeto con las métricas del dashboard
 */
export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
  try {
    // 1. Obtener cuenta de verticales activas
    const { data: verticalsData, error: verticalsError } = await supabase
      .from('verticals')
      .select('id, name, code, is_active')
      .eq('is_active', true)

    if (verticalsError) throw verticalsError

    // 2. Obtener cuenta de planes activos
    const { data: plansData, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, name, is_active')
      .eq('is_active', true)

    if (plansError) throw plansError

    // 3. Obtener uso por vertical (count de tenants por vertical)
    const { data: verticalUsageData, error: verticalUsageError } = await supabase
      .from('tenants')
      .select(`
        id,
        vertical_id,
        verticals!inner(name, code)
      `)
      .not('vertical_id', 'is', null)

    if (verticalUsageError) throw verticalUsageError

    // 4. Obtener uso por plan (count de tenants por plan)
    const { data: planUsageData, error: planUsageError } = await supabase
      .from('tenants')
      .select(`
        id,
        plan_id,
        subscription_plans!inner(name)
      `)
      .not('plan_id', 'is', null)

    if (planUsageError) throw planUsageError

    // 5. Obtener uso por tipo (count de tenants por tipo de vertical)
    const { data: typeUsageData, error: typeUsageError } = await supabase
      .from('tenants')
      .select(`
        id,
        vertical_type_id,
        vertical_types!inner(
          id,
          name,
          verticals!inner(name)
        )
      `)
      .not('vertical_type_id', 'is', null)

    if (typeUsageError) throw typeUsageError

    // Procesar datos de uso por vertical
    const verticalCountMap: Record<string, number> = {}
    verticalUsageData?.forEach(tenant => {
      const verticalId = tenant.vertical_id
      verticalCountMap[verticalId] = (verticalCountMap[verticalId] || 0) + 1
    })

    const processedVerticalUsage = Object.entries(verticalCountMap).map(([verticalId, count]) => {
      const vertical = verticalsData?.find(v => v.id === verticalId)
      return {
        id: verticalId,
        name: vertical?.name || 'Unknown Vertical',
        code: vertical?.code || 'unknown',
        count
      }
    }).sort((a, b) => b.count - a.count)

    // Procesar datos de uso por plan
    const planCountMap: Record<string, number> = {}
    planUsageData?.forEach(tenant => {
      const planId = tenant.plan_id
      planCountMap[planId] = (planCountMap[planId] || 0) + 1
    })

    const processedPlanUsage = Object.entries(planCountMap).map(([planId, count]) => {
      const plan = plansData?.find(p => p.id === planId)
      return {
        id: planId,
        name: plan?.name || 'Unknown Plan',
        count
      }
    }).sort((a, b) => b.count - a.count)

    // Procesar datos de uso por tipo
    const typeCountMap: Record<string, number> = {}
    typeUsageData?.forEach(tenant => {
      const typeId = tenant.vertical_type_id
      typeCountMap[typeId] = (typeCountMap[typeId] || 0) + 1
    })

    const processedTypeUsage = Object.entries(typeCountMap).map(([typeId, count]) => {
      const typeInfo = typeUsageData?.find(t => t.vertical_type_id === typeId)?.vertical_types
      return {
        id: typeId,
        type_name: typeInfo?.name || 'Unknown Type',
        vertical_name: typeInfo?.verticals?.name || 'Unknown Vertical',
        count
      }
    }).sort((a, b) => b.count - a.count)

    return {
      verticalsCount: verticalsData?.length || 0,
      plansCount: plansData?.length || 0,
      activeMetricsCount: 3, // Valor fijo por ahora
      verticalUsageData: processedVerticalUsage,
      planUsageData: processedPlanUsage,
      typeUsageData: processedTypeUsage
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    throw new Error('Failed to load dashboard metrics')
  }
}
