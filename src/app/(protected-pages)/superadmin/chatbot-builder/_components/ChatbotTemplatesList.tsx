// Función para cargar las verticales
        const loadVerticals = async () => {
            try {
                const { data, error } = await supabase
                    .from('verticals')
                    .select('id, name, code, brand_name')
                    .eq('is_active', true)
                    .order('name', { ascending: true })

                if (error) {
                    throw error
                }

                setVerticals(data || [])
            } catch (err) {
                console.error('Error al cargar verticales:', err)
                notifications.error('Error al cargar verticales')
            }
        }/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/_components/ChatbotTemplatesList.tsx
 * Componente para mostrar la lista de plantillas de chatbot disponibles
 * @version 1.2.0
 * @updated 2025-04-14
 */

'use client'

import React, {
    useState,
    useEffect,
    useRef,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/services/supabase/SupabaseClient'
import { Button } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Dialog } from '@/components/ui'
import { Spinner } from '@/components/ui'
import { Table } from '@/components/ui'
import { Card } from '@/components/ui'
import { Avatar } from '@/components/ui'
import { Input } from '@/components/ui'
import { Select } from '@/components/ui'
import { Pagination } from '@/components/ui'
import { notifications } from '@/utils/notifications'
import {
    PiPencilSimpleDuotone,
    PiTrashDuotone,
    PiRobotDuotone,
    PiPlusBold,
    PiCopyDuotone,
    PiFoldersBold,
    PiMagnifyingGlassBold,
    PiDownloadSimpleBold,
    PiUploadSimpleBold,
} from 'react-icons/pi'
import { formatDistance } from 'date-fns'
import { es } from 'date-fns/locale'
import { columnExists } from '@/utils/dbSchemaUtils'

// Definir interfaces
// Interfaz para la referencia expuesta
interface ChatbotTemplatesListHandle {
    triggerImportDialog: () => void
}

// Tipo para las plantillas de chatbot
interface ChatbotTemplate {
    id: string
    name: string
    description: string
    status: 'draft' | 'published'
    created_at: string
    updated_at: string
    is_deleted?: boolean
    vertical_id?: string
    vertical?: {
        id: string
        name: string
        code: string
        brand_name: string
    }
}

// Opciones de filtrado
interface FilterOptions {
    searchTerm: string
    status: string
    verticalId: string
}

// Props del componente
interface ChatbotTemplatesListProps {
    onCreateTemplate: () => void
    ref?: React.Ref<unknown>
}

