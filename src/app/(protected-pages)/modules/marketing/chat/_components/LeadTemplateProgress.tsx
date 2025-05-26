'use client'

import { useEffect, useState } from 'react'
import Progress from '@/components/ui/Progress'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { useChatStore } from '../_store/chatStore'
import { conversationPersistence } from '@/utils/conversationPersistence'
import type { TemplateProgress } from '@/utils/conversationPersistence'

interface LeadTemplateProgressProps {
    leadId?: string
    className?: string
}

/**
 * Componente que muestra el progreso del lead en cada plantilla
 * Muestra:
 * - Progreso visual de cada plantilla
 * - Estado de completitud
 * - Última interacción
 */
export default function LeadTemplateProgress({ leadId, className }: LeadTemplateProgressProps) {
    const templates = useChatStore((state) => state.templates)
    const selectedChat = useChatStore((state) => state.selectedChat)
    const activeTemplateId = useChatStore((state) => state.activeTemplateId)
    const setActiveTemplate = useChatStore((state) => state.setActiveTemplate)
    
    const [progress, setProgress] = useState<TemplateProgress[]>([])
    
    // Usar el leadId proporcionado o extraerlo del chat seleccionado
    const currentLeadId = leadId || selectedChat.id?.replace('lead_', '')
    
    useEffect(() => {
        if (!currentLeadId || !templates || templates.length === 0) return
        
        // Obtener progreso del lead
        const leadProgress = conversationPersistence.getLeadProgress(currentLeadId, templates)
        setProgress(leadProgress)
    }, [currentLeadId, templates])
    
    if (!currentLeadId || !templates || templates.length === 0) {
        return null
    }
    
    return (
        <div className={`space-y-3 ${className || ''}`}>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progreso en Plantillas
            </h4>
            
            <div className="space-y-2">
                {templates.map((template) => {
                    const templateProgress = progress.find(p => p.templateId === template.id)
                    const isActive = template.id === activeTemplateId
                    const isCompleted = templateProgress?.progress === 100
                    
                    return (
                        <div
                            key={template.id}
                            className={`
                                p-3 rounded-lg border cursor-pointer transition-all
                                ${isActive 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }
                            `}
                            onClick={() => setActiveTemplate(template.id)}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : templateProgress && templateProgress.progress > 0 ? (
                                        <Clock className="w-4 h-4 text-blue-500" />
                                    ) : (
                                        <Circle className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className="text-sm font-medium">
                                        {template.name}
                                    </span>
                                </div>
                                
                                {isActive && (
                                    <span className="text-xs text-primary font-medium">
                                        Activa
                                    </span>
                                )}
                            </div>
                            
                            <div className="space-y-1">
                                <Progress 
                                    value={templateProgress?.progress || 0} 
                                    className="h-2"
                                />
                                
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>
                                        {templateProgress?.completedNodes || 0} de {templateProgress?.totalNodes || 0} pasos
                                    </span>
                                    <span>
                                        {Math.round(templateProgress?.progress || 0)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            
            {progress.length > 0 && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500">
                        Progreso total: {Math.round(
                            progress.reduce((acc, p) => acc + p.progress, 0) / progress.length
                        )}%
                    </div>
                </div>
            )}
        </div>
    )
}
