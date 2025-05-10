/**
 * frontend/src/app/(protected-pages)/superadmin/chatbot-builder/editor/page.tsx
 * Página del editor visual de flujos de chatbot
 * @version 1.2.0
 * @updated 2025-04-14
 */

'use client'

import './styles.css'
import React, { useRef, useEffect, useState } from 'react'
import { useTranslation } from '@/utils/hooks/useTranslation'
import HeaderBreadcrumbs from '@/components/shared/HeaderBreadcrumbs'
import ChatbotFlowEditor from './_components/ChatbotFlowEditor'
import {
    PiFloppyDiskDuotone,
    PiArrowLeftBold,
    PiPencilLine,
    PiBuildingsBold,
    PiRocketLaunchDuotone,
} from 'react-icons/pi' // Añadir PiRocketLaunchDuotone
import Button from '@/components/ui/Button'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import { useRouter, useSearchParams } from 'next/navigation'
import { notifications } from '@/utils/notifications'
import { supabase } from '@/services/supabase/SupabaseClient'
import { initializeChatbotDB } from '@/utils/setupChatbotTemplatesDB'
import { v4 as uuidv4 } from 'uuid'
import Input from '@/components/ui/Input'
import { Select, Option } from '@/components/ui/Select'

// Componente del editor
const ChatbotEditorPage = () => {
    const t = useTranslation('nav')
    const router = useRouter()
    const searchParams = useSearchParams()

    // Referencias a componentes
    const editorRef = useRef<any>(null)
    const nameInputRef = useRef<HTMLInputElement>(null)

    // Estado para manejar el nombre de la plantilla y guardado
    const [templateData, setTemplateData] = useState({
        name: 'Nueva plantilla',
        description: 'Descripción de la plantilla',
        vertical_id: '',
    })
    const [isSaving, setIsSaving] = useState(false)

    // Estado para la edición del nombre de la plantilla
    const [isEditingName, setIsEditingName] = useState(false)
    const [editedName, setEditedName] = useState('')
    const [editedDescription, setEditedDescription] = useState('')
    const [editedVerticalId, setEditedVerticalId] = useState('')

    // Estado para listar verticales disponibles
    const [verticals, setVerticals] = useState<any[]>([])
    const [loadingVerticals, setLoadingVerticals] = useState(true)

    // Extraer ID de la plantilla de los parámetros de búsqueda si existe
    const templateId = searchParams.get('id') || undefined

    // Efecto para actualizar los valores editables cuando cambia templateData
    useEffect(() => {
        setEditedName(templateData.name)
        setEditedDescription(templateData.description || '')
        setEditedVerticalId(templateData.vertical_id || '')
    }, [templateData])

    // Cargar verticales disponibles
    useEffect(() => {
        const loadVerticals = async () => {
            setLoadingVerticals(true)
            try {
                const { data, error } = await supabase
                    .from('verticals')
                    .select('id, name, brand_name, code')
                    .eq('is_active', true)
                    .order('name', { ascending: true })

                if (error) throw error
                setVerticals(data || [])
            } catch (err) {
                console.error('Error al cargar verticales:', err)
                notifications.error('Error al cargar verticales')
            } finally {
                setLoadingVerticals(false)
            }
        }

        loadVerticals()
    }, [])

    // Efecto para inicializar la base de datos y verificar si es una nueva plantilla
    useEffect(() => {
        const setup = async () => {
            try {
                const dbReady = await initializeChatbotDB()

                // Si no hay ID de plantilla, es una nueva plantilla
                // Usamos los valores por defecto ya establecidos

                // Si hay ID, intentar cargar detalles de la plantilla
                if (dbReady && templateId) {
                    try {
                        // Obtenemos la plantilla por ID
                        const { data: template, error } = await supabase
                            .from('chatbot_templates')
                            .select('name, description, vertical_id')
                            .eq('id', templateId) // Filtrar por ID
                            .single() // Obtener un solo resultado

                        if (error && error.code !== 'PGRST116') {
                            // PGRST116 = 'Row not found'
                            throw error
                        }

                        // Si se encontró la plantilla (data no es null)
                        if (template) {
                            console.log('Plantilla cargada:', template) // Depuración
                            setTemplateData({
                                name: template.name,
                                description:
                                    template.description || 'Sin descripción',
                                vertical_id: template.vertical_id || '',
                            })
                        } else {
                            console.warn(
                                `No se encontró la plantilla con ID ${templateId}`,
                            )
                            // Opcional: Redirigir a la página de lista si la plantilla no existe
                            // router.push('/superadmin/chatbot-builder');
                        }
                    } catch (err) {
                        console.error(
                            'Error al cargar detalles de la plantilla:',
                            err,
                        )
                    }
                }
            } catch (error) {
                console.error('Error al inicializar DB:', error)
            }
        }

        setup()
    }, [templateId])

    // Función para actualizar el nombre de la plantilla
    const handleNameUpdate = () => {
        if (!editedName.trim()) {
            notifications.error(
                'El nombre de la plantilla no puede estar vacío',
            )
            return
        }

        // Validar vertical seleccionada antes de actualizar
        if (
            editedVerticalId &&
            !verticals.some((v) => v.id === editedVerticalId)
        ) {
            notifications.error(
                'La vertical seleccionada ya no es válida. Por favor, elija otra.',
            )
            setIsEditingName(false) // Salir del modo edición para evitar más errores
            return
        }

        // Actualizar el estado local
        setTemplateData({
            ...templateData,
            name: editedName.trim(),
            description: editedDescription.trim(),
            vertical_id: editedVerticalId,
        })

        // Actualizar el nombre en el editor
        if (editorRef.current && editorRef.current.setTemplateData) {
            editorRef.current.setTemplateData({
                name: editedName.trim(),
                description: editedDescription.trim(),
                vertical_id: editedVerticalId,
            })
        }

        setIsEditingName(false)
        notifications.success('Información actualizada correctamente')
    }

    // Función para guardar el flujo
    const handleSave = async () => {
        setIsSaving(true)

        try {
            // Usar la referencia al componente editor para llamar a su método de guardado
            if (editorRef.current && editorRef.current.saveTemplate) {
                // Si no tenemos templateId, usamos el ID generado en el editor
                if (!templateId && editorRef.current.setTemplateData) {
                    // Asegurarnos de que se use el nombre actual
                    editorRef.current.setTemplateData({
                        name: templateData.name,
                        description: templateData.description,
                        vertical_id: templateData.vertical_id,
                    })
                }

                await editorRef.current.saveTemplate()
                // No es necesario mostrar toast aquí, ya que el componente lo maneja
            } else {
                notifications.error('No se pudo acceder al editor para guardar')
            }
        } catch (error) {
            console.error('Error al guardar la plantilla:', error)
            notifications.error('Error al guardar la plantilla')
        } finally {
            setIsSaving(false)
        }
    }

    // Función para publicar el flujo (guardar con estado 'published')
    const handlePublish = async () => {
        setIsSaving(true) // Usar el mismo estado de carga

        try {
            if (editorRef.current && editorRef.current.saveTemplate) {
                if (!templateId && editorRef.current.setTemplateData) {
                    editorRef.current.setTemplateData({
                        name: templateData.name,
                        description: templateData.description,
                        vertical_id: templateData.vertical_id,
                    })
                }
                // Llamar a saveTemplate indicando que se publique
                await editorRef.current.saveTemplate({ status: 'published' })
                // El componente hijo mostrará la notificación
            } else {
                notifications.error(
                    'No se pudo acceder al editor para publicar',
                )
            }
        } catch (error) {
            console.error('Error al publicar la plantilla:', error)
            notifications.error('Error al publicar la plantilla')
        } finally {
            setIsSaving(false)
        }
    }

    // Función para volver a la lista de plantillas
    const handleBack = () => {
        router.push('/superadmin/chatbot-builder')
    }

    return (
        <>
            <HeaderBreadcrumbs
                heading={
                    isEditingName ? (
                        <div className="flex flex-col gap-2 w-full max-w-md">
                            <div>
                                <label
                                    htmlFor="template-name"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Nombre de la plantilla
                                </label>
                                <Input
                                    id="template-name"
                                    ref={nameInputRef}
                                    value={editedName}
                                    onChange={(e) =>
                                        setEditedName(e.target.value)
                                    }
                                    placeholder="Nombre de la plantilla"
                                    className="w-full"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleNameUpdate()
                                        } else if (e.key === 'Escape') {
                                            setIsEditingName(false)
                                            setEditedName(templateData.name)
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="template-description"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Descripción
                                </label>
                                <Input
                                    id="template-description"
                                    value={editedDescription}
                                    onChange={(e) =>
                                        setEditedDescription(e.target.value)
                                    }
                                    placeholder="Descripción de la plantilla"
                                    className="w-full"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleNameUpdate()
                                        } else if (e.key === 'Escape') {
                                            setIsEditingName(false)
                                            setEditedDescription(
                                                templateData.description || '',
                                            )
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="template-vertical"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Vertical
                                </label>
                                <Select
                                    id="template-vertical"
                                    value={editedVerticalId}
                                    onChange={(value) =>
                                        setEditedVerticalId(value)
                                    }
                                    className="w-full"
                                    isLoading={loadingVerticals}
                                >
                                    <Option value="">
                                        Sin vertical
                                    </Option>
                                    {verticals.map((vertical) => (
                                        <Option
                                            key={vertical.id}
                                            value={vertical.id}
                                        >
                                            {vertical.name} (
                                            {vertical.brand_name})
                                        </Option>
                                    ))}
                                </Select>
                                <div className="text-xs text-gray-500 mt-1">
                                    Asignar una vertical permitirá organizar
                                    mejor las plantillas y aplicar
                                    configuraciones específicas.
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-1">
                                <Button
                                    size="sm"
                                    variant="default"
                                    color="gray"
                                    onClick={() => {
                                        setIsEditingName(false)
                                        setEditedName(templateData.name)
                                        setEditedDescription(
                                            templateData.description || '',
                                        )
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="solid"
                                    color="blue"
                                    onClick={handleNameUpdate}
                                >
                                    Actualizar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="truncate">
                                {templateData.name}
                            </span>
                            {templateData.vertical_id &&
                                verticals.length > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                        <PiBuildingsBold className="mr-1" />
                                        {verticals.find(
                                            (v) =>
                                                v.id ===
                                                templateData.vertical_id,
                                        )?.name || 'Vertical'}
                                    </span>
                                )}
                            <button
                                onClick={() => {
                                    setIsEditingName(true)
                                    setTimeout(
                                        () => nameInputRef.current?.focus(),
                                        100,
                                    )
                                }}
                                className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100"
                                title="Editar nombre"
                            >
                                <PiPencilLine className="text-lg" />
                            </button>
                        </div>
                    )
                }
                links={[
                    { name: t('dashboard.dashboard'), href: '/home' },
                    {
                        name: t('superadmin.tools'),
                        href: '/superadmin/chatbot-builder',
                    },
                    {
                        name: t('superadmin.chatbotBuilder'),
                        href: '/superadmin/chatbot-builder',
                    },
                    { name: 'Editor de Flujo' },
                ]}
                action={
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="default"
                            color="gray"
                            icon={<PiArrowLeftBold className="text-lg" />}
                            onClick={handleBack}
                        >
                            Volver
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            color="blue"
                            icon={<PiFloppyDiskDuotone className="text-lg" />}
                            onClick={handleSave}
                            loading={isSaving}
                        >
                            Guardar
                        </Button>
                        {/* Botón Publicar */}
                        <Button
                            size="sm"
                            variant="solid"
                            color="emerald" // Usar color verde para publicar
                            icon={<PiRocketLaunchDuotone className="text-lg" />}
                            onClick={handlePublish}
                            loading={isSaving} // Usar el mismo estado de carga
                        >
                            Publicar
                        </Button>
                    </div>
                }
            />

            <AdaptiveCard
                className="mb-6 h-[calc(100vh-240px)]"
                bodyClass="p-0 h-full"
            >
                <div className="w-full h-full chatbot-editor-container">
                    <ChatbotFlowEditor
                        templateId={templateId}
                        ref={editorRef}
                    />
                </div>
            </AdaptiveCard>
        </>
    )
}

export default ChatbotEditorPage