const ChatbotTemplatesList = forwardRef(
    (
        { onCreateTemplate }: ChatbotTemplatesListProps,
        ref: React.Ref<ChatbotTemplatesListHandle>,
    ) => {
        // Estados
        const [templates, setTemplates] = useState<ChatbotTemplate[]>([])
        const [filteredTemplates, setFilteredTemplates] = useState<ChatbotTemplate[]>([])
        const [loading, setLoading] = useState(true)
        const [error, setError] = useState<string | null>(null)
        const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
        const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)
        const [templatesCount, setTemplatesCount] = useState(0)
        const [hasIsDeletedColumn, setHasIsDeletedColumn] = useState<boolean | null>(null)
        
        // Estados de paginación y filtrado
        const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        searchTerm: '',
        status: 'all',
        verticalId: 'all'
    })
    const [verticals, setVerticals] = useState<{id: string, name: string, code: string}[]>([])

        // Estado para el manejador de archivos
        const fileInputRef = useRef<HTMLInputElement>(null)

        useImperativeHandle(ref, () => ({
            triggerImportDialog: () => {
                if (fileInputRef.current) {
                    fileInputRef.current.click()
                }
            },
        }))

        // Instancia del router
        const router = useRouter()

        // Efecto para cargar las plantillas al montar el componente
        useEffect(() => {
            const init = async () => {
                try {
                    // Verificar si la columna is_deleted existe
                    try {
                        const exists = await columnExists(
                            'chatbot_templates',
                            'is_deleted',
                        )
                        setHasIsDeletedColumn(exists)
                        console.log('La columna is_deleted existe:', exists)
                    } catch (error) {
                        // Si hay error en la verificación de columna, asumimos que no existe
                        console.error(
                            'Error verificando columna is_deleted:',
                            error,
                        )
                        setHasIsDeletedColumn(false)
                    }

                    // Cargar verticales
                    await loadVerticals()
                } catch (error) {
                    console.error('Error en la inicialización:', error)
                } finally {
                    // Cargar plantillas en cualquier caso
                    loadTemplates()
                }
            }

            init()
        }, [])

        // Función para cargar las plantillas desde Supabase
        const loadTemplates = async () => {
            setLoading(true)
            setError(null)

            try {
                // Consultar todas las plantillas con datos de vertical
                const { data, error } = await supabase
                    .from('chatbot_templates')
                    .select(`
                        *, 
                        vertical:vertical_id (id, name, code, brand_name)
                    `)

                if (error) {
                    throw error
                }

                // Filtrar manualmente las plantillas eliminadas y ordenarlas
                let filteredData = data || []

                // Filtrar plantillas por is_deleted si corresponde
                filteredData = filteredData.filter(
                    (template) => template.is_deleted !== true,
                )

                // Ordenar por fecha de actualización (más reciente primero)
                filteredData.sort((a, b) => {
                    const dateA = new Date(a.updated_at || 0).getTime()
                    const dateB = new Date(b.updated_at || 0).getTime()
                    return dateB - dateA // Orden descendente
                })

                console.log(`Cargadas ${filteredData.length} plantillas`)

                // Asignar los resultados al estado
                setTemplates(filteredData)
                setFilteredTemplates(filteredData)
                setTemplatesCount(filteredData.length)
                setTotalPages(Math.ceil(filteredData.length / pageSize))
            } catch (err) {
                console.error('Error al cargar plantillas:', err)
                setError(
                    'No se pudieron cargar las plantillas. Intente nuevamente.',
                )
                notifications.error(
                    'Error al cargar plantillas: ' +
                        (err instanceof Error ? err.message : String(err)),
                )
            } finally {
                setLoading(false)
            }
        }

        // Función para abrir el editor con una plantilla existente
        const handleEditTemplate = (id: string) => {
            // Verificar que la plantilla existe
            const template = templates.find((t) => t.id === id)
            if (template) {
                // Redirigir directamente al editor con el ID de la plantilla
                router.push(
                    `/modules/superadmin/chatbot-builder/editor?id=${id}`,
                )
            } else {
                notifications.error('No se encontró la plantilla')
            }
        }

        // Función para confirmar eliminación
        const handleConfirmDelete = (id: string) => {
            setTemplateToDelete(id)
            setDeleteConfirmOpen(true)
        }

        // Función para ejecutar la eliminación
        const handleDeleteTemplate = async () => {
            if (!templateToDelete) return

            try {
                console.log('Eliminando plantilla con ID:', templateToDelete)

                // Primero, obtener toda la lista de plantillas
                const { data: allTemplates, error: fetchError } = await supabase
                    .from('chatbot_templates')
                    .select('*')

                if (fetchError) {
                    throw fetchError
                }

                // Encontrar la plantilla específica
                const templateToUpdate = allTemplates?.find(
                    (t) => t.id === templateToDelete,
                )

                if (!templateToUpdate) {
                    throw new Error('Plantilla no encontrada')
                }

                // Intentamos un enfoque adaptativo:
                // 1. Si sabemos que existe is_deleted, usamos soft delete
                // 2. Si no estamos seguros, intentamos ambos métodos

                // Intento 1: Soft delete con upsert
                try {
                    const updatedTemplate = {
                        ...templateToUpdate,
                        is_deleted: true,
                    }
                    const { error } = await supabase
                        .from('chatbot_templates')
                        .upsert(updatedTemplate)

                    if (!error) {
                        console.log('Plantilla marcada como eliminada')
                        // Si tuvo éxito, no necesitamos hacer más
                        setTemplates(
                            templates.filter(
                                (template) => template.id !== templateToDelete,
                            ),
                        )
                        setTemplatesCount((prev) => prev - 1)
                        notifications.success(
                            'Plantilla eliminada correctamente',
                        )
                        return
                    }
                } catch (softDeleteError) {
                    console.log(
                        'Error en soft delete, intentando hard delete:',
                        softDeleteError,
                    )
                }

                // Intento 2: Hard delete
                try {
                    const { error } = await supabase
                        .from('chatbot_templates')
                        .delete()
                        .eq('id', templateToDelete)

                    if (!error) {
                        console.log('Plantilla eliminada físicamente')
                        setTemplates(
                            templates.filter(
                                (template) => template.id !== templateToDelete,
                            ),
                        )
                        setTemplatesCount((prev) => prev - 1)
                        notifications.success(
                            'Plantilla eliminada correctamente',
                        )
                        return
                    }
                } catch (hardDeleteError) {
                    console.log('Error en hard delete:', hardDeleteError)
                }

                // Si llegamos aquí, ambos métodos fallaron, intentemos el enfoque más extremo
                console.log('Intentando enfoque alternativo de eliminación...')

                // Crear una nueva matriz excluyendo la plantilla a eliminar
                const updatedTemplates = allTemplates.filter(
                    (t) => t.id !== templateToDelete,
                )

                // Enfoque extremo: eliminar todas y reinsertar las que queremos mantener
                const { error: deleteAllError } = await supabase
                    .from('chatbot_templates')
                    .delete()
                    .neq('id', 'no-id-matches-this') // Elimina todo

                if (deleteAllError) {
                    throw deleteAllError
                }

                // Reinsertar todas menos la que queremos eliminar
                if (updatedTemplates.length > 0) {
                    const { error: reinsertError } = await supabase
                        .from('chatbot_templates')
                        .insert(updatedTemplates)

                    if (reinsertError) {
                        throw reinsertError
                    }
                }

                // Si llegamos aquí, el enfoque extremo tuvo éxito
                setTemplates(
                    templates.filter(
                        (template) => template.id !== templateToDelete,
                    ),
                )
                setTemplatesCount((prev) => prev - 1)
                notifications.success('Plantilla eliminada correctamente')
            } catch (err) {
                console.error('Error al eliminar plantilla:', err)
                notifications.error(
                    'Error al eliminar la plantilla: ' +
                        (err instanceof Error ? err.message : String(err)),
                )
            } finally {
                // Cerrar el diálogo de confirmación
                setDeleteConfirmOpen(false)
                setTemplateToDelete(null)
            }
        }

        // Función para duplicar una plantilla
        const handleDuplicateTemplate = async (id: string) => {
            try {
                // Obtener la plantilla original
                const { data, error } = await supabase
                    .from('chatbot_templates')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error || !data) {
                    throw error || new Error('No se encontró la plantilla')
                }

                // Crear una copia con un nuevo ID
                const newTemplate = {
                    ...data,
                    id: undefined, // Supabase generará un nuevo ID
                    name: `${data.name} (copia)`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }

                // Insertar la nueva plantilla
                const { error: insertError } = await supabase
                    .from('chatbot_templates')
                    .insert(newTemplate)

                if (insertError) {
                    throw insertError
                }

                // Recargar la lista
                loadTemplates()
                notifications.success('Plantilla duplicada correctamente')
            } catch (err) {
                console.error('Error al duplicar plantilla:', err)
                notifications.error('Error al duplicar la plantilla')
            }
        }

        // Función para importar una plantilla desde un archivo
        const handleImportTemplate = async (
            event: React.ChangeEvent<HTMLInputElement>,
        ) => {
            const file = event.target.files?.[0]
            if (!file) return

            try {
                // Leer el archivo
                const text = await file.text()
                const importedTemplate = JSON.parse(text)

                // Validar estructura básica
                if (
                    !importedTemplate.name ||
                    !importedTemplate.react_flow_json
                ) {
                    throw new Error(
                        'Archivo de plantilla inválido. Faltan campos requeridos.',
                    )
                }

                // Preparar objeto para guardar en Supabase
                const newTemplate = {
                    id: undefined, // Supabase generará un nuevo ID
                    name: importedTemplate.name,
                    description:
                        importedTemplate.description || 'Plantilla importada',
                    status: 'draft',
                    react_flow_json: importedTemplate.react_flow_json,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    is_deleted: false,
                }

                // Guardar en Supabase
                const { data, error } = await supabase
                    .from('chatbot_templates')
                    .insert(newTemplate)

                if (error) {
                    throw error
                }

                // Recargar lista de plantillas
                await loadTemplates()

                notifications.success('Plantilla importada correctamente')
            } catch (err) {
                console.error('Error al importar plantilla:', err)
                notifications.error(
                    `Error al importar la plantilla: ${err instanceof Error ? err.message : 'Formato inválido'}`,
                )
            }

            // Limpiar input de archivo
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }

        // Activar el input de archivo para importar
        const triggerImportDialog = () => {
            if (fileInputRef.current) {
                fileInputRef.current.click()
            }
        }

        // Función para filtrar plantillas
        const filterTemplates = () => {
            let result = [...templates];
            
            // Filtrar por término de búsqueda
            if (filterOptions.searchTerm) {
                const searchTerm = filterOptions.searchTerm.toLowerCase();
                result = result.filter(template => 
                    template.name.toLowerCase().includes(searchTerm) || 
                    template.description.toLowerCase().includes(searchTerm)
                );
            }
            
            // Filtrar por estado
            if (filterOptions.status !== 'all') {
                result = result.filter(template => template.status === filterOptions.status);
            }
            
            // Filtrar por vertical
            if (filterOptions.verticalId !== 'all') {
                result = result.filter(template => template.vertical_id === filterOptions.verticalId);
            }
            
            // Actualizar estados
            setFilteredTemplates(result);
            setTemplatesCount(result.length);
            setTotalPages(Math.ceil(result.length / pageSize));
            setPageIndex(1); // Resetear a la primera página al filtrar
        }
        
        // Efecto para aplicar filtros cuando cambian las opciones
        useEffect(() => {
            filterTemplates();
        }, [filterOptions, templates, pageSize]);
        
        // Función para cambiar de página
        const handlePageChange = (page: number) => {
            setPageIndex(page);
        }
        
        // Obtener plantillas para la página actual
        const getCurrentPageItems = () => {
            const startIndex = (pageIndex - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            return filteredTemplates.slice(startIndex, endIndex);
        }

        // Renderizado condicional basado en el estado
        const renderContent = () => {
            // Si hay un error
            if (error) {
                return (
                    <div className="p-6 text-center">
                        <div className="text-red-500 mb-2">{error}</div>
                        <Button
                            variant="default"
                            color="blue"
                            onClick={loadTemplates}
                        >
                            Reintentar
                        </Button>
                    </div>
                )
            }

            // Si está cargando
            if (loading) {
                return (
                    <div className="p-6 text-center">
                        <Spinner size={40} className="mx-auto mb-4" />
                        <p className="text-gray-500">Cargando plantillas...</p>
                    </div>
                )
            }

            // Si no hay plantillas
            if (templates.length === 0) {
                return (
                    <div className="p-6 text-center text-gray-500">
                        <PiRobotDuotone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>
                            No hay plantillas creadas aún. Comienza creando una
                            nueva plantilla de chatbot.
                        </p>
                        <Button
                            className="mt-4"
                            variant="solid"
                            icon={<PiPlusBold className="text-lg" />}
                            onClick={onCreateTemplate}
                        >
                            Nueva Plantilla
                        </Button>
                    </div>
                )
            }

            // Si hay plantillas, mostrar la tabla
            return (
                <div className="space-y-4">
                    {/* Barra de filtros */}
                    <div className="flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                                    <PiMagnifyingGlassBold />
                                </span>
                                <Input 
                                    className="pl-10" 
                                    placeholder="Buscar plantillas..." 
                                    value={filterOptions.searchTerm}
                                    onChange={(e) => setFilterOptions({...filterOptions, searchTerm: e.target.value})}
                                />
                            </div>
                            <Select 
                                className="w-40"
                                value={filterOptions.status}
                                onChange={(value) => setFilterOptions({...filterOptions, status: value})}
                            >
                                <Select.Option value="all">Todos los estados</Select.Option>
                                <Select.Option value="draft">Borrador</Select.Option>
                                <Select.Option value="published">Publicado</Select.Option>
                            </Select>
                            <Select 
                                className="w-48"
                                value={filterOptions.verticalId}
                                onChange={(value) => setFilterOptions({...filterOptions, verticalId: value})}
                            >
                                <Select.Option value="all">Todas las verticales</Select.Option>
                                {verticals.map(vertical => (
                                    <Select.Option key={vertical.id} value={vertical.id}>
                                        {vertical.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto justify-end mt-4 md:mt-0">
                            <Button
                                size="sm"
                                variant="default"
                                icon={<PiUploadSimpleBold className="text-lg" />}
                                onClick={triggerImportDialog}
                            >
                                Importar
                            </Button>
                            <Button
                                size="sm"
                                variant="solid"
                                icon={<PiPlusBold className="text-lg" />}
                                onClick={onCreateTemplate}
                            >
                                Nueva Plantilla
                            </Button>
                        </div>
                    </div>

                    {/* Tabla */}
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <div className="overflow-x-auto">
                            <Table className="w-full dark:text-gray-200">
                                <Table.Header>
                                    <Table.Row>
                                        <Table.HeaderCell>Nombre</Table.HeaderCell>
                                        <Table.HeaderCell className="w-40">Vertical</Table.HeaderCell>
                                        <Table.HeaderCell className="w-32">Estado</Table.HeaderCell>
                                        <Table.HeaderCell className="w-48">Última actualización</Table.HeaderCell>
                                        <Table.HeaderCell className="w-48 text-right">Acciones</Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {getCurrentPageItems().map((template) => (
                                        <Table.Row key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/70">
                                            <Table.Cell>
                                                <div className="flex items-center">
                                                    <Avatar 
                                                        className="mr-3" 
                                                        size={40} 
                                                        icon={<PiRobotDuotone className="text-primary" />} 
                                                        shape="circle"
                                                    />
                                                    <div>
                                                        <div className="font-medium">{template.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                                            {template.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell>
                                                {template.vertical ? (
                                                    <div>
                                                        <Badge className="bg-blue-500 text-white">
                                                            {template.vertical.name}
                                                        </Badge>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {template.vertical.brand_name}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Badge className="bg-gray-400 text-white">
                                                        Sin vertical
                                                    </Badge>
                                                )}
                                            </Table.Cell>
                                            <Table.Cell>
                                                <div className="flex items-center space-x-2">
                                                    <Badge
                                                        content={
                                                            template.status === 'published' ? 'Publicada' : 'Borrador'
                                                        }
                                                        className={`${template.status === 'published' ? 'bg-green-500' : 'bg-gray-500'} text-white`}
                                                    />
                                                    {template.status === 'draft' && (
                                                        <button
                                                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    const { error } = await supabase
                                                                        .from('chatbot_templates')
                                                                        .update({ 
                                                                            status: 'published',
                                                                            updated_at: new Date().toISOString()
                                                                        })
                                                                        .eq('id', template.id);
                                                                    
                                                                    if (error) {
                                                                        throw error;
                                                                    }
                                                                    
                                                                    // Actualizar localmente
                                                                    const updatedTemplates = templates.map(t => 
                                                                        t.id === template.id ? {...t, status: 'published'} : t
                                                                    );
                                                                    setTemplates(updatedTemplates);
                                                                    setFilteredTemplates(updatedTemplates);
                                                                    
                                                                    notifications.success('Plantilla publicada correctamente');
                                                                } catch (err) {
                                                                    console.error('Error al publicar plantilla:', err);
                                                                    notifications.error('Error al publicar la plantilla');
                                                                }
                                                            }}
                                                        >
                                                            Publicar
                                                        </button>
                                                    )}
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {formatDistance(
                                                        new Date(template.updated_at),
                                                        new Date(),
                                                        {
                                                            addSuffix: true,
                                                            locale: es,
                                                        },
                                                    )}
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        size="xs"
                                                        variant="default"
                                                        icon={<PiPencilSimpleDuotone />}
                                                        onClick={() => handleEditTemplate(template.id)}
                                                    >
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="default"
                                                        icon={<PiCopyDuotone />}
                                                        onClick={() => handleDuplicateTemplate(template.id)}
                                                    >
                                                        Duplicar
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="default"
                                                        color="red"
                                                        icon={<PiTrashDuotone />}
                                                        onClick={() => handleConfirmDelete(template.id)}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </div>
                        {templatesCount > pageSize && (
                            <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Mostrando {Math.min(filteredTemplates.length, pageSize)} de {templatesCount} plantillas
                                </div>
                                <Pagination
                                    pageSize={pageSize}
                                    currentPage={pageIndex}
                                    total={templatesCount}
                                    onChange={handlePageChange}
                                />
                            </div>
                        )}
                    </Card>
                </div>
            )
        }

        return (
            <div className="space-y-4">
                {/* Input de archivo oculto para importar */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportTemplate}
                    accept=".json"
                    className="hidden"
                />
                
                {renderContent()}
                
                {/* Diálogo de confirmación de eliminación */}
                <Dialog
                    isOpen={deleteConfirmOpen}
                    title="Eliminar plantilla"
                    onClose={() => setDeleteConfirmOpen(false)}
                    onRequestClose={() => setDeleteConfirmOpen(false)}
                >
                    <div className="my-4">
                        <p className="text-gray-600 dark:text-gray-300">
                            ¿Estás seguro de que deseas eliminar esta plantilla?
                            Esta acción no se puede deshacer.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="default"
                            onClick={() => setDeleteConfirmOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="solid"
                            color="red"
                            onClick={handleDeleteTemplate}
                        >
                            Eliminar
                        </Button>
                    </div>
                </Dialog>
            </div>
        )
    },
)

// Asignamos displayName explícitamente para resolver el error de eslint react/display-name
ChatbotTemplatesList.displayName = 'ChatbotTemplatesList';

// Exportamos el componente con un tipo
export default ChatbotTemplatesList

// Exportamos la interfaz de la handle por separado para TypeScript
export type { ChatbotTemplatesListHandle }
