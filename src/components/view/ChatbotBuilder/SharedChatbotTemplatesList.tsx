/**
 * frontend/src/components/view/ChatbotBuilder/SharedChatbotTemplatesList.tsx
 * Componente compartido para listar y gestionar plantillas de chatbot, con modo superadmin/regular
 * @version 1.1.0
 * @updated 2025-04-09
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Table from '@/components/ui/Table'
import { toast } from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import {
    PiPlusCircleBold,
    PiPencilSimpleLineBold,
    PiTrashBold,
    PiCopyBold,
    PiArrowDownBold,
    PiUploadSimpleBold,
    PiRobotBold,
    PiDownloadSimpleBold,
} from 'react-icons/pi'
import { v4 as uuidv4 } from 'uuid'
import { format, formatDistance } from 'date-fns'
import { es } from 'date-fns/locale'
import Th from '@/components/ui/Table/Th'

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const { Tr, Td, THead, TBody } = Table

// Clave para localStorage
const LOCAL_STORAGE_KEY = 'mock_chatbot_templates'

interface Template {
    id: string
    name: string
    description: string
    status: 'draft' | 'published'
    vertical_id?: string
    vertical_name?: string
    created_at: string
    updated_at: string
    react_flow_json?: unknown
}

interface SharedChatbotTemplatesListProps {
    isAdmin?: boolean // Determina si se muestra la interfaz de admin o regular
    onCreateNew?: () => void
    onEdit?: (templateId: string) => void
    basePath?: string // Ruta base para navegación (ej: '/concepts/chatbot' o '/concepts/superadmin/chatbot-builder')
}

// Función auxiliar para mostrar mensajes de error
const showError = (message: string) => {
    toast.push(
        <Notification type="danger" closable>
            {message}
        </Notification>
    )
}

// Función auxiliar para mostrar mensajes de éxito
const showSuccess = (message: string) => {
    toast.push(
        <Notification type="success" closable>
            {message}
        </Notification>
    )
}

const SharedChatbotTemplatesList: React.FC<SharedChatbotTemplatesListProps> = ({
    isAdmin = false,
    onCreateNew,
    onEdit,
    // basePath = '/concepts/chatbot', // Removed unused variable
}) => {
    // Estado
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(
        null,
    )
    // const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all') // Moved
    const [search, setSearch] = useState('')
    const [importModalOpen, setImportModalOpen] = useState(false)
    const [jsonContent, setJsonContent] = useState('')

    // Referencias
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Cargar plantillas al iniciar
    useEffect(() => {
        loadTemplates()
    }, [])

    // Cargar las plantillas desde Supabase y localStorage
    const loadTemplates = async () => {
        try {
            setLoading(true)
            console.log(
                `SharedChatbotTemplatesList: Cargando plantillas (${isAdmin ? 'Admin' : 'Regular'})`,
            )

            let templateList: Template[] = []

            // Primero intentar cargar desde Supabase
            try {
                const { data, error } = await supabase
                    .from('chatbot_templates')
                    .select('*')

                if (error) {
                    console.warn('Error al cargar desde Supabase:', error)
                } else if (data && data.length > 0) {
                    console.log(
                        `Cargadas ${data.length} plantillas desde Supabase`,
                    )
                    templateList = data.filter((t) => !t.is_deleted)

                    // Guardar en localStorage para futuras referencias
                    const storedTemplates = JSON.parse(
                        localStorage.getItem(LOCAL_STORAGE_KEY) || '{}',
                    )
                    data.forEach((template) => {
                        storedTemplates[template.id] = template
                    })
                    localStorage.setItem(
                        LOCAL_STORAGE_KEY,
                        JSON.stringify(storedTemplates),
                    )
                }
            } catch (supabaseError) {
                console.warn('Error al consultar Supabase:', supabaseError)
            }

            // Si no hay plantillas en Supabase o hubo error, usar localStorage
            if (templateList.length === 0) {
                try {
                    const storedTemplates = JSON.parse(
                        localStorage.getItem(LOCAL_STORAGE_KEY) || '{}',
                    )
                    templateList = Object.values(storedTemplates)
                    console.log(
                        `Cargadas ${templateList.length} plantillas desde localStorage`,
                    )
                } catch (localError) {
                    console.warn(
                        'Error al cargar desde localStorage:',
                        localError,
                    )
                }
            }

            // Ordenar por fecha de actualización (más reciente primero)
            templateList.sort((a, b) => {
                const dateA = new Date(a.updated_at || 0).getTime()
                const dateB = new Date(b.updated_at || 0).getTime()
                return dateB - dateA
            })

            setTemplates(templateList)
        } catch (err) {
            console.error('Error al cargar plantillas:', err)
            setError('Error al cargar plantillas. Intente nuevamente.')
            showError('Error al cargar plantillas')
        } finally {
            setLoading(false)
        }
    }

    // Manejar edición de plantilla
    const handleEditTemplate = (id: string) => {
        console.log(`SharedChatbotTemplatesList: Editando plantilla ${id}`)

        // Verificar que existe la plantilla
        const template = templates.find((t) => t.id === id)
        if (!template) {
            showError('No se encontró la plantilla')
            return
        }

        // Asegurar que está en localStorage antes de redirigir
        try {
            const storedTemplates = JSON.parse(
                localStorage.getItem(LOCAL_STORAGE_KEY) || '{}',
            )
            if (!storedTemplates[id]) {
                console.log(
                    'Agregando plantilla a localStorage antes de editar',
                )
                storedTemplates[id] = template
                localStorage.setItem(
                    LOCAL_STORAGE_KEY,
                    JSON.stringify(storedTemplates),
                )
            }
        } catch (e) {
            console.warn('Error al actualizar localStorage:', e)
        }

        // Redirigir según el tipo de usuario
        if (onEdit) {
            onEdit(id)
        } else {
            const editPath = isAdmin
                ? `/concepts/superadmin/chatbot-builder/editor?id=${id}`
                : `/concepts/chatbot/template/${id}`

            router.push(editPath)
        }
    }
    // Manejar duplicación de plantilla
    const handleDuplicateTemplate = async (id: string) => {
        const template = templates.find((t) => t.id === id)
        if (!template) {
            showError('No se encontró la plantilla para duplicar')
            return
        }

        const newId = uuidv4()

        // Crear copia
        const newTemplate: Template = {
            ...template,
            id: newId,
            name: `${template.name} (Copia)`,
            status: 'draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        // Guardar en localStorage
        try {
            const storedTemplates = JSON.parse(
                localStorage.getItem(LOCAL_STORAGE_KEY) || '{}',
            )
            storedTemplates[newId] = newTemplate
            localStorage.setItem(
                LOCAL_STORAGE_KEY,
                JSON.stringify(storedTemplates),
            )
        } catch (e) {
            console.warn('Error al guardar en localStorage:', e)
        }

        // Intentar guardar en Supabase
        try {
            const { error } = await supabase.from('chatbot_templates').insert({
                id: newId,
                name: newTemplate.name,
                description: newTemplate.description,
                status: newTemplate.status,
                react_flow_json: newTemplate.react_flow_json,
                created_at: newTemplate.created_at,
                updated_at: newTemplate.updated_at,
            })

            if (error) {
                console.warn('Error al guardar duplicado en Supabase:', error)
            } else {
                console.log('Plantilla duplicada guardada en Supabase')
            }
        } catch (err) {
            console.warn('Error al llamar a Supabase para duplicar:', err)
        }

        // Actualizar la lista
        setTemplates([newTemplate, ...templates])
        showSuccess('Plantilla duplicada correctamente')
    }

    // Manejar eliminación de plantilla
    const handleDeleteTemplate = async () => {
        if (!templateToDelete) return

        // Buscar la plantilla
        const template = templates.find((t) => t.id === templateToDelete)
        if (!template) {
            showError('No se encontró la plantilla para eliminar')
            setDeleteConfirmOpen(false)
            return
        }

        // Eliminar de localStorage
        try {
            const storedTemplates = JSON.parse(
                localStorage.getItem(LOCAL_STORAGE_KEY) || '{}',
            )
            delete storedTemplates[templateToDelete]
            localStorage.setItem(
                LOCAL_STORAGE_KEY,
                JSON.stringify(storedTemplates),
            )
        } catch (e) {
            console.warn('Error al eliminar de localStorage:', e)
        }

        // Intentar eliminar o marcar como eliminado en Supabase
        try {
            // Primero intentar soft delete (actualizar is_deleted)
            const { error } = await supabase
                .from('chatbot_templates')
                .update({ is_deleted: true })
                .eq('id', templateToDelete)

            if (error) {
                console.warn(
                    'Error en soft delete, intentando eliminar completamente:',
                    error,
                )
                // Si falla, intentar hard delete
                const { error: deleteError } = await supabase
                    .from('chatbot_templates')
                    .delete()
                    .eq('id', templateToDelete)

                if (deleteError) {
                    console.warn('Error en hard delete:', deleteError)
                } else {
                    console.log('Plantilla eliminada de Supabase (hard delete)')
                }
            } else {
                console.log(
                    'Plantilla marcada como eliminada en Supabase (soft delete)',
                )
            }
        } catch (err) {
            console.warn('Error al llamar a Supabase para eliminar:', err)
        }

        // Actualizar la lista local
        setTemplates(templates.filter((t) => t.id !== templateToDelete))
        setDeleteConfirmOpen(false)
        showSuccess('Plantilla eliminada correctamente')
    }

    // Procesar la importación de una plantilla a partir de un string JSON
    const processTemplateImport = async (jsonString: string) => {
        try {
            const templateData = JSON.parse(jsonString)
            
            // Validar que es una plantilla válida
            if (!templateData.name || !templateData.id) {
                showError('El contenido no contiene una plantilla válida')
                return
            }
            
            // Generar un nuevo ID para evitar conflictos
            const originalId = templateData.id
            const newId = uuidv4()
            
            // Crear plantilla con metadata actualizada
            const importedTemplate: Template = {
                ...templateData,
                id: newId,
                name: `${templateData.name} (Importada)`,
                status: 'draft',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
            
            // Si tiene react_flow_json, actualizar los IDs de los nodos para evitar conflictos
            if (importedTemplate.react_flow_json) {
                try {
                    // Actualizar referencias de ID en el react_flow_json
                    const flowData = typeof importedTemplate.react_flow_json === 'string'
                        ? JSON.parse(importedTemplate.react_flow_json)
                        : importedTemplate.react_flow_json
                        
                    if (flowData.elements) {
                        // Mapeo de IDs antiguos a nuevos para mantener las conexiones
                        const idMapping: Record<string, string> = {}
                        
                        // Generar nuevos IDs para todos los nodos y guardar el mapeo
                        flowData.elements = flowData.elements.map((el: any) => {
                            // Si es un nodo (no un edge/conexión)
                            if (el.type !== 'edge' && el.id) {
                                const newNodeId = `${el.id}-${newId.substring(0, 8)}`
                                idMapping[el.id] = newNodeId
                                return { ...el, id: newNodeId }
                            }
                            return el
                        })
                        
                        // Actualizar las conexiones con los nuevos IDs
                        flowData.elements = flowData.elements.map((el: any) => {
                            if (el.type === 'edge') {
                                return {
                                    ...el,
                                    source: idMapping[el.source] || el.source,
                                    target: idMapping[el.target] || el.target
                                }
                            }
                            return el
                        })
                    }
                    
                    // Actualizar el react_flow_json con los nuevos IDs
                    importedTemplate.react_flow_json = flowData
                } catch (flowError) {
                    console.warn('Error al actualizar IDs en react_flow_json:', flowError)
                    // Continuar con la importación aunque haya errores en la actualización de IDs
                }
            }
            
            // Guardar en localStorage
            try {
                const storedTemplates = JSON.parse(
                    localStorage.getItem(LOCAL_STORAGE_KEY) || '{}'
                )
                storedTemplates[newId] = importedTemplate
                localStorage.setItem(
                    LOCAL_STORAGE_KEY,
                    JSON.stringify(storedTemplates)
                )
            } catch (e) {
                console.warn('Error al guardar en localStorage:', e)
            }
            
            // Intentar guardar en Supabase
            try {
                const { error } = await supabase.from('chatbot_templates').insert({
                    ...importedTemplate,
                    id: newId
                })
                
                if (error) {
                    console.warn('Error al guardar importación en Supabase:', error)
                } else {
                    console.log('Plantilla importada guardada en Supabase')
                }
            } catch (supabaseError) {
                console.warn('Error al llamar a Supabase para importar:', supabaseError)
            }
            
            // Actualizar la lista local
            setTemplates([importedTemplate, ...templates])
            showSuccess('Plantilla importada correctamente')
            return true
        } catch (parseError) {
            console.error('Error al parsear JSON:', parseError)
            showError('El contenido no contiene un JSON válido')
            return false
        }
    }

    // Manejar importación de plantilla desde archivo
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        
        try {
            const reader = new FileReader()
            
            reader.onload = async (e) => {
                const jsonString = e.target?.result as string
                const success = await processTemplateImport(jsonString)
                
                // Limpiar el input file
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            }
            
            reader.readAsText(file)
        } catch (error) {
            console.error('Error al importar plantilla:', error)
            showError('Error al importar la plantilla')
        }
    }
    
    // Manejar importación desde texto pegado
    const handleJsonImport = async () => {
        if (!jsonContent.trim()) {
            showError('Por favor, ingresa el contenido JSON de la plantilla')
            return
        }
        
        const success = await processTemplateImport(jsonContent)
        if (success) {
            setImportModalOpen(false)
            setJsonContent('')
        }
    }

    // Filtrar plantillas según búsqueda y filtros
    const filteredTemplates = templates.filter((template) => {
        // // Filtro de estado (draft/published) - Moved
        // if (filter !== 'all' && template.status !== filter) {
        //     return false
        // }

        // Filtro de búsqueda
        if (search && search.trim() !== '') {
            const searchLower = search.toLowerCase()
            return (
                template.name.toLowerCase().includes(searchLower) ||
                template.description.toLowerCase().includes(searchLower)
            )
        }

        return true
    })

    // Renderizar contenido dinámicamente
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center border border-gray-200 dark:border-gray-700">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Cargando plantillas...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4">
                    <p className="font-medium">Error</p>
                    <p>{error}</p>
                </div>
                <Button
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                    onClick={loadTemplates}
                >
                    Reintentar
                </Button>
            </div>
        )
    }

    // Renderizar contenido principal (diferenciado entre admin y regular)
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            {/* Barra de filtros y búsqueda */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <div className="flex-grow mr-4">
                        <Input
                            type="text"
                            className="w-full" // Simplified className, ECME Input handles styling
                            placeholder="Buscar por nombre o descripción..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            variant="solid" 
                            color="primary"
                            size="sm"
                            icon={<PiPlusCircleBold />}
                            onClick={
                                onCreateNew ||
                                (() => {
                                    const path = isAdmin
                                        ? `/concepts/superadmin/chatbot-builder/editor`
                                        : `/concepts/chatbot/template/new`
                                    router.push(path)
                                })
                            }
                        >
                            Nueva Plantilla
                        </Button>
                    </div>
                </div>
            </div>

            {/* Lista de plantillas */}
            {filteredTemplates.length === 0 ? (
                <div className="p-8 text-center">
                    <PiRobotBold className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        No se encontraron plantillas con los filtros
                        seleccionados.
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Utiliza los botones en la parte superior para crear o importar una plantilla.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <THead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <Tr className="border-gray-200 dark:border-gray-700">
                                <Th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700"
                                >
                                    Nombre
                                </Th>
                                <Th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700"
                                >
                                    {isAdmin ? 'Industria' : 'Estado'}
                                </Th>
                                <Th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700"
                                >
                                    Publicado
                                </Th>
                                <Th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700"
                                >
                                    Última actualización
                                </Th>
                                <Th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700"
                                >
                                    Acciones
                                </Th>
                            </Tr>
                        </THead>
                        <TBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredTemplates.map((template) => (
                                <Tr
                                    key={template.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700"
                                >
                                    <Td className="px-6 py-4 whitespace-nowrap border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {template.name}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                                    {template.description}
                                                </div>
                                            </div>
                                        </div>
                                    </Td>
                                    <Td className="px-6 py-4 whitespace-nowrap border-gray-200 dark:border-gray-700">
                                        {isAdmin ? (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {template.vertical_name ||
                                                    'Sin categoría'}
                                            </div>
                                        ) : (
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    template.status ===
                                                    'published'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                                                }`}
                                            >
                                                {template.status === 'published'
                                                    ? 'Publicada'
                                                    : 'Borrador'}
                                            </span>
                                        )}
                                    </Td>
                                    <Td className="px-6 py-4 whitespace-nowrap border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center space-x-2">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    template.status === 'published'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                {template.status === 'published'
                                                    ? 'Sí'
                                                    : 'No'}
                                            </span>
                                            {isAdmin && template.status === 'draft' && (
                                                <button
                                                    className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            // Actualizar en Supabase
                                                            const { error } = await supabase
                                                                .from('chatbot_templates')
                                                                .update({
                                                                    status: 'published',
                                                                    updated_at: new Date().toISOString()
                                                                })
                                                                .eq('id', template.id);

                                                            if (error) throw error;

                                                            // Actualizar en localStorage
                                                            try {
                                                                const storedTemplates = JSON.parse(
                                                                    localStorage.getItem(LOCAL_STORAGE_KEY) || '{}'
                                                                );

                                                                if (storedTemplates[template.id]) {
                                                                    storedTemplates[template.id].status = 'published';
                                                                    storedTemplates[template.id].updated_at = new Date().toISOString();

                                                                    localStorage.setItem(
                                                                        LOCAL_STORAGE_KEY,
                                                                        JSON.stringify(storedTemplates)
                                                                    );
                                                                }
                                                            } catch (localStorageError) {
                                                                console.warn('Error al actualizar localStorage:', localStorageError);
                                                            }

                                                            // Actualizar estado local
                                                            setTemplates(templates.map(t =>
                                                                t.id === template.id
                                                                    ? {...t, status: 'published'}
                                                                    : t
                                                            ));

                                                            showSuccess('Plantilla publicada correctamente');

                                                        } catch (err) {
                                                            console.error('Error al publicar plantilla:', err);
                                                            showError('Error al publicar la plantilla');
                                                        }
                                                    }}
                                                >
                                                    Publicar
                                                </button>
                                            )}
                                        </div>
                                    </Td>
                                    <Td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700">
                                        {formatDistance(
                                            new Date(template.updated_at),
                                            new Date(),
                                            { addSuffix: true, locale: es },
                                        )}
                                    </Td>
                                    <Td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                shape="circle"
                                                size="sm"
                                                variant="plain"
                                                icon={
                                                    <PiPencilSimpleLineBold />
                                                }
                                                onClick={() =>
                                                    handleEditTemplate(
                                                        template.id,
                                                    )
                                                }
                                                title="Editar"
                                            />
                                            <Button
                                                shape="circle"
                                                size="sm"
                                                variant="plain"
                                                icon={<PiCopyBold />}
                                                onClick={() =>
                                                    handleDuplicateTemplate(
                                                        template.id,
                                                    )
                                                }
                                                title="Clonar"
                                            />
                                            <Button
                                                shape="circle"
                                                size="sm"
                                                variant="plain"
                                                icon={<PiUploadSimpleBold />}
                                                onClick={() => setImportModalOpen(true)}
                                                title="Importar"
                                            />
                                            <Button
                                                shape="circle"
                                                size="sm"
                                                variant="plain"
                                                icon={<PiDownloadSimpleBold />}
                                                onClick={() => {
                                                    // Exportar plantilla
                                                    try {
                                                        const dataStr =
                                                            JSON.stringify(
                                                                template,
                                                                null,
                                                                2,
                                                            )
                                                        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

                                                        const exportName = `${template.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.json`

                                                        const linkElement =
                                                            document.createElement(
                                                                'a',
                                                            )
                                                        linkElement.setAttribute(
                                                            'href',
                                                            dataUri,
                                                        )
                                                        linkElement.setAttribute(
                                                            'download',
                                                            exportName,
                                                        )
                                                        linkElement.click()

                                                        showSuccess(
                                                            'Plantilla exportada correctamente',
                                                        )
                                                    } catch (err) {
                                                        console.error(
                                                            'Error al exportar:',
                                                            err,
                                                        )
                                                        showError(
                                                            'Error al exportar la plantilla',
                                                        )
                                                    }
                                                }}
                                                title="Exportar"
                                            />
                                            <Button
                                                shape="circle"
                                                size="sm"
                                                variant="plain"
                                                icon={<PiTrashBold />}
                                                onClick={() => {
                                                    setTemplateToDelete(
                                                        template.id,
                                                    )
                                                    setDeleteConfirmOpen(true)
                                                }}
                                                title="Eliminar"
                                            />
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </TBody>
                    </Table>
                </div>
            )}

            {/* Dialog de confirmación de eliminación */}
            {deleteConfirmOpen && (
                <div 
                    className="fixed inset-0 z-[9999] overflow-y-auto"
                    style={{ zIndex: 9999 }}
                >
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div 
                            className="fixed inset-0 transition-opacity z-[9998]"
                            style={{ zIndex: 9998 }}
                            onClick={() => setDeleteConfirmOpen(false)}
                        >
                            <div className="absolute inset-0 bg-gray-500 dark:bg-gray-800 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
                        &#8203;
                        <div 
                            className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200 dark:border-gray-700 z-[10000] relative"
                            style={{ zIndex: 10000 }}
                        >
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                                        <PiTrashBold className="h-6 w-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                                            Eliminar plantilla
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                ¿Estás seguro de que deseas
                                                eliminar esta plantilla? Esta
                                                acción no se puede deshacer.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    type="button"
                                    style={{ zIndex: 10001, position: 'relative' }}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm relative z-[10001]"
                                    onClick={handleDeleteTemplate}
                                >
                                    Eliminar
                                </Button>
                                <Button
                                    type="button"
                                    style={{ zIndex: 10001, position: 'relative' }}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm relative z-[10001]"
                                    onClick={() => setDeleteConfirmOpen(false)}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Input file oculto para importar plantillas */}
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange}
            />

            {/* Modal de importación */}
            {importModalOpen && (
                <div 
                    className="fixed inset-0 z-[9999] overflow-y-auto"
                    style={{ zIndex: 9999 }}
                >
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div 
                            className="fixed inset-0 transition-opacity z-[9998]"
                            style={{ zIndex: 9998 }}
                            onClick={() => {
                                setImportModalOpen(false)
                                setJsonContent('')
                            }}
                        >
                            <div className="absolute inset-0 bg-gray-500 dark:bg-gray-800 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
                        &#8203;
                        <div 
                            className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200 dark:border-gray-700 z-[10000] relative"
                            style={{ zIndex: 10000 }}
                        >
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 sm:mx-0 sm:h-10 sm:w-10">
                                        <PiUploadSimpleBold className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                                            Importar Plantilla
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                Pega el contenido JSON de la plantilla o selecciona un archivo
                                            </p>
                                            <div className="flex flex-col space-y-4">
                                                <textarea
                                                    className="w-full h-40 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                    placeholder="Pega el JSON aquí..."
                                                    value={jsonContent}
                                                    onChange={(e) => setJsonContent(e.target.value)}
                                                />
                                                <div className="text-center">
                                                    <span className="text-gray-500 dark:text-gray-400">- o -</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-700"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    Seleccionar archivo JSON
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    type="button"
                                    color="primary"
                                    style={{ zIndex: 10001, position: 'relative' }}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm relative z-[10001]"
                                    onClick={handleJsonImport}
                                >
                                    Importar
                                </Button>
                                <Button
                                    type="button"
                                    variant="default"
                                    style={{ zIndex: 10001, position: 'relative' }}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm relative z-[10001]"
                                    onClick={() => {
                                        setImportModalOpen(false)
                                        setJsonContent('')
                                    }}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SharedChatbotTemplatesList
