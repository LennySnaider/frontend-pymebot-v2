/**
 * frontend/src/app/(protected-pages)/superadmin/admin-tools/json-schema-forms/_components/JsonSchemaLibrary.tsx
 * Componente para gestionar la biblioteca de esquemas JSON disponibles en el sistema.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { Notification } from '@/components/ui/Notification'
import { toast } from '@/components/ui/toast'
import { JSONSchemaEditor } from '@/components/shared'
import { Plus, Edit, Trash2, Copy, FileJson, Download, Upload, CheckCircle, Filter, Search } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useImmer } from 'use-immer'

// Esquema de validación para el formulario de esquemas
const schemaFormSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    description: z.string().optional(),
    category: z.string().min(1, 'La categoría es requerida'),
    isPublic: z.boolean().default(false),
})

type SchemaFormValues = z.infer<typeof schemaFormSchema>

// Categorías predefinidas para los esquemas
const schemaCategories = [
    { value: 'user', label: 'Usuarios' },
    { value: 'customer', label: 'Clientes' },
    { value: 'product', label: 'Productos' },
    { value: 'service', label: 'Servicios' },
    { value: 'order', label: 'Órdenes' },
    { value: 'form', label: 'Formularios' },
    { value: 'survey', label: 'Encuestas' },
    { value: 'system', label: 'Sistema' },
    { value: 'custom', label: 'Personalizado' },
]

// Interfaz para los esquemas JSON almacenados
interface JsonSchemaEntry {
    id: string
    name: string
    description?: string
    category: string
    schema: Record<string, any>
    isPublic: boolean
    createdAt: string
    updatedAt: string
    usage?: number // Número de veces que se ha utilizado el esquema
}

const JsonSchemaLibrary = () => {
    // Estado para los esquemas
    const [schemas, updateSchemas] = useImmer<JsonSchemaEntry[]>([
        {
            id: '1',
            name: 'Formulario de Contacto',
            description: 'Esquema para formularios de contacto general',
            category: 'form',
            isPublic: true,
            createdAt: '2025-04-25T10:00:00',
            updatedAt: '2025-04-25T10:00:00',
            usage: 42,
            schema: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Nombre completo'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Correo electrónico'
                    },
                    subject: {
                        type: 'string',
                        description: 'Asunto del mensaje'
                    },
                    message: {
                        type: 'string',
                        description: 'Mensaje o consulta'
                    }
                },
                required: ['name', 'email', 'message']
            }
        },
        {
            id: '2',
            name: 'Encuesta de Satisfacción',
            description: 'Esquema para encuestas de satisfacción de clientes',
            category: 'survey',
            isPublic: true,
            createdAt: '2025-04-26T14:30:00',
            updatedAt: '2025-04-26T14:30:00',
            usage: 18,
            schema: {
                type: 'object',
                properties: {
                    rating: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 5,
                        description: 'Calificación general (1-5)'
                    },
                    productQuality: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 5,
                        description: 'Calidad del producto/servicio'
                    },
                    customerService: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 5,
                        description: 'Atención al cliente'
                    },
                    wouldRecommend: {
                        type: 'boolean',
                        description: '¿Recomendaría nuestros servicios?'
                    },
                    comments: {
                        type: 'string',
                        description: 'Comentarios adicionales'
                    }
                },
                required: ['rating']
            }
        },
        {
            id: '3',
            name: 'Perfil de Usuario',
            description: 'Esquema para datos de perfil de usuario',
            category: 'user',
            isPublic: false,
            createdAt: '2025-04-27T09:15:00',
            updatedAt: '2025-04-28T11:20:00',
            usage: 57,
            schema: {
                type: 'object',
                properties: {
                    firstName: {
                        type: 'string',
                        description: 'Nombre'
                    },
                    lastName: {
                        type: 'string',
                        description: 'Apellido'
                    },
                    dateOfBirth: {
                        type: 'string',
                        format: 'date',
                        description: 'Fecha de nacimiento'
                    },
                    address: {
                        type: 'object',
                        properties: {
                            street: {
                                type: 'string',
                                description: 'Calle'
                            },
                            city: {
                                type: 'string',
                                description: 'Ciudad'
                            },
                            state: {
                                type: 'string',
                                description: 'Estado/Provincia'
                            },
                            zipCode: {
                                type: 'string',
                                description: 'Código postal'
                            },
                            country: {
                                type: 'string',
                                description: 'País'
                            }
                        },
                        required: ['street', 'city', 'country']
                    },
                    phoneNumber: {
                        type: 'string',
                        description: 'Número telefónico'
                    }
                },
                required: ['firstName', 'lastName']
            }
        }
    ])
    
    const router = useRouter()

    // Estados para el filtrado y búsqueda
    const [filterCategory, setFilterCategory] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [currentSchema, setCurrentSchema] = useState<JsonSchemaEntry | null>(null)
    const [schemaInEditor, setSchemaInEditor] = useState<Record<string, any>>({})
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
    const [importText, setImportText] = useState('')

    // Configuración del formulario
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SchemaFormValues>({
        resolver: zodResolver(schemaFormSchema),
        defaultValues: {
            name: '',
            description: '',
            category: '',
            isPublic: false,
        },
    })

    // Filtrar y buscar esquemas
    const filteredSchemas = schemas.filter((schema) => {
        const matchesCategory = filterCategory === '' || schema.category === filterCategory
        const matchesSearch =
            searchTerm === '' ||
            schema.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (schema.description &&
                schema.description.toLowerCase().includes(searchTerm.toLowerCase()))
        return matchesCategory && matchesSearch
    })

    // Maneja la creación de un nuevo esquema
    const handleNewSchema = () => {
        router.push('/superadmin/admin-tools/json-schema-forms/editor')
    }

    // Maneja la edición de un esquema existente
    const handleEditSchema = (schema: JsonSchemaEntry) => {
        router.push(`/superadmin/admin-tools/json-schema-forms/editor?id=${schema.id}`)
    }

    // Maneja la eliminación de un esquema
    const handleDeleteSchema = (schema: JsonSchemaEntry) => {
        setCurrentSchema(schema)
        setIsDeleteDialogOpen(true)
    }

    // Maneja el cambio en el editor de esquemas
    const handleSchemaChange = (schema: Record<string, any>) => {
        setSchemaInEditor(schema)
    }

    // Guarda el esquema (creación o edición)
    const onSubmitSchemaForm = (data: SchemaFormValues) => {
        const now = new Date().toISOString()

        if (currentSchema) {
            // Actualizar un esquema existente
            updateSchemas((draft) => {
                const index = draft.findIndex((s) => s.id === currentSchema.id)
                if (index !== -1) {
                    draft[index] = {
                        ...draft[index],
                        name: data.name,
                        description: data.description,
                        category: data.category,
                        isPublic: data.isPublic,
                        updatedAt: now,
                        schema: schemaInEditor,
                    }
                }
            })

            toast.push(
                <Notification title="Esquema actualizado" type="success">
                    El esquema se ha actualizado correctamente
                </Notification>
            )
        } else {
            // Crear un nuevo esquema
            const newId = Math.random().toString(36).substr(2, 9)
            updateSchemas((draft) => {
                draft.push({
                    id: newId,
                    name: data.name,
                    description: data.description,
                    category: data.category,
                    isPublic: data.isPublic,
                    createdAt: now,
                    updatedAt: now,
                    usage: 0,
                    schema: schemaInEditor,
                })
            })

            toast.push(
                <Notification title="Esquema creado" type="success">
                    El nuevo esquema se ha creado correctamente
                </Notification>
            )
        }

        setIsFormDialogOpen(false)
    }

    // Confirma la eliminación de un esquema
    const confirmDeleteSchema = () => {
        if (!currentSchema) return

        updateSchemas((draft) => {
            const index = draft.findIndex((s) => s.id === currentSchema.id)
            if (index !== -1) {
                draft.splice(index, 1)
            }
        })

        toast.push(
            <Notification title="Esquema eliminado" type="success">
                El esquema se ha eliminado correctamente
            </Notification>
        )

        setIsDeleteDialogOpen(false)
        setCurrentSchema(null)
    }

    // Duplica un esquema existente
    const handleDuplicateSchema = (schema: JsonSchemaEntry) => {
        const now = new Date().toISOString()
        const newId = Math.random().toString(36).substr(2, 9)

        updateSchemas((draft) => {
            draft.push({
                ...schema,
                id: newId,
                name: `${schema.name} (Copia)`,
                createdAt: now,
                updatedAt: now,
                usage: 0,
            })
        })

        toast.push(
            <Notification title="Esquema duplicado" type="success">
                El esquema se ha duplicado correctamente
            </Notification>
        )
    }

    // Exporta un esquema a JSON
    const handleExportSchema = (schema: JsonSchemaEntry) => {
        setCurrentSchema(schema)
        setIsExportDialogOpen(true)
    }

    // Descarga el esquema como archivo JSON
    const downloadSchema = () => {
        if (!currentSchema) return

        const dataStr = JSON.stringify(currentSchema, null, 2)
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
        const exportFileDefaultName = `schema-${currentSchema.name.toLowerCase().replace(/\s+/g, '-')}.json`

        const linkElement = document.createElement('a')
        linkElement.setAttribute('href', dataUri)
        linkElement.setAttribute('download', exportFileDefaultName)
        linkElement.click()

        setIsExportDialogOpen(false)
    }

    // Importa un esquema desde JSON
    const handleImportSchema = () => {
        setImportText('')
        setIsImportDialogOpen(true)
    }

    // Procesa la importación de un esquema
    const processImport = () => {
        try {
            const imported = JSON.parse(importText)
            const now = new Date().toISOString()
            const newId = Math.random().toString(36).substr(2, 9)

            // Verificar que el esquema tiene una estructura válida
            if (!imported.name || !imported.category || !imported.schema) {
                throw new Error('El esquema importado no tiene una estructura válida')
            }

            updateSchemas((draft) => {
                draft.push({
                    id: newId,
                    name: imported.name,
                    description: imported.description || '',
                    category: imported.category,
                    isPublic: imported.isPublic || false,
                    createdAt: now,
                    updatedAt: now,
                    usage: 0,
                    schema: imported.schema,
                })
            })

            toast.push(
                <Notification title="Esquema importado" type="success">
                    El esquema se ha importado correctamente
                </Notification>
            )

            setIsImportDialogOpen(false)
        } catch (error) {
            toast.push(
                <Notification title="Error de importación" type="danger">
                    {error instanceof Error ? error.message : 'Error al importar el esquema'}
                </Notification>
            )
        }
    }

    // Renderiza la lista de esquemas
    const renderSchemaList = () => {
        return filteredSchemas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSchemas.map((schema) => (
                    <Card key={schema.id}>
                        <div className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h5 className="font-medium text-lg">{schema.name}</h5>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                            {schemaCategories.find((c) => c.value === schema.category)?.label || schema.category}
                                        </span>
                                        {schema.isPublic && (
                                            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 flex items-center gap-1">
                                                <CheckCircle size={12} />
                                                Público
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-gray-500 dark:text-gray-400">
                                    <FileJson size={18} />
                                </div>
                            </div>

                            {schema.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-2 line-clamp-2">
                                    {schema.description}
                                </p>
                            )}

                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-3">
                                <div>Actualizado: {new Date(schema.updatedAt).toLocaleDateString()}</div>
                                <div>Usos: {schema.usage || 0}</div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant="twoTone"
                                    color="blue-600"
                                    icon={<Edit size={16} />}
                                    onClick={() => handleEditSchema(schema)}
                                >
                                    Editar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="plain"
                                    icon={<Copy size={16} />}
                                    onClick={() => handleDuplicateSchema(schema)}
                                >
                                    Duplicar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="plain"
                                    icon={<Download size={16} />}
                                    onClick={() => handleExportSchema(schema)}
                                >
                                    Exportar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="plain"
                                    color="red-600"
                                    icon={<Trash2 size={16} />}
                                    onClick={() => handleDeleteSchema(schema)}
                                >
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="text-center p-8 border border-dashed rounded-md">
                <FileJson size={36} className="mx-auto mb-3 text-gray-400" />
                <h5 className="font-medium text-lg mb-1">No hay esquemas disponibles</h5>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchTerm || filterCategory
                        ? 'No se encontraron esquemas que coincidan con los filtros actuales'
                        : 'Comience creando su primer esquema JSON'}
                </p>
                <Button variant="solid" icon={<Plus />} onClick={handleNewSchema}>
                    Crear Esquema
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium">Biblioteca de Esquemas JSON</h4>
                <div className="flex gap-2">
                    <Button
                        variant="twoTone"
                        color="green-600"
                        icon={<Upload />}
                        onClick={handleImportSchema}
                    >
                        Importar
                    </Button>
                    <Button
                        variant="solid"
                        color="blue-600"
                        icon={<Plus />}
                        onClick={handleNewSchema}
                    >
                        Nuevo Esquema
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="w-full md:w-2/3">
                    <Input
                        placeholder="Buscar esquemas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        prefix={<Search className="text-lg" />}
                    />
                </div>
                <div className="w-full md:w-1/3">
                    <Select
                        placeholder="Filtrar por categoría"
                        options={[
                            { value: '', label: 'Todas las categorías' },
                            ...schemaCategories,
                        ]}
                        value={filterCategory}
                        onChange={(value) => setFilterCategory(value)}
                        prefix={<Filter size={16} />}
                    />
                </div>
            </div>

            {renderSchemaList()}

            {/* Diálogo de confirmación para eliminar */}
            <Dialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onRequestClose={() => setIsDeleteDialogOpen(false)}
                width={600}
            >
                <h5 className="mb-4 text-lg font-medium">Confirmar Eliminación</h5>
                <p className="mb-6">
                    ¿Está seguro de que desea eliminar el esquema{' '}
                    <span className="font-medium">{currentSchema?.name}</span>? Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="plain"
                        onClick={() => setIsDeleteDialogOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="solid"
                        color="red-600"
                        onClick={confirmDeleteSchema}
                    >
                        Eliminar
                    </Button>
                </div>
            </Dialog>

            {/* Diálogo para exportar */}
            <Dialog
                isOpen={isExportDialogOpen}
                onClose={() => setIsExportDialogOpen(false)}
                onRequestClose={() => setIsExportDialogOpen(false)}
                width={600}
            >
                <h5 className="mb-4 text-lg font-medium">Exportar Esquema</h5>
                <p className="mb-4">
                    Está a punto de exportar el esquema{' '}
                    <span className="font-medium">{currentSchema?.name}</span>. Se descargará como archivo JSON.
                </p>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="plain"
                        onClick={() => setIsExportDialogOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="solid"
                        color="blue-600"
                        icon={<Download />}
                        onClick={downloadSchema}
                    >
                        Descargar JSON
                    </Button>
                </div>
            </Dialog>

            {/* Diálogo para importar */}
            <Dialog
                isOpen={isImportDialogOpen}
                onClose={() => setIsImportDialogOpen(false)}
                onRequestClose={() => setIsImportDialogOpen(false)}
                width={800}
                style={{ maxHeight: '90vh' }}
            >
                <h5 className="mb-4 text-lg font-medium">Importar Esquema</h5>
                <p className="mb-4">
                    Pegue el JSON del esquema a importar en el siguiente campo:
                </p>
                <div className="overflow-y-auto pr-1" style={{ maxHeight: 'calc(85vh - 200px)' }}>
                    <Input
                        textArea
                        rows={10}
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder={`{\n  "name": "Nombre del Esquema",\n  "description": "Descripción",\n  "category": "form",\n  "isPublic": false,\n  "schema": {\n    "type": "object",\n    "properties": {}\n  }\n}`}
                    />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button
                        variant="plain"
                        onClick={() => setIsImportDialogOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="solid"
                        color="blue-600"
                        icon={<Upload />}
                        onClick={processImport}
                        disabled={!importText.trim()}
                    >
                        Importar
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default JsonSchemaLibrary
