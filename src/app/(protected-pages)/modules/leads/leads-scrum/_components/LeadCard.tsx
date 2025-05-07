/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/LeadCard.tsx
 * Tarjeta individual para leads inmobiliarios dentro del funnel de ventas.
 * Mejorada con soporte para dark mode y mejor distinción visual.
 * Actualizada para mostrar información completa del lead.
 * Corregido problema con avatares de agentes y etiquetas que no persisten al recargar.
 * 
 * @version 3.8.0
 * @updated 2025-04-15
 */

'use client'

import { useState, useEffect } from 'react' // Añadir useState y useEffect para manejo de estado
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import IconText from '@/components/shared/IconText'
import Avatar from '@/components/ui/Avatar'
import {
    TbPaperclip,
    TbMessageCircle,
    TbHome,
    TbCurrencyDollar,
    TbPhone,
    TbMail,
    TbMap,
    TbBed,
    TbBath,
    TbCalendarEvent,
    TbChevronDown, // Añadir ícono para expandir/colapsar
    TbChevronUp, // Añadir ícono para expandir/colapsar
    TbUserCircle, // Icono para usar cuando no hay miembros asignados
} from 'react-icons/tb'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'
import { leadLabelColors, formatBudget } from '../utils'
import type { Lead } from '../types'
import type { CardProps } from '@/components/ui/Card'
import type { Ref } from 'react'
import { useTranslations } from 'next-intl'

interface LeadCardProps extends CardProps {
    data: Lead
    ref?: Ref<HTMLDivElement>
}

