import { useEffect, useRef } from 'react';
import { useSalesFunnelStore } from '@/app/(protected-pages)/modules/leads/leads-scrum/_store/salesFunnelStore';
import { simpleLeadUpdateStore } from '@/stores/simpleLeadUpdateStore';
import { leadUpdateStore } from '@/stores/leadUpdateStore';
import { getRealLeadId } from '@/utils/leadIdResolver';
import { subscribeToLeadUpdates, getRecentUpdates } from '@/utils/broadcastLeadUpdate';

/**
 * Hook para sincronizar las etapas de leads con el backend
 * Útil para mantener el sales funnel actualizado cuando se hacen cambios desde otras páginas
 */
export function useLeadStageSync() {
    const processedUpdatesRef = useRef(new Set<string>());
    const lastUpdateTimeRef = useRef<number>(0);
    
    useEffect(() => {
        console.log('useLeadStageSync: Iniciando sincronización...');
        
        // Función para mapear etapas según el estado actual de las columnas
        const getStageMapping = () => {
            const { columns } = useSalesFunnelStore.getState();
            const currentColumnNames = Object.keys(columns);
            console.log('useLeadStageSync: Columnas actuales:', currentColumnNames);
            
            // Si las columnas están en español (con mayúsculas)
            if (currentColumnNames.includes('Nuevos') || currentColumnNames.includes('Prospectando')) {
                return {
                    // Mapeo del backend (español minúsculas) al frontend español
                    'nuevos': 'Nuevos',
                    'prospectando': 'Prospectando',
                    'calificacion': 'Calificación',
                    'oportunidad': 'Oportunidad',
                    'confirmado': 'confirmed',
                    'cerrado': 'closed',
                    // Mapeo del frontend (español con mayúsculas) al frontend
                    'Nuevos': 'Nuevos',
                    'Prospectando': 'Prospectando',
                    'Calificación': 'Calificación',
                    'Oportunidad': 'Oportunidad',
                    'Confirmado': 'confirmed',
                    'Cerrado': 'closed',
                    // Mapeo inglés al frontend español
                    'new': 'Nuevos',
                    'prospecting': 'Prospectando',
                    'qualification': 'Calificación',
                    'opportunity': 'Oportunidad',
                    'confirmed': 'confirmed',
                    'closed': 'closed'
                };
            } else {
                // Si las columnas están en inglés
                return {
                    // Mapeo del backend (español minúsculas) al frontend inglés
                    'nuevos': 'new',
                    'prospectando': 'prospecting',
                    'calificacion': 'qualification',
                    'oportunidad': 'opportunity',
                    'confirmado': 'confirmed',
                    'cerrado': 'closed',
                    // Mapeo identidad para inglés
                    'new': 'new',
                    'prospecting': 'prospecting',
                    'qualification': 'qualification',
                    'opportunity': 'opportunity',
                    'confirmed': 'confirmed',
                    'closed': 'closed',
                    // Mapeo del español con mayúsculas al inglés
                    'Nuevos': 'new',
                    'Prospectando': 'prospecting',
                    'Calificación': 'qualification',
                    'Oportunidad': 'opportunity',
                    'Confirmado': 'confirmed',
                    'Cerrado': 'closed'
                };
            }
        };
        
        const processStageUpdate = (leadId: string, newStage: string) => {
            // Obtener el estado más reciente del store
            const { columns, updateColumns } = useSalesFunnelStore.getState();
            
            // Verificar que tenemos columnas
            if (Object.keys(columns).length === 0) {
                console.log('useLeadStageSync: No hay columnas disponibles aún');
                return;
            }
            
            // Prevenir actualizaciones muy frecuentes
            const now = Date.now();
            if (now - lastUpdateTimeRef.current < 100) {
                console.log('useLeadStageSync: Ignorando actualización muy rápida');
                return;
            }
            lastUpdateTimeRef.current = now;
            
            // Verificar si ya procesamos esta actualización
            const updateKey = `${leadId}-${newStage}`;
            if (processedUpdatesRef.current.has(updateKey)) {
                console.log('useLeadStageSync: Actualización ya procesada:', updateKey);
                return;
            }
            processedUpdatesRef.current.add(updateKey);
            
            // Limpiar actualizaciones procesadas después de 30 segundos
            setTimeout(() => {
                processedUpdatesRef.current.delete(updateKey);
            }, 30000);
            
            // Obtener el mapeo dinámico basado en las columnas actuales
            const stageNameMap = getStageMapping();
            const mappedStage = stageNameMap[newStage] || newStage;
            console.log('useLeadStageSync: Procesando actualización', { leadId, newStage, mappedStage });
            console.log('useLeadStageSync: Columnas disponibles:', Object.keys(columns));
            
            // Buscar el lead en las columnas
            let leadInfo = null;
            for (const columnId in columns) {
                const columnLeads = columns[columnId];
                const leadIndex = columnLeads.findIndex(
                    (lead) => {
                        const match = lead.id === leadId || 
                                 getRealLeadId(lead) === leadId ||
                                 lead.metadata?.db_id === leadId ||
                                 lead.metadata?.real_id === leadId ||
                                 lead.metadata?.original_lead_id === leadId;
                        
                        if (match) {
                            console.log(`useLeadStageSync: Lead encontrado en columna ${columnId}, ID: ${lead.id}`);
                        }
                        return match;
                    }
                );
                
                if (leadIndex !== -1) {
                    leadInfo = {
                        columnId,
                        leadIndex,
                        lead: columnLeads[leadIndex],
                    };
                    break;
                }
            }
            
            if (!leadInfo) {
                console.log('useLeadStageSync: Lead no encontrado en ninguna columna:', leadId);
                return;
            }
            
            const { lead, columnId: currentStage } = leadInfo;
            console.log('useLeadStageSync: Lead encontrado:', lead.name || lead.full_name);
            console.log('useLeadStageSync: Etapa actual:', currentStage, 'Nueva etapa:', mappedStage);
            
            // No hacer nada si ya está en la etapa correcta
            if (currentStage === mappedStage) {
                console.log('useLeadStageSync: Lead ya está en la etapa correcta');
                return;
            }
            
            // Crear las nuevas columnas
            const newColumns = JSON.parse(JSON.stringify(columns)); // Deep copy
            
            // Manejar etapas especiales (confirmado/cerrado)
            if (mappedStage === 'confirmed' || mappedStage === 'closed') {
                console.log(`useLeadStageSync: Moviendo a etapa especial: ${mappedStage}`);
                
                // Solo remover de la columna actual
                newColumns[currentStage] = newColumns[currentStage].filter(
                    (l: any) => l.id !== lead.id && getRealLeadId(l) !== leadId
                );
                
                updateColumns(newColumns);
                console.log(`useLeadStageSync: Lead ${mappedStage === 'confirmed' ? 'confirmado' : 'cerrado'} exitosamente`);
                return;
            }
            
            // Manejar movimiento normal entre columnas
            if (newColumns[mappedStage] !== undefined) {
                console.log(`useLeadStageSync: Moviendo lead a columna regular: ${mappedStage}`);
                
                // Remover de la columna actual
                newColumns[currentStage] = newColumns[currentStage].filter(
                    (l: any) => l.id !== lead.id && getRealLeadId(l) !== leadId
                );
                
                // Añadir a la nueva columna con la etapa actualizada
                const updatedLead = { ...lead, stage: mappedStage };
                newColumns[mappedStage] = [updatedLead, ...newColumns[mappedStage]];
                
                updateColumns(newColumns);
                console.log(`useLeadStageSync: Lead movido exitosamente a ${mappedStage}`);
            } else {
                console.error(`useLeadStageSync: Columna de destino no existe: ${mappedStage}`);
                console.log('Columnas disponibles:', Object.keys(newColumns));
            }
        };
        
        // Verificar actualizaciones inmediatamente al montar usando BroadcastChannel
        const checkImmediateUpdates = () => {
            const updates = getRecentUpdates(60000); // últimos 60 segundos
            if (updates.length > 0) {
                console.log('useLeadStageSync: Encontradas', updates.length, 'actualizaciones iniciales');
                updates.forEach(update => {
                    processStageUpdate(update.leadId, update.newStage);
                });
            }
            
            // También verificar localStorage como fallback
            const legacyUpdates = simpleLeadUpdateStore.getRecentUpdates(60000);
            if (legacyUpdates.length > 0) {
                console.log('useLeadStageSync: Encontradas', legacyUpdates.length, 'actualizaciones legacy');
                legacyUpdates.forEach(update => {
                    processStageUpdate(update.leadId, update.newStage);
                });
            }
        };
        
        // Suscribirse a BroadcastChannel para actualizaciones en tiempo real
        const unsubscribeBroadcast = subscribeToLeadUpdates((message) => {
            console.log('useLeadStageSync: Actualización recibida por BroadcastChannel', message);
            processStageUpdate(message.leadId, message.newStage);
        });
        
        // Verificar actualizaciones al montar
        setTimeout(checkImmediateUpdates, 50); // Reducido a 50ms para carga más rápida
        
        // Mantener un intervalo pequeño como fallback para actualizaciones que pudieran perderse
        const intervalId = setInterval(() => {
            const updates = getRecentUpdates(2000); // Solo últimos 2 segundos
            if (updates.length > 0) {
                console.log('useLeadStageSync: Procesando', updates.length, 'actualizaciones de intervalo');
                updates.forEach(update => {
                    processStageUpdate(update.leadId, update.newStage);
                });
            }
        }, 500); // Cada 500ms como fallback
        
        // Listener para eventos directos (aunque están en páginas diferentes, por si acaso)
        const handleLeadStageUpdate = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { leadId, newStage } = customEvent.detail;
            console.log('useLeadStageSync: Evento directo recibido (mismo tab)', { leadId, newStage });
            processStageUpdate(leadId, newStage);
        };
        
        window.addEventListener('lead-stage-updated', handleLeadStageUpdate);
        
        // Listener para storage events como fallback adicional
        const handleStorageChange = (e: StorageEvent) => {
            if ((e.key === 'lead-stage-updates' || e.key === 'lead-stage-updates-v2') && e.newValue) {
                try {
                    const updates = JSON.parse(e.newValue);
                    const recentUpdates = updates.filter((u: any) => 
                        (Date.now() - u.timestamp) < 500 // Solo actualizaciones del último medio segundo
                    );
                    recentUpdates.forEach((update: any) => {
                        processStageUpdate(update.leadId, update.newStage);
                    });
                } catch (error) {
                    console.error('Error procesando storage event:', error);
                }
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        // Suscribirse al store global
        const unsubscribe = leadUpdateStore.subscribe((leadId, newStage) => {
            console.log('useLeadStageSync: Actualización del store global', { leadId, newStage });
            processStageUpdate(leadId, newStage);
        });
        
        // Cleanup
        return () => {
            console.log('useLeadStageSync: Limpiando listeners...');
            clearInterval(intervalId);
            window.removeEventListener('lead-stage-updated', handleLeadStageUpdate);
            window.removeEventListener('storage', handleStorageChange);
            unsubscribeBroadcast();
            unsubscribe();
        };
    }, []); // Sin dependencias para evitar ciclos infinitos
}