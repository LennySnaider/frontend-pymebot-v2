'use client'

/**
 * Componente temporal para solucionar el problema de sincronización
 * entre SalesFunnel y ChatList
 */

import { useEffect } from 'react'

export default function QuickFix() {
    useEffect(() => {
        // Función para forzar el refresco del chat
        const forceRefresh = () => {
            if (typeof window === 'undefined') return;
            
            console.log('QuickFix: Forzando actualización de chat cada 5 segundos');
            
            // Disparar evento para forzar refresco de la lista de chat
            window.dispatchEvent(new CustomEvent('force-chat-refresh', {
                detail: { timestamp: Date.now() },
                bubbles: true
            }));
        };
        
        // Establecer intervalo para forzar actualización frecuente
        const intervalId = setInterval(forceRefresh, 5000);
        
        // También forzar actualizaciones cuando la ventana recibe el foco
        const handleFocus = () => {
            console.log('QuickFix: Ventana ha recibido el foco, actualizando chat...');
            forceRefresh();
        };
        
        window.addEventListener('focus', handleFocus);
        
        // Limpiar al desmontar
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);
    
    // Este componente no renderiza nada visible
    return null;
}