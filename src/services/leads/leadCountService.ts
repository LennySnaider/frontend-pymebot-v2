/**
 * leadCountService.ts
 * Servicio centralizado para contar leads con criterios unificados
 * entre sales funnel y chat
 *
 * @version 2.0.0
 * @updated 2025-05-19
 */

import { createClient, createServiceClient } from '@/services/supabase/server';
import { createClient as createPublicClient } from '@supabase/supabase-js';

/**
 * Criterios unificados para filtrar leads
 */
export interface LeadFilterCriteria {
  tenant_id: string;
  includeClosedStatus?: boolean;
  includeRemovedFromFunnel?: boolean;
  includeDeleted?: boolean;
  stages?: string[];
  agentId?: string;
}

/**
 * Mapeo unificado de etapas para normalización
 */
export const UNIFIED_STAGE_MAPPING: Record<string, string> = {
  // Español -> Inglés
  'nuevos': 'new',
  'prospectando': 'prospecting',
  'calificacion': 'qualification',  
  'calificación': 'qualification', // con tilde
  'oportunidad': 'opportunity',
  'confirmado': 'confirmed',
  'cerrado': 'closed',
  
  // Variaciones en inglés
  'first_contact': 'new',
  'new': 'new',
  'prospecting': 'prospecting',
  'qualification': 'qualification',
  'opportunity': 'opportunity',
  'confirmed': 'confirmed',
  'closed': 'closed'
};

/**
 * Etapas que se muestran en el funnel y chat
 */
export const DISPLAY_STAGES = ['new', 'prospecting', 'qualification', 'opportunity'];

// Cache para almacenar resultados y minimizar consultas a la BD
const countsCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 60000; // 1 minuto por defecto

/**
 * Obtiene leads con criterios unificados
 */
export async function getLeadsWithUnifiedCriteria(criteria: LeadFilterCriteria) {
  try {
    // Generar clave de cache
    const cacheKey = `leads_${JSON.stringify(criteria)}`;
    const cachedData = countsCache.get(cacheKey);
    const now = Date.now();
    
    // Verificar si hay datos en cache válidos
    if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
      return cachedData.data;
    }
    
    // En desarrollo usar service client, en producción usar el cliente regular
    const supabase = process.env.NODE_ENV === 'development' 
      ? createServiceClient()
      : await createClient();

    if (!supabase) {
      console.error('Error: No se pudo obtener el cliente Supabase.');
      throw new Error('No se pudo crear el cliente de Supabase');
    }

    // Query base
    let query = supabase
      .from('leads')
      .select(`
        id,
        full_name,
        email,
        phone,
        stage,
        status,
        metadata,
        created_at,
        updated_at,
        tenant_id,
        agent_id
      `)
      .eq('tenant_id', criteria.tenant_id)
      .order('created_at', { ascending: false });

    // Aplicar filtro de status cerrado si está configurado
    if (!criteria.includeClosedStatus) {
      query = query.not('status', 'eq', 'closed');
    }
    
    // Filtrar por agente si se proporciona
    if (criteria.agentId) {
      query = query.eq('agent_id', criteria.agentId);
    }
    
    // No hay columna is_deleted en la tabla
    // Usamos metadata.is_deleted como alternativa si existe
    if (!criteria.includeDeleted) {
      // No aplicamos filtro por is_deleted, será filtrado post-query
    }

    const { data: leadsData, error } = await query;

    if (error) {
      console.error('Error al obtener leads:', error.message || error);
      throw new Error(`Error obteniendo leads: ${error.message || 'Error desconocido'}`);
    }

    if (!leadsData || leadsData.length === 0) {
      return [];
    }

    // Aplicar filtros post-query de manera consistente
    let filteredLeads = leadsData;

    // Filtrar por stage usando mapeo unificado
    filteredLeads = filteredLeads.filter(lead => {
      if (!lead.stage) {
        return false;
      }
      
      const normalizedStage = UNIFIED_STAGE_MAPPING[lead.stage.toLowerCase()] || lead.stage.toLowerCase();
      
      // Si se especifican stages, filtrar por ellas
      if (criteria.stages && criteria.stages.length > 0) {
        return criteria.stages.includes(normalizedStage);
      }
      
      // Por defecto, usar las etapas de display
      return DISPLAY_STAGES.includes(normalizedStage);
    });

    // Filtrar leads removidos del funnel si está configurado
    if (!criteria.includeRemovedFromFunnel) {
      filteredLeads = filteredLeads.filter(lead => {
        return !lead.metadata?.removed_from_funnel;
      });
    }

    // Filtrar leads marcados como eliminados en metadata
    if (!criteria.includeDeleted) {
      filteredLeads = filteredLeads.filter(lead => {
        return !lead.metadata?.is_deleted;
      });
    }

    // Filtrar por status adicionales
    filteredLeads = filteredLeads.filter(lead => {
      if (!criteria.includeClosedStatus) {
        return lead.status !== 'closed';
      }
      return true;
    });
    
    // Guardar en cache
    countsCache.set(cacheKey, { 
      data: filteredLeads,
      timestamp: now
    });

    return filteredLeads;

  } catch (error) {
    console.error('Error en getLeadsWithUnifiedCriteria:', error);
    // Asegurar que siempre retornamos un array vacío en caso de error
    return [];
  }
}

