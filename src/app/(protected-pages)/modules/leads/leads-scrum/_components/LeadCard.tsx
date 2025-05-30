/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/LeadCard.tsx
 * Tarjeta individual para leads inmobiliarios dentro del funnel de ventas.
 * Mejorada con soporte para dark mode y mejor distinción visual.
 * Actualizada para mostrar información completa del lead.
 * Corregido problema con avatares de agentes y etiquetas que no persisten al recargar.
 * Añadida persistencia al botón "Más detalles" usando localStorage.
 *
 * @version 3.9.0
 * @updated 2025-05-20
 */

'use client'

import { useState, useEffect } from 'react' // Añadir useState y useEffect para manejo de estado
import { motion } from 'framer-motion' // Añadir animaciones
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import IconText from '@/components/shared/IconText'
import Avatar from '@/components/ui/Avatar'
import Image from 'next/image'
import { FaInstagram } from 'react-icons/fa'
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
    isDragging?: boolean
}

const LeadCard = (props: LeadCardProps) => {
    const { openDialog, updateDialogView, setSelectedLeadId } =
        useSalesFunnelStore()

    // Función para leer el estado expandido desde localStorage
    const getStoredExpandedState = (leadId: string): boolean => {
        // Solo ejecutar en cliente
        if (typeof window === 'undefined') return false
        
        try {
            // Usar el mismo prefijo consistente
            const key = `salesfunnel_lead_expanded_${leadId}`
            const storedData = localStorage.getItem(key)
            console.log(`[DEBUG] Leyendo estado para lead ${leadId}: ${storedData} con clave ${key}`)
            return storedData === 'true'
        } catch (error) {
            console.error('Error al leer estado expandido:', error)
            return false
        }
    }

    // Estado para controlar si los detalles están expandidos o colapsados
    // Intentar leer el estado desde localStorage directamente en la inicialización
    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof window !== 'undefined') {
            const key = `salesfunnel_lead_expanded_${props.data.id}`;
            const storedValue = localStorage.getItem(key);
            return storedValue === 'true';
        }
        return false;
    });

    // Estado local para miembros y etiquetas, para asegurar persistencia
    const [localMembers, setLocalMembers] = useState<any[]>([])
    const [localLabels, setLocalLabels] = useState<string[]>([])

    // Hook para traducir las etiquetas de leads
    const t = useTranslations('salesFunnel.leads.types')

    const { data, ref, isDragging = false, ...rest } = props

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
    const leadEmail = email || metadata?.email || ''
    const leadPhone = phone || metadata?.phone || ''
    const description = data.description || ''
    
    // Obtener la fuente del lead (por defecto WhatsApp)
    const leadSource = metadata?.source || 'whatsapp'

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
        const priorityLabels = [
            'Alta prioridad',
            'Media prioridad',
            'Baja prioridad',
            'High priority',
            'Medium priority',
            'Low priority',
        ]

        const hasPriorityLabel =
            labels && labels.some((label) => priorityLabels.includes(label))

        if (!hasPriorityLabel && metadata && metadata.interest) {
            const interestLabel = interestToLabel(metadata.interest)
            if (interestLabel) {
                setLocalLabels((prevLabels) => {
                    // Solo añadir si no existe ya
                    if (!prevLabels.includes(interestLabel)) {
                        console.log(
                            'Añadiendo etiqueta de interés:',
                            interestLabel,
                        )
                        return [...prevLabels, interestLabel]
                    }
                    return prevLabels
                })
            }
        }

        // Si hay un agentId en metadata pero no hay miembros, intentar usar los datos del agente
        if (
            (!members || members.length === 0) &&
            metadata &&
            metadata.agentId
        ) {
            console.log(
                'Detectado metadata.agentId sin miembros, ID:',
                metadata.agentId,
            )

            // Hacer una consulta a la API para obtener los detalles del agente
            fetch(`/api/agents/${metadata.agentId}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data && data.agent) {
                        const agentMember = {
                            id: data.agent.id,
                            name:
                                data.agent.name || data.agent.email || 'Agente',
                            email: data.agent.email || '',
                            img: data.agent.profile_image || '',
                        }
                        console.log('Agente obtenido de API:', agentMember)
                        setLocalMembers([agentMember])
                    }
                })
                .catch((err) => {
                    console.error('Error al cargar datos del agente:', err)
                    // En caso de error, crear un miembro genérico
                    setLocalMembers([
                        {
                            id: metadata.agentId,
                            name: 'Agente',
                            email: '',
                            img: '',
                        },
                    ])
                })
        }
    }, [members, labels, metadata])

    // Efecto para inicializar y mantener el estado expandido
    useEffect(() => {
        // Recuperar el estado guardado para este lead específico
        const savedExpandedState = getStoredExpandedState(data.id)
        console.log(`[DEBUG] Inicializando estado para lead ${data.id}: ${savedExpandedState}`)
        
        // Actualizar el estado local con el valor guardado
        setIsExpanded(savedExpandedState)

        // Manejar eventos de cambio de otras instancias del mismo lead
        const handleStateChange = (event: any) => {
            if (event.detail && event.detail.leadId === data.id) {
                console.log(`[DEBUG] Recibido evento de cambio para lead ${data.id}: ${event.detail.expanded}`)
                setIsExpanded(event.detail.expanded)
            }
        };

        // Suscribirse al evento
        window.addEventListener('leadStateChange', handleStateChange);

        // Limpiar al desmontar
        return () => {
            window.removeEventListener('leadStateChange', handleStateChange);
        };
    }, [data.id]) // Se ejecuta cuando cambia el ID del lead

    // Toggle para expandir/colapsar detalles adicionales
    const toggleDetails = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation() // Evitar que el click se propague a la tarjeta completa
        const newExpandedState = !isExpanded
        
        // Actualizar estado local
        setIsExpanded(newExpandedState)
        
        // Persistir en localStorage (solo en cliente)
        if (typeof window !== 'undefined') {
            try {
                // Usar un prefijo consistente para todas las instancias
                const key = `salesfunnel_lead_expanded_${data.id}`
                const value = newExpandedState.toString()
                localStorage.setItem(key, value)
                console.log(`[DEBUG] Guardando estado para lead ${data.id}: ${value} con clave ${key}`)
                
                // Intentar notificar a otras instancias del mismo componente
                try {
                    window.dispatchEvent(new CustomEvent('leadStateChange', {
                        detail: { leadId: data.id, expanded: newExpandedState }
                    }));
                } catch (eventError) {
                    console.warn('No se pudo emitir evento de cambio de estado:', eventError);
                }
            } catch (error) {
                console.error('Error al guardar estado expandido:', error)
            }
        }
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
        <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            whileHover={
                isDragging
                    ? undefined
                    : {
                          scale: 1.02,
                          transition: { duration: 0.1, ease: 'easeOut' }
                      }
            }
            whileTap={
                isDragging
                    ? undefined
                    : {
                          scale: 0.98,
                          transition: { duration: 0.1 }
                      }
            }
            data-lead-id={id}
        >
            <Card
                ref={ref}
                clickable
                className="hover:shadow-lg rounded-lg mb-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative w-[260px] fixed-width-card fixed-height-card transition-all duration-150 ease-out hover:border-gray-300 dark:hover:border-gray-600"
                bodyClass="p-4 flex flex-col h-full" // Usar flexbox para organizar el contenido
                onClick={() => onCardClick()}
                data-stage={stage} // Añadimos el stage como atributo de datos para debugging
                {...rest}
            >
                <div className="flex justify-between items-start mb-2">
                    {/* Nombre del lead (cliente) */}
                    <div className="font-bold heading-text text-base text-gray-900 dark:text-white pr-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
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
                                <span className="truncate max-w-full">
                                    {leadEmail}
                                </span>
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
                    <div className="mb-2 flex flex-nowrap overflow-x-auto hide-scrollbar">
                        {localLabels.map((label, index) => (
                            <Tag
                                key={`${label}-${index}`}
                                className={`mr-2 rtl:ml-2 mb-2 ${leadLabelColors[label] || 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'} whitespace-nowrap text-xs`}
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
                    {/* Miembros asignados con icono de fuente del lead */}
                    <div className="flex items-center gap-1">
                        {localMembers.length > 0 ? (
                            <>
                                <UsersAvatarGroup
                                    avatarProps={{ size: 25 }}
                                    users={localMembers}
                                    className="z-10" // Asegurar que esté por encima de otros elementos
                                />
                                {/* Icono de la fuente del lead (WhatsApp/Instagram) */}
                                {leadSource === 'instagram' ? (
                                    <div className="relative w-[25px] h-[25px] rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                                        <FaInstagram className="text-pink-600 dark:text-pink-400 w-4 h-4" />
                                    </div>
                                ) : (
                                    <div className="relative w-[25px] h-[25px] rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center p-1">
                                        <Image 
                                            src="/img/icons/whatsIcon.png"
                                            alt="WhatsApp"
                                            width={18}
                                            height={18}
                                            className="object-contain"
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-1">
                                <div className="w-6 h-6 flex items-center justify-center text-gray-400">
                                    <TbUserCircle
                                        size={20}
                                        className="opacity-70"
                                    />
                                </div>
                                {/* Icono de la fuente del lead incluso cuando no hay agente */}
                                {leadSource === 'instagram' ? (
                                    <div className="relative w-[25px] h-[25px] rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                                        <FaInstagram className="text-pink-600 dark:text-pink-400 w-4 h-4" />
                                    </div>
                                ) : (
                                    <div className="relative w-[25px] h-[25px] rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center p-1">
                                        <Image 
                                            src="/img/icons/whatsIcon.png"
                                            alt="WhatsApp"
                                            width={18}
                                            height={18}
                                            className="object-contain"
                                        />
                                    </div>
                                )}
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
                        transition: all 0.1s ease-out;
                        transform-origin: center center;
                    }
                    
                    /* Altura reducida en móvil para ver más tarjetas */
                    @media (max-width: 768px) {
                        .fixed-height-card {
                            height: 240px;
                            max-height: 240px;
                        }
                    }

                    .fixed-height-card:has(.additional-details) {
                        max-height: 450px;
                        height: auto;
                    }

                    /* Prevenir el corte del contenido durante el hover */
                    .board-column {
                        overflow: visible !important;
                    }

                    /* Asegurar que el card tenga espacio para crecer durante el hover */
                    .fixed-width-card {
                        position: relative;
                        z-index: 1;
                    }

                    .fixed-width-card:hover {
                        z-index: 10;
                    }

                    .fixed-width-card {
                        width: 260px !important;
                        min-width: 260px !important;
                        max-width: 260px !important;
                    }
                    
                    /* Ocultar scrollbar pero mantener funcionalidad */
                    .hide-scrollbar::-webkit-scrollbar {
                        display: none; /* Safari y Chrome */
                    }
                    
                    .hide-scrollbar {
                        -ms-overflow-style: none;  /* IE y Edge */
                        scrollbar-width: none;  /* Firefox */
                    }
                `}</style>
            </Card>
        </motion.div>
    )
}

export default LeadCard
