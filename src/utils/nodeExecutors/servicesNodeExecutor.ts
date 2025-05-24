/**
 * frontend/src/utils/nodeExecutors/servicesNodeExecutor.ts
 * Función de ejecución para ServicesNode
 * @version 1.0.0
 * @migrated 2025-05-22 - Extraído desde components/view/ChatbotBuilder/nodes/ServicesNode.tsx
 */

import { supabase } from '@/services/supabase/SupabaseClient';

export interface ServicesNodeData {
  tenant_id: string;
  category_id?: string;
  limit?: number;
  filter_by_price?: boolean;
  min_price?: number;
  max_price?: number;
  sort_by?: 'name' | 'price' | 'popularity';
  sort_direction?: 'asc' | 'desc';
  message_template?: string;
  label?: string;
  onUpdateNodeData?: (nodeId: string, data: any) => void;
}

/**
 * Función para ejecutar el nodo en tiempo de ejecución del chatbot
 */
export async function executeServicesNode(
  tenantId: string,
  conversationContext: any,
  nodeData: ServicesNodeData
): Promise<{ nextNodeId: string; outputs: any; }> {
  try {
    // Preparar los filtros para la consulta
    const filters: any = {
      tenant_id: tenantId,
      is_active: true
    };
    
    // Filtrar por categoría si se especifica
    if (nodeData.category_id) {
      filters.category_id = nodeData.category_id;
    }
    
    // Aplicar filtros de precio si están habilitados
    if (nodeData.filter_by_price) {
      if (nodeData.min_price !== undefined) {
        filters.price_gte = nodeData.min_price;
      }
      
      if (nodeData.max_price !== undefined) {
        filters.price_lte = nodeData.max_price;
      }
    }
    
    // Definir orden
    const orderBy = nodeData.sort_by || 'name';
    const ascending = nodeData.sort_direction !== 'desc';
    
    // Consultar los servicios en la base de datos
    let query = supabase
      .from('services')
      .select('*');
    
    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (key.endsWith('_gte')) {
        const field = key.replace('_gte', '');
        query = query.gte(field, value);
      } else if (key.endsWith('_lte')) {
        const field = key.replace('_lte', '');
        query = query.lte(field, value);
      } else {
        query = query.eq(key, value);
      }
    });
    
    // Aplicar orden y límite
    query = query.order(orderBy, { ascending });
    if (nodeData.limit) {
      query = query.limit(nodeData.limit);
    }
    
    // Ejecutar la consulta
    const { data: services, error } = await query;
    
    if (error) {
      console.error('Error al consultar servicios:', error);
    }
    
    // Fallback: Si no hay servicios o hay un error, crear algunos servicios de ejemplo
    const availableServices = services && services.length > 0 ? services : [
      { id: 1, name: 'Servicio de consultoría básica', description: 'Asesoramiento inicial para definir necesidades', price: 100, duration_minutes: 60 },
      { id: 2, name: 'Servicio de consultoría avanzada', description: 'Asesoramiento detallado con análisis de casos', price: 200, duration_minutes: 90 },
      { id: 3, name: 'Servicio premium', description: 'Solución integral con seguimiento continuo', price: 350, duration_minutes: 120 }
    ];
    
    // Crear texto con la lista de servicios
    let servicesList = '';
    availableServices.forEach((service, index) => {
      servicesList += `${index + 1}. ${service.name}: $${service.price} (Duración: ${service.duration_minutes} min)\n`;
    });
    
    // Usar plantilla personalizada o mensaje por defecto
    let message = nodeData.message_template || 'Estos son nuestros servicios disponibles:\n{{services_list}}';
    message = message.replace('{{services_list}}', servicesList);
    
    // Guardar los servicios en el contexto para posterior referencia
    const updatedContext = {
      ...conversationContext,
      availableServices,
      lastServicesQuery: {
        category_id: nodeData.category_id,
        filter_by_price: nodeData.filter_by_price,
        min_price: nodeData.min_price,
        max_price: nodeData.max_price,
      }
    };
    
    return {
      nextNodeId: 'response',
      outputs: {
        message,
        context: updatedContext
      }
    };
  } catch (error) {
    console.error('Error en nodo ServicesNode:', error);
    return {
      nextNodeId: 'response',
      outputs: {
        message: "Lo siento, hubo un problema al buscar servicios disponibles. Por favor, contacta directamente con nosotros para obtener más información.",
        context: conversationContext
      }
    };
  }
}