/**
 * frontend/src/components/view/ChatbotBuilder/hooks/useDarkModeNode.ts
 * Hook para asegurar que los nodos de ReactFlow tengan correctamente aplicado el modo oscuro
 * @version 1.0.0
 * @updated 2025-09-05
 */

import { useEffect } from 'react';
import useTheme from '@/utils/hooks/useTheme';
import { MODE_DARK } from '@/constants/theme.constant';

/**
 * Hook que aplica el modo oscuro a un nodo de ReactFlow usando un ID de referencia
 * @param nodeRef Referencia al elemento DOM del nodo
 * @param nodeId ID del nodo para debugging
 */
const useDarkModeNode = (nodeRef: React.RefObject<HTMLDivElement>, nodeId?: string) => {
  const mode = useTheme(state => state.mode);
  
  useEffect(() => {
    if (!nodeRef.current) return;
    
    const applyDarkMode = () => {
      if (!nodeRef.current) return;
      
      if (mode === MODE_DARK) {
        // Forzar el fondo oscuro directamente
        nodeRef.current.style.backgroundColor = '#1f2937'; // gray-800
        nodeRef.current.style.borderColor = '#4b5563'; // gray-600
        
        // Aplicar a todos los elementos hijos con bg-white o similar
        const whiteElements = nodeRef.current.querySelectorAll('[class*="bg-white"]');
        whiteElements.forEach((el) => {
          (el as HTMLElement).style.backgroundColor = '#1f2937';
        });
        
        // Aplicar a elementos con bg-gray-50
        const grayElements = nodeRef.current.querySelectorAll('[class*="bg-gray-50"]');
        grayElements.forEach((el) => {
          (el as HTMLElement).style.backgroundColor = '#374151';
        });
        
        // Añadir atributos de datos para selectores CSS
        nodeRef.current.setAttribute('data-dark-mode', 'true');
        
        console.log(`[DarkMode] Applied to node ${nodeId || 'unknown'}`);
      } else {
        // Restaurar en modo claro
        nodeRef.current.style.backgroundColor = '';
        nodeRef.current.style.borderColor = '';
        nodeRef.current.removeAttribute('data-dark-mode');
      }
    };
    
    // Aplicar inmediatamente
    applyDarkMode();
    
    // También aplicar después de un breve retraso para asegurar que ReactFlow haya terminado de renderizar
    const timeoutId = setTimeout(applyDarkMode, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [mode, nodeRef, nodeId]);
  
  return mode === MODE_DARK;
};

export default useDarkModeNode;