/**
 * Obtiene conteo de leads por etapa para un tenant
 */
export async function getLeadCountsByStage(
  tenantId: string, 
  options: { includeClosedStatus?: boolean, includeDeleted?: boolean } = {}
) {
  try {
    const { includeClosedStatus = false, includeDeleted = false } = options;
    
    // Intentar obtener de cache
    const cacheKey = `counts_${tenantId}_${includeClosedStatus}_${includeDeleted}`;
    const cachedData = countsCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
      return cachedData.data;
    }
    
    // Si no hay en cache, consultar a la BD - usar cliente directo
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Intentar usar RPC, si no usar alternativa
    try {
      // Construir query con RPC (para evitar limitaciones de RLS)
      const { data, error } = await supabase.rpc('get_lead_counts_by_stage', {
        p_tenant_id: tenantId,
        p_include_closed: includeClosedStatus,
        p_include_deleted: includeDeleted
      });
      
      if (error) {
        throw error;
      }
      
      // Guardar resultado en cache
      countsCache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (rpcError) {
      console.error('Error al obtener conteo de leads mediante RPC:', rpcError);
      
      // Plan B: Usar query directa (más lenta pero como fallback)
      const leads = await getLeadsWithUnifiedCriteria({
        tenant_id: tenantId,
        includeClosedStatus,
        includeDeleted
      });
      
      // Contar manualmente
      const result = {
        new: leads.filter(l => UNIFIED_STAGE_MAPPING[l.stage?.toLowerCase()] === 'new').length,
        prospecting: leads.filter(l => UNIFIED_STAGE_MAPPING[l.stage?.toLowerCase()] === 'prospecting').length,
        qualification: leads.filter(l => UNIFIED_STAGE_MAPPING[l.stage?.toLowerCase()] === 'qualification').length,
        opportunity: leads.filter(l => UNIFIED_STAGE_MAPPING[l.stage?.toLowerCase()] === 'opportunity').length,
        confirmed: leads.filter(l => UNIFIED_STAGE_MAPPING[l.stage?.toLowerCase()] === 'confirmed').length,
        closed: leads.filter(l => UNIFIED_STAGE_MAPPING[l.stage?.toLowerCase()] === 'closed').length,
        total: leads.length
      };
      
      // Guardar en cache
      countsCache.set(cacheKey, { data: result, timestamp: now });
      return result;
    }
    
  } catch (error) {
    console.error('Error en getLeadCountsByStage:', error);
    // Estructura por defecto en caso de error
    return {
      new: 0,
      prospecting: 0,
      qualification: 0,
      opportunity: 0,
      confirmed: 0,
      closed: 0,
      total: 0
    };
  }
}

/**
 * Obtiene leads para el sales funnel con criterios unificados
 */