const LeadCard = (props: LeadCardProps) => {
    const { openDialog, updateDialogView, setSelectedLeadId } =
        useSalesFunnelStore()
    
    // Estado para controlar si los detalles están expandidos o colapsados
    const [isExpanded, setIsExpanded] = useState(false)

    // Estado local para miembros y etiquetas, para asegurar persistencia
    const [localMembers, setLocalMembers] = useState<any[]>([])
    const [localLabels, setLocalLabels] = useState<string[]>([])

    // Hook para traducir las etiquetas de leads
    const t = useTranslations('salesFunnel.leads.types')

    const { data, ref, ...rest } = props

    const {
        id,
        name,
        email,
        phone,
        comments = [], // Proporcionar array vacío por defecto
        attachments = [], // Proporcionar array vacío por defecto
        members = [], // Proporcionar array vacío por defecto
        labels = [], // Proporcionar array vacío por defecto
        metadata,
        contactCount,
        stage, // Aseguramos de mantener el stage
        createdAt,
    } = data
    
    // Aseguramos de extraer email/phone de metadata si no está disponible directamente
    const leadEmail = email || (metadata?.email) || ''
    const leadPhone = phone || (metadata?.phone) || ''
    const description = data.description || ''

    // Función para convertir nivel de interés a etiqueta de prioridad
    const interestToLabel = (interest: string | undefined): string => {
        switch (interest) {
            case 'alto':
                return 'Alta prioridad'
            case 'medio':
                return 'Media prioridad'
            case 'bajo':
                return 'Baja prioridad'
            default:
                return 'Media prioridad'
        }
    }

    // Efecto para cargar los miembros y etiquetas cuando cambian los datos
    useEffect(() => {
        // Inicializar miembros si existen
        if (members && members.length > 0) {
            setLocalMembers(members)
            console.log('Avatar establecido desde members:', members)
        }
        
        // Inicializar etiquetas si existen
        if (labels && labels.length > 0) {
            setLocalLabels(labels)
        }
        
        // Intentar recuperar nivel de interés de metadata si no está en las etiquetas
        const priorityLabels = ['Alta prioridad', 'Media prioridad', 'Baja prioridad',
                              'High priority', 'Medium priority', 'Low priority']
        
        const hasPriorityLabel = labels && labels.some(label => priorityLabels.includes(label))
        
        if (!hasPriorityLabel && metadata && metadata.interest) {
            const interestLabel = interestToLabel(metadata.interest)
            if (interestLabel) {
                setLocalLabels(prevLabels => {
                    // Solo añadir si no existe ya
                    if (!prevLabels.includes(interestLabel)) {
                        console.log('Añadiendo etiqueta de interés:', interestLabel)
                        return [...prevLabels, interestLabel]
                    }
                    return prevLabels
                })
            }
        }
        
        // Si hay un agentId en metadata pero no hay miembros, intentar usar los datos del agente
        if ((!members || members.length === 0) && metadata && metadata.agentId) {
            console.log("Detectado metadata.agentId sin miembros, ID:", metadata.agentId)
            
            // Hacer una consulta a la API para obtener los detalles del agente
            fetch(`/api/agents/${metadata.agentId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.agent) {
                        const agentMember = {
                            id: data.agent.id,
                            name: data.agent.name || data.agent.email || 'Agente',
                            email: data.agent.email || '',
                            img: data.agent.profile_image || ''
                        }
                        console.log('Agente obtenido de API:', agentMember)
                        setLocalMembers([agentMember])
                    }
                })
                .catch(err => {
                    console.error('Error al cargar datos del agente:', err)
                    // En caso de error, crear un miembro genérico
                    setLocalMembers([{
                        id: metadata.agentId,
                        name: 'Agente',
                        email: '',
                        img: ''
                    }])
                })
        }
    }, [members, labels, metadata])

    // Toggle para expandir/colapsar detalles adicionales
    const toggleDetails = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation(); // Evitar que el click se propague a la tarjeta completa
        setIsExpanded(!isExpanded);
    }

    const onCardClick = () => {
        openDialog()
        updateDialogView('LEAD')
        setSelectedLeadId(id)
    }

    /**
     * Traduce una etiqueta según su tipo usando el sistema de internacionalización.
     *
     * @param label - Etiqueta original en inglés
     * @returns Etiqueta traducida según el idioma configurado
     */
    const getTranslatedLabel = (label: string): string => {
        // Primero intentamos las etiquetas de leads inmobiliarios
        // que ya vienen en español
        if (
            label === 'Alta prioridad' ||
            label === 'Media prioridad' ||
            label === 'Baja prioridad' ||
            label === 'Compra' ||
            label === 'Alquiler' ||
            label === 'Comercial' ||
            label === 'Inversión' ||
            label === 'Cierre' ||
            label === 'Opción compra' ||
            label === 'Segunda vivienda' ||
            label === 'Nuevo contacto' ||
            label === 'Calificado' ||
            label === 'Cita agendada' ||
            label === 'Negociando' ||
            label === 'Cerrado' ||
            label === 'Perdido'
        ) {
            return label
        }

        // Mapeo entre etiquetas en inglés y sus claves de traducción
        const labelKeyMap: Record<string, string> = {
            'New lead': 'newLead',
            'High priority': 'highPriority',
            'Medium priority': 'mediumPriority',
            'Low priority': 'lowPriority',
            Purchase: 'purchase',
            Rent: 'rent',
            Commercial: 'commercial',
            Investment: 'investment',
            'Second home': 'secondHome',
            'Purchase option': 'purchaseOption',
        }

        // Intentamos obtener la traducción si existe una clave correspondiente
        if (labelKeyMap[label]) {
            try {
                return t(labelKeyMap[label])
            } catch (error) {
                // Si hay error en la traducción, devolvemos la etiqueta original
                console.warn(`Error al traducir etiqueta "${label}":`, error)
                return label
            }
        }

        // Si no hay una clave de traducción para esta etiqueta, devolvemos la original
        return label
    }

    // Función para formatear fecha
    const formatDate = (timestamp: number | undefined) => {
        if (!timestamp) return 'N/A'
        return new Date(timestamp).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
    }

    return (
        <Card
            ref={ref}
            clickable
            className="hover:shadow-lg rounded-lg mb-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative w-[260px] fixed-width-card fixed-height-card"
            bodyClass="p-4 flex flex-col h-full" // Usar flexbox para organizar el contenido
            onClick={() => onCardClick()}
            data-stage={stage} // Añadimos el stage como atributo de datos para debugging
            {...rest}
        >
            <div className="flex justify-between items-start mb-2">
                {/* Nombre del lead (cliente) */}
                <div className="font-bold heading-text text-base text-gray-900 dark:text-white pr-4 break-words">
                    {name}
                </div>

                {/* Etapa actual - Badge integrada en la línea superior con colores distintos según etapa */}
                {stage && (
                    <div
                        className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0
                        ${stage === 'new' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : ''}
                        ${stage === 'prospecting' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                        ${stage === 'qualification' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
                        ${stage === 'opportunity' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : ''}
                        ${!['new', 'prospecting', 'qualification', 'opportunity'].includes(stage) ? 'bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' : ''}
                    `}
                    >
                        {stage === 'new' && 'Nuevo'}
                        {stage === 'prospecting' && 'Prospección'}
                        {stage === 'qualification' && 'Calificación'}
                        {stage === 'opportunity' && 'Oportunidad'}
                        {![
                            'new',
                            'prospecting',
                            'qualification',
                            'opportunity',
                        ].includes(stage) && stage}
                    </div>
                )}
            </div>

            {/* Contenido siempre visible (información básica) */}
            <div className="basic-info flex-shrink-0 mb-2">
                {/* Información de contacto */}
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    {/* Email */}
                    {leadEmail && (
                        <div className="flex items-center gap-2">
                            <TbMail className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <span className="truncate max-w-full">{leadEmail}</span>
                        </div>
                    )}

                    {/* Teléfono */}
                    {leadPhone && (
                        <div className="flex items-center gap-2">
                            <TbPhone className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <span className="truncate">{leadPhone}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Etiquetas - Usando localLabels para mantener persistencia */}
            {localLabels.length > 0 && (
                <div className="mb-2 flex flex-wrap">
                    {localLabels.map((label, index) => (
                        <Tag
                            key={`${label}-${index}`}
                            className={`mr-2 rtl:ml-2 mb-2 ${leadLabelColors[label] || 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'}`}
                        >
                            {getTranslatedLabel(label)}
                        </Tag>
                    ))}
                </div>
            )}

            {/* Botón para expandir/colapsar detalles */}
            <button
                onClick={toggleDetails}
                className="expand-toggle flex items-center justify-center w-full py-1 mt-1 border-t border-gray-100 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                {isExpanded ? (
                    <>
                        <TbChevronUp className="mr-1" />
                        <span className="text-xs">Menos detalles</span>
                    </>
                ) : (
                    <>
                        <TbChevronDown className="mr-1" />
                        <span className="text-xs">Más detalles</span>
                    </>
                )}
            </button>

            {/* Detalles adicionales (colapsables) */}
            {isExpanded && metadata && (
                <div className="additional-details mt-2 text-sm text-gray-500 dark:text-gray-400 grid grid-cols-1 sm:grid-cols-2 gap-1.5 border-t border-gray-100 dark:border-gray-700 pt-2">
                    {/* Tipo de propiedad */}
                    {metadata.propertyType && (
                        <div className="flex items-center gap-2">
                            <TbHome className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <span className="truncate">
                                {metadata.propertyType}
                            </span>
                        </div>
                    )}

                    {/* Presupuesto */}
                    {metadata.budget !== undefined && (
                        <div className="flex items-center gap-2">
                            <TbCurrencyDollar className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <span className="truncate">
                                {formatBudget(metadata.budget)}
                            </span>
                        </div>
                    )}

                    {/* Zonas preferidas */}
                    {metadata.preferredZones &&
                        metadata.preferredZones.length > 0 && (
                            <div className="flex items-center gap-2 col-span-full">
                                <TbMap className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <span className="truncate">
                                    {metadata.preferredZones.join(', ')}
                                </span>
                            </div>
                        )}

                    {/* Dormitorios */}
                    {metadata.bedroomsNeeded !== undefined && (
                        <div className="flex items-center gap-2">
                            <TbBed className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <span className="truncate">
                                {metadata.bedroomsNeeded} dormitorio(s)
                            </span>
                        </div>
                    )}

                    {/* Baños */}
                    {metadata.bathroomsNeeded !== undefined && (
                        <div className="flex items-center gap-2">
                            <TbBath className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <span className="truncate">
                                {metadata.bathroomsNeeded} baño(s)
                            </span>
                        </div>
                    )}

                    {/* Contador de contactos */}
                    {contactCount !== undefined && (
                        <div className="flex items-center gap-2">
                            <TbPhone className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <span className="truncate">
                                {contactCount} contacto(s)
                            </span>
                        </div>
                    )}
                    
                    {/* Fecha de creación */}
                    {createdAt && (
                        <div className="flex items-center gap-2">
                            <TbCalendarEvent className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <span>Creado: {formatDate(createdAt)}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Espacio flexible para mantener el footer en la parte inferior */}
            <div className="flex-grow"></div>

            {/* Miembros, comentarios y adjuntos - siempre al final */}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                {/* Miembros asignados (siempre visible, con avatar placeholder si está vacío) */}
                <div className="flex items-center">
                    {localMembers.length > 0 ? (
                        <UsersAvatarGroup 
                            avatarProps={{ size: 25 }} 
                            users={localMembers} 
                            className="z-10" // Asegurar que esté por encima de otros elementos
                        />
                    ) : (
                        <div className="w-6 h-6 flex items-center justify-center text-gray-400">
                            <TbUserCircle size={20} className="opacity-70" />
                        </div>
                    )}
                </div>
                
                {/* Comentarios y adjuntos - siempre visibles con contador */}
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    {/* Icono de mensajes/comentarios (siempre visible) */}
                    <IconText
                        className="font-semibold gap-1"
                        icon={<TbMessageCircle className="text-base" />}
                    >
                        {comments.length || 0}
                    </IconText>
                    
                    {/* Icono de adjuntos (siempre visible) */}
                    <IconText
                        icon={<TbPaperclip />}
                        className="text-base gap-1"
                    >
                        {attachments.length || 0}
                    </IconText>
                </div>
            </div>
            
            {/* Inyectar estilos CSS para altura y ancho fijos */}
            <style jsx>{`
                .fixed-height-card {
                    height: 275px;
                    max-height: 275px;
                    transition: max-height 0.3s ease;
                }
                
                .fixed-height-card:has(.additional-details) {
                    max-height: 450px;
                    height: auto;
                }
                
                .fixed-width-card {
                    width: 260px !important;
                    min-width: 260px !important;
                    max-width: 260px !important;
                }
            `}</style>
        </Card>
    )
}

export default LeadCard