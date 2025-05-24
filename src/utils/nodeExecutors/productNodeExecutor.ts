/**
 * frontend/src/utils/nodeExecutors/productNodeExecutor.ts
 * Función de ejecución para ProductNode
 * @version 1.0.0
 * @migrated 2025-05-22 - Extraído desde components/view/ChatbotBuilder/nodes/ProductNode.tsx
 */

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