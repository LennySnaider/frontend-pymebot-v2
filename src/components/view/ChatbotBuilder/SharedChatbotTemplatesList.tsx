/**
 * frontend/src/components/view/ChatbotBuilder/SharedChatbotTemplatesList.tsx
 * Componente compartido para listar y gestionar plantillas de chatbot, con modo superadmin/regular
 * @version 1.1.0
 * @updated 2025-04-09
 */

'use client'

import React, { useState, useEffect } from 'react' // Removed useRef
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Button from '@/components/ui/Button' // Import Button
import Input from '@/components/ui/Input' // Import Input
import Table from '@/components/ui/Table'
import { toast } from '@/components/ui/toast'
import {
    PiPlusCircleBold,
    PiPencilSimpleLineBold,
    PiTrashBold,
    PiCopyBold,
    // PiArrowDownBold, // Removed
    PiUploadSimpleBold,
    PiRobotBold,
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
    toast.push(message)
}

// Función auxiliar para mostrar mensajes de éxito
const showSuccess = (message: string) => {
    toast.push(message)
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

    // Referencias
    // const fileInputRef = useRef<HTMLInputElement>(null) // Moved
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

    // // Manejar importación de plantilla - Moved
    // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { ... }

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
            <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando plantillas...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
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
        <div className="bg-white rounded-lg shadow">
            {/* Barra de filtros y búsqueda */}
            <div className="p-4 border-b border-gray-200">
                <div className="mt-1">
                    <Input
                        type="text"
                        className="w-full" // Simplified className, ECME Input handles styling
                        placeholder="Buscar por nombre o descripción..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Lista de plantillas */}
            {filteredTemplates.length === 0 ? (
                <div className="p-8 text-center">
                    <PiRobotBold className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                        No se encontraron plantillas con los filtros
                        seleccionados.
                    </p>
                    <Button
                        variant="solid" // Use ECME Button variant
                        color="primary"
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
                        <PiPlusCircleBold className="h-4 w-4 inline mr-1" />
                        Crear plantilla
                    </Button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table className="min-w-full divide-y divide-gray-200">
                        <THead className="bg-gray-50">
                            <Tr>
                                <Th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Nombre
                                </Th>
                                <Th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {isAdmin ? 'Industria' : 'Estado'}
                                </Th>
                                <Th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Publicado
                                </Th>
                                <Th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Última actualización
                                </Th>
                                <Th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Acciones
                                </Th>
                            </Tr>
                        </THead>
                        <TBody className="bg-white divide-y divide-gray-200">
                            {filteredTemplates.map((template) => (
                                <Tr
                                    key={template.id}
                                    className="hover:bg-gray-50"
                                >
                                    <Td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {template.name}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                    {template.description}
                                                </div>
                                            </div>
                                        </div>
                                    </Td>
                                    <Td className="px-6 py-4 whitespace-nowrap">
                                        {isAdmin ? (
                                            <div className="text-sm text-gray-500">
                                                {template.vertical_name ||
                                                    'Sin categoría'}
                                            </div>
                                        ) : (
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    template.status ===
                                                    'published'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}
                                            >
                                                {template.status === 'published'
                                                    ? 'Publicada'
                                                    : 'Borrador'}
                                            </span>
                                        )}
                                    </Td>
                                    <Td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    template.status === 'published'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {template.status === 'published'
                                                    ? 'Sí'
                                                    : 'No'}
                                            </span>
                                            {isAdmin && template.status === 'draft' && (
                                                <button
                                                    className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
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
                                    <Td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDistance(
                                            new Date(template.updated_at),
                                            new Date(),
                                            { addSuffix: true, locale: es },
                                        )}
                                    </Td>
                                    <Td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                                            {!isAdmin && (
                                                <Button
                                                    shape="circle"
                                                    size="sm"
                                                    variant="plain"
                                                    icon={
                                                        <PiUploadSimpleBold />
                                                    }
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
                                            )}
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
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
                        &#8203;
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <PiTrashBold className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Eliminar plantilla
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                ¿Estás seguro de que deseas
                                                eliminar esta plantilla? Esta
                                                acción no se puede deshacer.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <Button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={handleDeleteTemplate}
                                >
                                    Eliminar
                                </Button>
                                <Button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setDeleteConfirmOpen(false)}
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