export async function getLeadsForSalesFunnel(tenantId: string) {
  try {
    const leads = await getLeadsWithUnifiedCriteria({
      tenant_id: tenantId,
      includeClosedStatus: false,
      includeRemovedFromFunnel: false,
      includeDeleted: false,
      stages: DISPLAY_STAGES
    });
    return leads || [];
  } catch (error) {
    console.error('Error en getLeadsForSalesFunnel:', error);
    return [];
  }
}

/**
 * Obtiene leads para el chat con criterios unificados
 */
export async function getLeadsForChat(tenantId: string) {
  try {
    const leads = await getLeadsWithUnifiedCriteria({
      tenant_id: tenantId,
      includeClosedStatus: false,
      includeRemovedFromFunnel: false,
      includeDeleted: false,
      stages: DISPLAY_STAGES
    });
    return leads || [];
  } catch (error) {
    console.error('Error en getLeadsForChat:', error);
    return [];
  }
}

/**
 * Valida la consistencia entre sales funnel y chat
 */
export async function validateLeadCountConsistency(tenantId: string) {
  const salesFunnelLeads = await getLeadsForSalesFunnel(tenantId);
  const chatLeads = await getLeadsForChat(tenantId);
  
  const salesFunnelCount = salesFunnelLeads.length;
  const chatCount = chatLeads.length;
  
  const isConsistent = salesFunnelCount === chatCount;
  
  if (!isConsistent) {
    console.warn(`Discrepancia en conteo de leads:`);
    console.warn(`Sales Funnel: ${salesFunnelCount} leads`);
    console.warn(`Chat: ${chatCount} leads`);
    
    // Encontrar diferencias
    const salesFunnelIds = salesFunnelLeads.map(l => l.id);
    const chatIds = chatLeads.map(l => l.id);
    
    const onlyInSalesFunnel = salesFunnelIds.filter(id => !chatIds.includes(id));
    const onlyInChat = chatIds.filter(id => !salesFunnelIds.includes(id));
    
    if (onlyInSalesFunnel.length > 0) {
      console.warn(`Leads solo en Sales Funnel: ${onlyInSalesFunnel.join(', ')}`);
    }
    if (onlyInChat.length > 0) {
      console.warn(`Leads solo en Chat: ${onlyInChat.join(', ')}`);
    }
  }
  
  return {
    isConsistent,
    salesFunnelCount,
    chatCount,
    difference: Math.abs(salesFunnelCount - chatCount)
  };
}

/**
 * Fuerza una actualización del cache para un tenant específico
 */
export function invalidateLeadCountCache(tenantId?: string): void {
  if (tenantId) {
    // Invalidar solo el tenant específico
    for (const [key, _] of countsCache.entries()) {
      if (key.includes(tenantId)) {
        countsCache.delete(key);
      }
    }
  } else {
    // Invalidar todo el cache
    countsCache.clear();
  }
}

/**
 * Configura un suscriptor para actualizaciones de leads
 */
export function setupLeadCountsListener(tenantId: string, callback: (data: any) => void) {
  // Solo ejecutar en el navegador
  if (typeof window === 'undefined') {
    return () => {}; // Función vacía para SSR
  }
  
  const supabase = createPublicClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const subscription = supabase
    .channel('leads-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: tenantId ? `tenant_id=eq.${tenantId}` : undefined
      },
      async () => {
        // Invalidar cache
        invalidateLeadCountCache(tenantId);
        
        // Obtener nuevos datos
        const counts = await getLeadCountsByStage(tenantId);
        
        // Notificar al callback
        callback(counts);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(subscription);
  };
}

// Exportación por defecto para uso fácil
export default {
  getLeadsWithUnifiedCriteria,
  getLeadCountsByStage,
  getLeadsForSalesFunnel,
  getLeadsForChat,
  validateLeadCountConsistency,
  invalidateLeadCountCache,
  setupLeadCountsListener,
  UNIFIED_STAGE_MAPPING,
  DISPLAY_STAGES
};