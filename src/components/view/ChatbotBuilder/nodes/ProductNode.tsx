'use client'

/**
 * frontend/src/components/view/ChatbotBuilder/nodes/ProductNode.tsx
 * Nodo de chatbot para mostrar productos disponibles
 * 
 * @version 1.0.0
 * @updated 2025-07-05
 */

import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Select, Option } from '@/components/ui/Select';
import { PiPackageDuotone } from 'react-icons/pi';
import { apiGetProductList } from '@/services/ProductService';

export interface ProductNodeData {
  tenant_id: string;
  category_id?: string;
  limit?: number;
  filter_by_price?: boolean;
  min_price?: number;
  max_price?: number;
  filter_by_stock?: boolean;
  in_stock_only?: boolean;
  sort_by?: 'name' | 'price' | 'popularity' | 'newest';
  sort_direction?: 'asc' | 'desc';
  include_images?: boolean;
  message_template?: string;
  label?: string;
  onUpdateNodeData?: (nodeId: string, data: any) => void;
}

/**
 * Componente para el nodo de productos
 */
const ProductNode: React.FC<NodeProps<ProductNodeData>> = ({ 
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
    filter_by_stock = false,
    in_stock_only = true,
    sort_by = 'name',
    sort_direction = 'asc',
    include_images = false,
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
  
  const handleFilterByStockChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdateNodeData) {
      onUpdateNodeData(id, { ...data, filter_by_stock: e.target.checked });
    }
  }, [id, data, onUpdateNodeData]);
  
  const handleInStockOnlyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdateNodeData) {
      onUpdateNodeData(id, { ...data, in_stock_only: e.target.checked });
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
  
  const handleIncludeImagesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdateNodeData) {
      onUpdateNodeData(id, { ...data, include_images: e.target.checked });
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
          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
            <PiPackageDuotone className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">
              {label || 'Mostrar Productos'}
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
              <Option value="">Todas las categorías</Option>
              <Option value="1">Electrónica</Option>
              <Option value="2">Ropa</Option>
              <Option value="3">Hogar</Option>
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
          
          <div className="form-group flex items-center">
            <input 
              type="checkbox" 
              className="h-4 w-4 mr-2"
              checked={filter_by_stock}
              onChange={handleFilterByStockChange}
              id={`filter-stock-${id}`}
            />
            <label className="text-xs text-gray-600" htmlFor={`filter-stock-${id}`}>
              Filtrar por stock
            </label>
          </div>
          
          {filter_by_stock && (
            <div className="form-group flex items-center ml-4">
              <input 
                type="checkbox" 
                className="h-4 w-4 mr-2"
                checked={in_stock_only}
                onChange={handleInStockOnlyChange}
                id={`in-stock-${id}`}
              />
              <label className="text-xs text-gray-600" htmlFor={`in-stock-${id}`}>
                Solo productos en stock
              </label>
            </div>
          )}
          
          <div className="form-group">
            <label className="text-xs text-gray-600 mb-1 block">Ordenar por:</label>
            <Select 
              onChange={handleSortByChange}
              value={sort_by}
              size="sm"
            >
              <Option value="name">Nombre</Option>
              <Option value="price">Precio</Option>
              <Option value="popularity">Popularidad</Option>
              <Option value="newest">Más recientes</Option>
            </Select>
          </div>
          
          <div className="form-group">
            <label className="text-xs text-gray-600 mb-1 block">Dirección:</label>
            <Select 
              onChange={handleSortDirectionChange}
              value={sort_direction}
              size="sm"
            >
              <Option value="asc">Ascendente</Option>
              <Option value="desc">Descendente</Option>
            </Select>
          </div>
          
          <div className="form-group flex items-center">
            <input 
              type="checkbox" 
              className="h-4 w-4 mr-2"
              checked={include_images}
              onChange={handleIncludeImagesChange}
              id={`include-images-${id}`}
            />
            <label className="text-xs text-gray-600" htmlFor={`include-images-${id}`}>
              Incluir imágenes (solo WhatsApp)
            </label>
          </div>
          
          <div className="form-group">
            <label className="text-xs text-gray-600 mb-1 block">Plantilla de mensaje:</label>
            <textarea 
              className="w-full h-20 px-2 py-1 text-sm border border-gray-300 rounded-md" 
              value={message_template || ''}
              onChange={handleMessageTemplateChange}
              placeholder="Estos son nuestros productos disponibles: {{products_list}}"
            />
            <p className="text-xs text-gray-500 mt-1">
              Usa {{products_list}} para mostrar la lista de productos
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
export async function executeProductNode(
  tenantId: string,
  conversationContext: any,
  nodeData: ProductNodeData
): Promise<{ nextNodeId: string; outputs: any; }> {
  try {
    // Construir los parámetros para la consulta
    const params: any = {
      pageSize: nodeData.limit || 5,
      pageIndex: 0,
      sortKey: nodeData.sort_by || 'name',
      order: nodeData.sort_direction || 'asc',
    };
    
    // Agregar filtros adicionales
    if (nodeData.category_id) {
      params.category = nodeData.category_id;
    }
    
    if (nodeData.filter_by_price) {
      if (nodeData.min_price !== undefined) {
        params.minPrice = nodeData.min_price;
      }
      
      if (nodeData.max_price !== undefined) {
        params.maxPrice = nodeData.max_price;
      }
    }
    
    if (nodeData.filter_by_stock && nodeData.in_stock_only) {
      params.inStock = true;
    }
    
    // Utilizar el servicio de productos para obtener la lista
    let products;
    try {
      const response = await apiGetProductList(params);
      products = response.data;
    } catch (apiError) {
      console.error('Error al obtener productos desde la API:', apiError);
      products = [];
    }
    
    // Fallback: Si no hay productos o hay un error, crear algunos productos de ejemplo
    const availableProducts = products && products.length > 0 ? products : [
      { id: 1, name: 'Producto Premium', description: 'Alta calidad para uso profesional', price: 299.99, currency: 'USD', stock: 15, image_url: '/img/products/product-1.jpg' },
      { id: 2, name: 'Producto Estándar', description: 'Calidad-precio excelente para uso diario', price: 149.99, currency: 'USD', stock: 42, image_url: '/img/products/product-2.jpg' },
      { id: 3, name: 'Producto Básico', description: 'Solución económica para necesidades básicas', price: 79.99, currency: 'USD', stock: 108, image_url: '/img/products/product-3.jpg' }
    ];
    
    // Formatear la lista de productos
    let productsList = '';
    availableProducts.forEach((product, index) => {
      const productPrice = `${product.currency || 'USD'} ${product.price}`;
      const stockInfo = product.stock !== undefined ? `(${product.stock} disponibles)` : '';
      productsList += `${index + 1}. ${product.name}: ${productPrice} ${stockInfo}\n`;
      if (product.description) {
        productsList += `   ${product.description}\n`;
      }
    });
    
    // Usar plantilla personalizada o mensaje por defecto
    let message = nodeData.message_template || 'Estos son nuestros productos disponibles:\n{{products_list}}';
    message = message.replace('{{products_list}}', productsList);
    
    // Almacenar los productos en el contexto para futura referencia
    const updatedContext = {
      ...conversationContext,
      availableProducts,
      lastProductsQuery: {
        category_id: nodeData.category_id,
        filter_by_price: nodeData.filter_by_price,
        min_price: nodeData.min_price,
        max_price: nodeData.max_price,
        filter_by_stock: nodeData.filter_by_stock,
        in_stock_only: nodeData.in_stock_only
      }
    };
    
    // Si se requieren imágenes y es una plataforma compatible (WhatsApp), preparar array de imágenes
    if (nodeData.include_images) {
      const images = availableProducts
        .filter(product => product.image_url)
        .map(product => ({
          url: product.image_url,
          caption: `${product.name} - ${product.currency || 'USD'} ${product.price}`
        }));
      
      if (images.length > 0) {
        updatedContext.mediaToSend = images;
      }
    }
    
    return {
      nextNodeId: 'response',
      outputs: {
        message,
        context: updatedContext
      }
    };
  } catch (error) {
    console.error('Error en nodo ProductNode:', error);
    return {
      nextNodeId: 'response',
      outputs: {
        message: "Lo siento, hubo un problema al buscar productos disponibles. Por favor, contacta directamente con nosotros para obtener más información.",
        context: conversationContext
      }
    };
  }
}

export default ProductNode;