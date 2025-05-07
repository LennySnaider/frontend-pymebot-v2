/**
 * frontend/src/components/view/ChatbotBuilder/panels/node-configs/RouterNodeConfig.tsx
 * Configurador para nodos de enrutamiento entre plantillas
 * @version 1.0.0
 * @updated 2025-04-08
 */

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Template {
    id: string
    name: string
    description?: string
    status: string
}

interface RouterNodeConfigProps {
    data: {
        targetTemplateId?: string
        targetTemplateName?: string
        targetNodeId?: string
        [key: string]: any
    }
    onChange: (field: string, value: any) => void
}

const RouterNodeConfig: React.FC<RouterNodeConfigProps> = ({ data, onChange }) => {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Cargar las plantillas disponibles
    useEffect(() => {
        const fetchTemplates = async () => {
            setLoading(true)
            setError(null)
            
            try {
                const { data: templates, error } = await supabase
                    .from('chatbot_templates')
                    .select('id, name, description, status')
                    .eq('status', 'published')
                    .order('name')
                
                if (error) throw error
                
                setTemplates(templates || [])
            } catch (error: any) {
                console.error('Error loading templates:', error)
                setError('Error al cargar las plantillas')
            } finally {
                setLoading(false)
            }
        }
        
        fetchTemplates()
    }, [])

    // Actualizar el nombre de la plantilla cuando se selecciona por ID
    useEffect(() => {
        if (data.targetTemplateId && templates.length > 0) {
            const selectedTemplate = templates.find(t => t.id === data.targetTemplateId)
            if (selectedTemplate && selectedTemplate.name !== data.targetTemplateName) {
                onChange('targetTemplateName', selectedTemplate.name)
            }
        }
    }, [data.targetTemplateId, templates])

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plantilla de destino
                </label>
                {loading ? (
                    <div className="py-2 px-3 bg-gray-100 rounded-md animate-pulse">
                        Cargando plantillas...
                    </div>
                ) : error ? (
                    <div className="py-2 px-3 bg-red-50 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                ) : (
                    <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                        value={data.targetTemplateId || ''}
                        onChange={(e) => onChange('targetTemplateId', e.target.value)}
                    >
                        <option value="">Seleccionar una plantilla</option>
                        {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                                {template.name}
                            </option>
                        ))}
                    </select>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    La plantilla a la que se redirigirá la conversación.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID del nodo inicial (opcional)
                </label>
                <input
                    type="text"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                    value={data.targetNodeId || ''}
                    onChange={(e) => onChange('targetNodeId', e.target.value)}
                    placeholder="ID del nodo de inicio en la plantilla destino"
                />
                <p className="mt-1 text-xs text-gray-500">
                    Si no se especifica, comenzará desde el nodo de inicio de la plantilla destino.
                </p>
            </div>
            
            <div className="bg-amber-50 rounded-md p-3">
                <h4 className="font-medium text-amber-800 text-sm mb-2">Información importante</h4>
                <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4">
                    <li>Este nodo permite cambiar a otra plantilla de chatbot durante la conversación.</li>
                    <li>El estado de la conversación (variables) se mantiene al cambiar de plantilla.</li>
                    <li>Solo puedes enrutar a plantillas que estén publicadas.</li>
                    <li>Si el tenant no tiene activada la plantilla de destino, seguirá el camino de "Error".</li>
                </ul>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-md p-3">
                    <h4 className="font-medium text-green-800 text-sm mb-1">Éxito</h4>
                    <p className="text-xs text-green-700">
                        Camino que seguirá si la plantilla de destino está activada para el tenant.
                    </p>
                </div>
                <div className="bg-red-50 rounded-md p-3">
                    <h4 className="font-medium text-red-800 text-sm mb-1">Error</h4>
                    <p className="text-xs text-red-700">
                        Camino que seguirá si la plantilla de destino no está disponible.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default RouterNodeConfig
