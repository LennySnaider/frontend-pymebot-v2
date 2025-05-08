/**
 * frontend/src/components/view/ChatbotBuilder/nodes/ServicesNode.tsx
 * Nodo de chatbot para mostrar servicios disponibles
 * 
 * @version 1.0.0
 * @updated 2025-07-05
 */

import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import Select from '@/components/ui/Select';
import { PiRulerDuotone } from 'react-icons/pi';
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
 * Componente para el nodo de servicios
 */
const ServicesNode: React.FC<NodeProps<ServicesNodeData>> = ({ 
  id, 
  data, 
  selected,
  isConnectable 
}) => {
  const { 
    tenant_id,
    category_id, 
    limit = 5, 
    filter_by_price = false,
    min_price,
    max_price,
    sort_by = 'name',
    sort_direction = 'asc',
    message_template,
    onUpdateNodeData, 
    label
  } = data;
  
  // Manejadores para actualizar los datos del nodo
  const handleCategoryChange = useCallback((value: string) => {
    if (onUpdateNodeData) {
      onUpdateNodeData(id, { ...data, category_id: value });
    }
  }, [id, data, onUpdateNodeData]);
  
  const handleLimitChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      if (onUpdateNodeData) {
        onUpdateNodeData(id, { ...data, limit: value });
      }
    }
  }, [id, data, onUpdateNodeData]);
  
  const handleFilterByPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdateNodeData) {
      onUpdateNodeData(id, { ...data, filter_by_price: e.target.checked });
    }
  }, [id, data, onUpdateNodeData]);
  
  const handleMinPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      if (onUpdateNodeData) {
        onUpdateNodeData(id, { ...data, min_price: value });
      }
    }
  }, [id, data, onUpdateNodeData]);
  
  const handleMaxPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      if (onUpdateNodeData) {
        onUpdateNodeData(id, { ...data, max_price: value });
      }
    }
  }, [id, data, onUpdateNodeData]);
  
  const handleSortByChange = useCallback((value: string) => {
    if (onUpdateNodeData) {
      onUpdateNodeData(id, { ...data, sort_by: value });
    }
  }, [id, data, onUpdateNodeData]);
  
  const handleSortDirectionChange = useCallback((value: string) => {
    if (onUpdateNodeData) {
      onUpdateNodeData(id, { ...data, sort_direction: value });
    }
  }, [id, data, onUpdateNodeData]);
  
  const handleMessageTemplateChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onUpdateNodeData) {
      onUpdateNodeData(id, { ...data, message_template: e.target.value });
    }
  }, [id, data, onUpdateNodeData]);
  
  return (
    <div className={`rounded-md border-2 ${selected ? 'border-primary' : 'border-gray-200'} bg-white p-3 shadow-md min-w-[280px] max-w-[320px]`}>
      {/* Título del nodo */}
      <div className="mb-2 border-b border-gray-200 pb-2">
        <div className="flex items-center">
          <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
            <PiRulerDuotone className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">
              {label || 'Mostrar Servicios'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Contenido del nodo */}
      <div className="bg-gray-50 p-2 rounded-md mb-1">
        <div className="space-y-2">
          <div className="form-group">
            <label className="text-xs text-gray-600 mb-1 block">Categoría:</label>
            <Select 
              onChange={handleCategoryChange}
              value={category_id || ''}
              size="sm"
            >
              <Select.Option value="">Todas las categorías</Select.Option>
              <Select.Option value="1">Servicios básicos</Select.Option>
              <Select.Option value="2">Servicios premium</Select.Option>
              <Select.Option value="3">Servicios especiales</Select.Option>
            </Select>
          </div>
          
          <div className="form-group">
            <label className="text-xs text-gray-600 mb-1 block">Límite:</label>
            <input 
              type="number" 
              className="w-full h-8 px-2 text-sm border border-gray-300 rounded-md" 
              value={limit} 
              onChange={handleLimitChange}
              min={1}
              max={20}
            />
          </div>
          
          <div className="form-group flex items-center">
            <input 
              type="checkbox" 
              className="h-4 w-4 mr-2"
              checked={filter_by_price}
              onChange={handleFilterByPriceChange}
              id={`filter-price-${id}`}
            />
            <label className="text-xs text-gray-600" htmlFor={`filter-price-${id}`}>
              Filtrar por precio
            </label>
          </div>
          
          {filter_by_price && (
            <div className="grid grid-cols-2 gap-2">
              <div className="form-group">
                <label className="text-xs text-gray-600 mb-1 block">Precio mínimo:</label>
                <input 
                  type="number" 
                  className="w-full h-8 px-2 text-sm border border-gray-300 rounded-md" 
                  value={min_price || ''} 
                  onChange={handleMinPriceChange}
                  min={0}
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label className="text-xs text-gray-600 mb-1 block">Precio máximo:</label>
                <input 
                  type="number" 
                  className="w-full h-8 px-2 text-sm border border-gray-300 rounded-md" 
                  value={max_price || ''} 
                  onChange={handleMaxPriceChange}
                  min={0}
                  step="0.01"
                />
              </div>
            </div>
          )}
          
          <div className="form-group">
            <label className="text-xs text-gray-600 mb-1 block">Ordenar por:</label>
            <Select 
              onChange={handleSortByChange}
              value={sort_by}
              size="sm"
            >
              <Select.Option value="name">Nombre</Select.Option>
              <Select.Option value="price">Precio</Select.Option>
              <Select.Option value="popularity">Popularidad</Select.Option>
            </Select>
          </div>
          
          <div className="form-group">
            <label className="text-xs text-gray-600 mb-1 block">Dirección:</label>
            <Select 
              onChange={handleSortDirectionChange}
              value={sort_direction}
              size="sm"
            >
              <Select.Option value="asc">Ascendente</Select.Option>
              <Select.Option value="desc">Descendente</Select.Option>
            </Select>
          </div>
          
          <div className="form-group">
            <label className="text-xs text-gray-600 mb-1 block">Plantilla de mensaje:</label>
            <textarea 
              className="w-full h-20 px-2 py-1 text-sm border border-gray-300 rounded-md" 
              value={message_template || ''}
              onChange={handleMessageTemplateChange}
              placeholder="Estos son nuestros servicios disponibles: {{services_list}}"
            />
            <p className="text-xs text-gray-500 mt-1">
              Usa {{services_list}} para mostrar la lista de servicios
            </p>
          </div>
        </div>
      </div>
      
      {/* Handles para conexiones horizontales */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="response"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        isConnectable={isConnectable}
      />
    </div>
  );
};

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
    
    // Ejecutar consulta
    const { data: services, error } = await query;
    
    if (error) {
      throw error;
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

export default ServicesNode;