'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards'
import Badge from '@/components/ui/Badge'
import { CalendarDays, Mail, Phone, User, MapPin, FileText, Hash } from 'lucide-react'
import { conversationPersistence } from '@/utils/conversationPersistence'

interface LeadCollectedDataProps {
    leadId?: string
    className?: string
}

interface DataField {
    key: string
    value: any
    icon?: React.ReactNode
    label: string
}

/**
 * Componente que muestra todos los datos recolectados de un lead
 * a través de las diferentes plantillas de conversación
 */
export default function LeadCollectedData({ leadId, className }: LeadCollectedDataProps) {
    const [collectedData, setCollectedData] = useState<Record<string, any>>({})
    const [dataFields, setDataFields] = useState<DataField[]>([])
    
    useEffect(() => {
        if (!leadId) return
        
        // Obtener datos recolectados del lead
        const data = conversationPersistence.getLeadCollectedData(leadId)
        setCollectedData(data)
        
        // Mapear datos a campos con iconos y etiquetas
        const fields: DataField[] = []
        
        // Campos conocidos con iconos específicos
        const knownFields: Record<string, { icon: React.ReactNode; label: string }> = {
            name: { icon: <User className="w-4 h-4" />, label: 'Nombre' },
            full_name: { icon: <User className="w-4 h-4" />, label: 'Nombre completo' },
            email: { icon: <Mail className="w-4 h-4" />, label: 'Email' },
            phone: { icon: <Phone className="w-4 h-4" />, label: 'Teléfono' },
            address: { icon: <MapPin className="w-4 h-4" />, label: 'Dirección' },
            location: { icon: <MapPin className="w-4 h-4" />, label: 'Ubicación' },
            notes: { icon: <FileText className="w-4 h-4" />, label: 'Notas' },
            appointment_date: { icon: <CalendarDays className="w-4 h-4" />, label: 'Fecha de cita' },
            preferred_date: { icon: <CalendarDays className="w-4 h-4" />, label: 'Fecha preferida' },
            property_type: { icon: <Hash className="w-4 h-4" />, label: 'Tipo de propiedad' },
            budget: { icon: <Hash className="w-4 h-4" />, label: 'Presupuesto' },
            interest_level: { icon: <Hash className="w-4 h-4" />, label: 'Nivel de interés' },
            source: { icon: <Hash className="w-4 h-4" />, label: 'Fuente' }
        }
        
        // Procesar todos los campos
        Object.entries(data).forEach(([key, value]) => {
            // Ignorar campos internos
            if (key === 'lastUpdated') return
            
            const fieldConfig = knownFields[key] || {
                icon: <Hash className="w-4 h-4" />,
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
            }
            
            fields.push({
                key,
                value,
                icon: fieldConfig.icon,
                label: fieldConfig.label
            })
        })
        
        // Ordenar campos por importancia
        const fieldOrder = ['name', 'full_name', 'email', 'phone', 'address', 'location']
        fields.sort((a, b) => {
            const aIndex = fieldOrder.indexOf(a.key)
            const bIndex = fieldOrder.indexOf(b.key)
            
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
            if (aIndex !== -1) return -1
            if (bIndex !== -1) return 1
            
            return a.key.localeCompare(b.key)
        })
        
        setDataFields(fields)
    }, [leadId])
    
    if (!leadId || dataFields.length === 0) {
        return null
    }
    
    const formatValue = (value: any): string => {
        if (value === null || value === undefined) return 'N/A'
        if (typeof value === 'boolean') return value ? 'Sí' : 'No'
        if (typeof value === 'object') return JSON.stringify(value, null, 2)
        if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
            // Probable fecha ISO
            return new Date(value).toLocaleString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        }
        return String(value)
    }
    
    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Datos Recolectados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {dataFields.map((field) => (
                    <div key={field.key} className="flex items-start gap-3">
                        <div className="mt-0.5 text-gray-500">
                            {field.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {field.label}
                            </div>
                            <div className="text-sm font-medium break-words">
                                {formatValue(field.value)}
                            </div>
                        </div>
                    </div>
                ))}
                
                {collectedData.lastUpdated && (
                    <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500">
                            Última actualización:{' '}
                            {new Date(collectedData.lastUpdated).toLocaleString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
