/**
 * frontend/src/components/shared/JSONSchemaEditor/JSONSchemaEditor.tsx
 * Versión corregida del editor de esquemas JSON que evita el bucle infinito de actualizaciones.
 * @version 1.1.0
 * @updated 2025-05-01
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import SimpleCheckbox from '@/components/shared/SimpleCheckbox'
import { Form, FormItem } from '@/components/ui/Form'
import { Dialog } from '@/components/ui/Dialog'
import { Tooltip } from '@/components/ui/Tooltip'
import { Tabs } from '@/components/ui/Tabs'
import SyntaxHighlighter from '@/components/shared/SyntaxHighlighter'
import { Plus, Trash2, Edit, Copy, FileJson, List, Eye } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useImmer } from 'use-immer'
import clsx from 'classnames'

// Tipos de datos soportados por JSON Schema
const schemaTypes = [
    { value: 'string', label: 'Texto (string)' },
    { value: 'number', label: 'Número (number)' },
    { value: 'integer', label: 'Entero (integer)' },
    { value: 'boolean', label: 'Booleano (boolean)' },
    { value: 'object', label: 'Objeto (object)' },
    { value: 'array', label: 'Array (array)' },
    { value: 'null', label: 'Nulo (null)' },
]

// Formatos específicos para el tipo string
const stringFormats = [
    { value: '', label: 'Ninguno' },
    { value: 'date', label: 'Fecha (YYYY-MM-DD)' },
    { value: 'time', label: 'Hora (HH:MM:SS)' },
    { value: 'date-time', label: 'Fecha y hora (ISO 8601)' },
    { value: 'email', label: 'Email' },
    { value: 'uri', label: 'URI' },
    { value: 'hostname', label: 'Hostname' },
    { value: 'ipv4', label: 'IPv4' },
    { value: 'ipv6', label: 'IPv6' },
]

// Esquema de validación para un campo básico
const fieldSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    type: z.string().min(1, 'El tipo es requerido'),
    description: z.string().optional(),
    required: z.boolean().optional(),
    format: z.string().optional(),
    minimum: z.union([z.number(), z.string(), z.undefined()]).optional(),
    maximum: z.union([z.number(), z.string(), z.undefined()]).optional(),
    minLength: z.union([z.number(), z.string(), z.undefined()]).optional(),
    maxLength: z.union([z.number(), z.string(), z.undefined()]).optional(),
    pattern: z.string().optional(),
    enum: z.string().optional(), // Valores separados por comas
    default: z.string().optional(),
})

type FieldFormValues = z.infer<typeof fieldSchema>

// Modelo para un campo de esquema JSON
interface SchemaField {
    name: string
    type: string
    description?: string
    required?: boolean
    format?: string
    minimum?: number
    maximum?: number
    minLength?: number
    maxLength?: number
    pattern?: string
    enum?: string[]
    default?: any
    properties?: Record<string, SchemaField>
    items?: SchemaField
}

// Propiedades del componente principal
interface JSONSchemaEditorProps {
    initialSchema?: Record<string, any>
    onChange?: (schema: Record<string, any>) => void
    onSave?: (schema: Record<string, any>) => void
    readOnly?: boolean
    className?: string
}

const JSONSchemaEditor = ({
    initialSchema,
    onChange,
    onSave,
    readOnly = false,
    className,
}: JSONSchemaEditorProps) => {
    // Estado para almacenar el esquema completo
    const [schema, updateSchema] = useImmer<Record<string, SchemaField>>({})

    // Estado para manejar el campo actual que se está editando
    const [editingField, setEditingField] = useState<{
        path: string[]
        field: SchemaField | null
    }>({
        path: [],
        field: null,
    })

    // Estado para controlar los diálogos
    const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('editor')

    // Referencia para controlar la inicialización
    const initializedRef = useRef(false)

    // Configuración del formulario con React Hook Form y Zod
    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<FieldFormValues>({
        resolver: zodResolver(fieldSchema),
        defaultValues: {
            name: '',
            type: 'string',
            description: '',
            required: false,
            format: '',
        },
    })

    // Observa cambios en el tipo seleccionado
    const selectedType = watch('type')

    // Inicializa el esquema si se proporciona uno inicial
    // Solo se ejecuta una vez para evitar bucles de actualización
    useEffect(() => {
        if (initialSchema && !initializedRef.current) {
            // Marcamos como inicializado para evitar bucles
            initializedRef.current = true

            // Conversión del esquema JSON a nuestro formato interno
            const convertedSchema: Record<string, SchemaField> = {}

            // Procesamos las propiedades y requeridos del esquema inicial
            if (initialSchema.properties) {
                const requiredFields = initialSchema.required || []

                Object.entries(initialSchema.properties).forEach(
                    ([name, propSchema]: [string, any]) => {
                        convertedSchema[name] = {
                            name,
                            type: propSchema.type,
                            description: propSchema.description,
                            required: requiredFields.includes(name),
                            format: propSchema.format,
                            minimum: propSchema.minimum,
                            maximum: propSchema.maximum,
                            minLength: propSchema.minLength,
                            maxLength: propSchema.maxLength,
                            pattern: propSchema.pattern,
                            enum: propSchema.enum,
                            default: propSchema.default,
                        }

                        // Procesamos propiedades anidadas para objetos
                        if (
                            propSchema.type === 'object' &&
                            propSchema.properties
                        ) {
                            convertedSchema[name].properties = {}
                            const requiredSubFields = propSchema.required || []

                            Object.entries(propSchema.properties).forEach(
                                ([subName, subSchema]: [string, any]) => {
                                    convertedSchema[name].properties![subName] =
                                        {
                                            name: subName,
                                            type: subSchema.type,
                                            description: subSchema.description,
                                            required:
                                                requiredSubFields.includes(
                                                    subName,
                                                ),
                                            // ... otros campos según sea necesario
                                        }
                                },
                            )
                        }

                        // Procesamos items para arrays
                        if (propSchema.type === 'array' && propSchema.items) {
                            convertedSchema[name].items = {
                                name: 'items',
                                type: propSchema.items.type,
                                description: propSchema.items.description,
                                // ... otros campos según sea necesario
                            }
                        }
                    },
                )
            }

            updateSchema(convertedSchema)
        }
    }, [initialSchema, updateSchema])

    // Genera el esquema JSON a partir de nuestro modelo interno
    const generateJSONSchema = useCallback(() => {
        const jsonSchema: Record<string, any> = {
            type: 'object',
            properties: {},
            required: [],
        }

        // Procesamos cada campo del esquema
        Object.values(schema).forEach((field) => {
            const schemaProperty: Record<string, any> = {
                type: field.type,
            }

            // Agregamos propiedades condicionales según estén definidas
            if (field.description)
                schemaProperty.description = field.description
            if (field.format) schemaProperty.format = field.format
            if (field.minimum !== undefined)
                schemaProperty.minimum = field.minimum
            if (field.maximum !== undefined)
                schemaProperty.maximum = field.maximum
            if (field.minLength !== undefined)
                schemaProperty.minLength = field.minLength
            if (field.maxLength !== undefined)
                schemaProperty.maxLength = field.maxLength
            if (field.pattern) schemaProperty.pattern = field.pattern
            if (field.enum && field.enum.length)
                schemaProperty.enum = field.enum
            if (field.default !== undefined)
                schemaProperty.default = field.default

            // Procesamos propiedades de tipo objeto
            if (field.type === 'object' && field.properties) {
                schemaProperty.type = 'object'
                schemaProperty.properties = {}
                schemaProperty.required = []

                Object.values(field.properties).forEach((subField) => {
                    const subProperty: Record<string, any> = {
                        type: subField.type,
                    }

                    if (subField.description)
                        subProperty.description = subField.description
                    // ... procesar otras propiedades

                    schemaProperty.properties[subField.name] = subProperty

                    if (subField.required) {
                        schemaProperty.required.push(subField.name)
                    }
                })

                // Eliminamos el array required si está vacío
                if (schemaProperty.required.length === 0) {
                    delete schemaProperty.required
                }
            }

            // Procesamos propiedades de tipo array
            if (field.type === 'array' && field.items) {
                schemaProperty.type = 'array'
                schemaProperty.items = {
                    type: field.items.type,
                }

                if (field.items.description)
                    schemaProperty.items.description = field.items.description
                // ... procesar otras propiedades
            }

            jsonSchema.properties[field.name] = schemaProperty

            // Agregamos campos requeridos al array required
            if (field.required) {
                jsonSchema.required.push(field.name)
            }
        })

        // Eliminamos el array required si está vacío
        if (jsonSchema.required.length === 0) {
            delete jsonSchema.required
        }

        return jsonSchema
    }, [schema])

    // Manejador de cambios en el esquema
    // Usamos useCallback para evitar recreaciones innecesarias de esta función
    const handleSchemaChange = useCallback(() => {
        if (onChange && Object.keys(schema).length > 0) {
            const jsonSchema = generateJSONSchema()
            onChange(jsonSchema)
        }
    }, [schema, onChange, generateJSONSchema])

    // Efecto para notificar cambios en el esquema
    // Usamos un ref para evitar llamadas innecesarias
    const lastSchemaRef = useRef<string>('')

    useEffect(() => {
        // Solo llamamos a onChange si el esquema realmente cambió
        const currentSchemaStr = JSON.stringify(schema)
        if (currentSchemaStr !== lastSchemaRef.current) {
            lastSchemaRef.current = currentSchemaStr
            handleSchemaChange()
        }
    }, [schema, handleSchemaChange])

    // Maneja la apertura del diálogo para agregar un nuevo campo
    const handleAddField = (path: string[] = []) => {
        setEditingField({
            path,
            field: null,
        })
        reset({
            name: '',
            type: 'string',
            description: '',
            required: false,
            format: '',
        })
        setIsFieldDialogOpen(true)
    }

    // Maneja la apertura del diálogo para editar un campo existente
    const handleEditField = (path: string[], field: SchemaField) => {
        setEditingField({
            path,
            field,
        })

        // Inicializamos el formulario con los valores del campo
        reset({
            name: field.name,
            type: field.type,
            description: field.description || '',
            required: field.required || false,
            format: field.format || '',
            minimum: field.minimum?.toString() || '',
            maximum: field.maximum?.toString() || '',
            minLength: field.minLength?.toString() || '',
            maxLength: field.maxLength?.toString() || '',
            pattern: field.pattern || '',
            enum: field.enum ? field.enum.join(', ') : '',
            default: field.default?.toString() || '',
        })

        setIsFieldDialogOpen(true)
    }

    // Maneja la eliminación de un campo
    const handleDeleteField = (path: string[], fieldName: string) => {
        updateSchema((draft) => {
            if (path.length === 0) {
                // Campo en el nivel raíz
                delete draft[fieldName]
            } else if (path.length === 1) {
                // Campo dentro de un objeto
                const [parentField] = path
                if (draft[parentField]?.properties) {
                    delete draft[parentField].properties![fieldName]
                }
            }
            // Podríamos agregar más niveles si es necesario
        })
    }

    // Maneja el guardado del formulario al agregar/editar un campo
    const onSubmitField = (data: FieldFormValues) => {
        const { path } = editingField

        // Procesamos valores numéricos
        const processedData = {
            ...data,
            minimum: data.minimum ? Number(data.minimum) : undefined,
            maximum: data.maximum ? Number(data.maximum) : undefined,
            minLength: data.minLength ? Number(data.minLength) : undefined,
            maxLength: data.maxLength ? Number(data.maxLength) : undefined,
            enum: data.enum
                ? data.enum.split(',').map((item) => item.trim())
                : undefined,
        }

        updateSchema((draft) => {
            if (path.length === 0) {
                // Campo en el nivel raíz
                draft[processedData.name] = {
                    ...processedData,
                }

                // Si estamos editando y el nombre cambió, eliminamos el anterior
                if (
                    editingField.field &&
                    editingField.field.name !== processedData.name
                ) {
                    delete draft[editingField.field.name]
                }
            } else if (path.length === 1) {
                // Campo dentro de un objeto
                const [parentField] = path
                if (!draft[parentField].properties) {
                    draft[parentField].properties = {}
                }

                draft[parentField].properties![processedData.name] = {
                    ...processedData,
                }

                // Si estamos editando y el nombre cambió, eliminamos el anterior
                if (
                    editingField.field &&
                    editingField.field.name !== processedData.name
                ) {
                    delete draft[parentField].properties![
                        editingField.field.name
                    ]
                }
            }
            // Podríamos agregar más niveles si es necesario
        })

        setIsFieldDialogOpen(false)
    }

    // Maneja el guardado del esquema completo
    const handleSaveSchema = () => {
        if (onSave) {
            const jsonSchema = generateJSONSchema()
            onSave(jsonSchema)
        }
    }

    // Renderiza los campos del esquema de forma recursiva
    const renderSchemaFields = (
        fields: Record<string, SchemaField>,
        path: string[] = [],
    ) => {
        return (
            <div className="space-y-2">
                {Object.values(fields).map((field) => (
                    <div
                        key={field.name}
                        className="p-3 rounded-md bg-gray-50 dark:bg-gray-800"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="font-medium">
                                    {field.name}
                                </span>
                                <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">
                                    {field.type}
                                </span>
                                {field.required && (
                                    <span className="ml-2 text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                                        Requerido
                                    </span>
                                )}
                            </div>

                            {!readOnly && (
                                <div className="flex space-x-1">
                                    <Tooltip content="Editar campo">
                                        <Button
                                            size="sm"
                                            variant="plain"
                                            icon={<Edit size={16} />}
                                            onClick={() =>
                                                handleEditField(path, field)
                                            }
                                        />
                                    </Tooltip>
                                    <Tooltip content="Eliminar campo">
                                        <Button
                                            size="sm"
                                            variant="plain"
                                            icon={<Trash2 size={16} />}
                                            onClick={() =>
                                                handleDeleteField(
                                                    path,
                                                    field.name,
                                                )
                                            }
                                        />
                                    </Tooltip>
                                </div>
                            )}
                        </div>

                        {field.description && (
                            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {field.description}
                            </div>
                        )}

                        {/* Información adicional según el tipo */}
                        <div className="mt-2 grid gap-2 text-xs text-gray-500 dark:text-gray-400">
                            {field.format && (
                                <div>
                                    <span className="font-medium">
                                        Formato:
                                    </span>{' '}
                                    {field.format}
                                </div>
                            )}
                            {field.minimum !== undefined && (
                                <div>
                                    <span className="font-medium">Mínimo:</span>{' '}
                                    {field.minimum}
                                </div>
                            )}
                            {field.maximum !== undefined && (
                                <div>
                                    <span className="font-medium">Máximo:</span>{' '}
                                    {field.maximum}
                                </div>
                            )}
                            {field.minLength !== undefined && (
                                <div>
                                    <span className="font-medium">
                                        Longitud mínima:
                                    </span>{' '}
                                    {field.minLength}
                                </div>
                            )}
                            {field.maxLength !== undefined && (
                                <div>
                                    <span className="font-medium">
                                        Longitud máxima:
                                    </span>{' '}
                                    {field.maxLength}
                                </div>
                            )}
                            {field.pattern && (
                                <div>
                                    <span className="font-medium">Patrón:</span>{' '}
                                    {field.pattern}
                                </div>
                            )}
                            {field.enum && field.enum.length > 0 && (
                                <div>
                                    <span className="font-medium">
                                        Valores permitidos:
                                    </span>{' '}
                                    {field.enum.join(', ')}
                                </div>
                            )}
                            {field.default !== undefined && (
                                <div>
                                    <span className="font-medium">
                                        Valor por defecto:
                                    </span>{' '}
                                    {field.default}
                                </div>
                            )}
                        </div>

                        {/* Renderizado recursivo para propiedades de objeto */}
                        {field.type === 'object' && field.properties && (
                            <div className="mt-3 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm font-medium">
                                        Propiedades
                                    </div>

                                    {!readOnly && (
                                        <Button
                                            size="sm"
                                            variant="plain"
                                            icon={<Plus size={14} />}
                                            onClick={() =>
                                                handleAddField([
                                                    ...path,
                                                    field.name,
                                                ])
                                            }
                                        >
                                            Agregar propiedad
                                        </Button>
                                    )}
                                </div>

                                {Object.keys(field.properties).length > 0 ? (
                                    renderSchemaFields(field.properties, [
                                        ...path,
                                        field.name,
                                    ])
                                ) : (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        No hay propiedades definidas
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Renderizado para items de array */}
                        {field.type === 'array' && field.items && (
                            <div className="mt-3 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                                <div className="text-sm font-medium mb-2">
                                    Items
                                </div>
                                <div className="p-2 border rounded-md bg-gray-100 dark:bg-gray-700">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600">
                                                {field.items.type}
                                            </span>
                                        </div>

                                        {!readOnly && (
                                            <Button
                                                size="sm"
                                                variant="plain"
                                                icon={<Edit size={16} />}
                                                onClick={() =>
                                                    handleEditField(
                                                        [
                                                            ...path,
                                                            field.name,
                                                            'items',
                                                        ],
                                                        field.items,
                                                    )
                                                }
                                            />
                                        )}
                                    </div>

                                    {field.items.description && (
                                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            {field.items.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className={clsx('space-y-4 h-full flex flex-col', className)}>
            <Card className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 flex-1 flex flex-col">
                    <Tabs
                        value={activeTab}
                        onChange={(val) => setActiveTab(val)}
                        className="flex-1 flex flex-col"
                    >
                        <Tabs.TabList>
                            <Tabs.TabNav value="editor" icon={<List />}>
                                Editor Visual
                            </Tabs.TabNav>
                            <Tabs.TabNav value="preview" icon={<Eye />}>
                                Vista JSON Schema
                            </Tabs.TabNav>
                        </Tabs.TabList>
                        <Tabs.TabContent value="editor" className="flex-1">
                            <div className="py-4 space-y-4 flex-1 flex flex-col overflow-auto">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-lg font-medium">
                                        Editor de Esquema JSON
                                    </h4>
                                    {!readOnly && (
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="twoTone"
                                                color="blue-600"
                                                icon={<Plus />}
                                                onClick={() => handleAddField()}
                                            >
                                                Agregar Campo
                                            </Button>
                                            <Button
                                                variant="solid"
                                                color="blue-600"
                                                icon={<FileJson />}
                                                onClick={handleSaveSchema}
                                            >
                                                Guardar Esquema
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {Object.keys(schema).length > 0 ? (
                                    renderSchemaFields(schema)
                                ) : (
                                    <div className="p-6 text-center border border-dashed rounded-md">
                                        <div className="mb-2 text-gray-500 dark:text-gray-400">
                                            <FileJson
                                                size={32}
                                                className="mx-auto mb-2"
                                            />
                                            <p>
                                                No hay campos definidos en el
                                                esquema.
                                            </p>
                                        </div>
                                        {!readOnly && (
                                            <Button
                                                variant="twoTone"
                                                color="blue-600"
                                                icon={<Plus />}
                                                onClick={() => handleAddField()}
                                            >
                                                Agregar Primer Campo
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Tabs.TabContent>
                        <Tabs.TabContent value="preview" className="flex-1">
                            <div className="py-4 space-y-4 flex-1 flex flex-col overflow-auto">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-lg font-medium">
                                        Vista JSON Schema
                                    </h4>
                                    <Button
                                        variant="plain"
                                        icon={<Copy />}
                                        onClick={() =>
                                            navigator.clipboard.writeText(
                                                JSON.stringify(
                                                    generateJSONSchema(),
                                                    null,
                                                    2,
                                                ),
                                            )
                                        }
                                    >
                                        Copiar
                                    </Button>
                                </div>
                                <div className="rounded-md overflow-hidden">
                                    <SyntaxHighlighter
                                        language="json"
                                        style="a11yDark"
                                        showLineNumbers
                                        customStyle={{ margin: 0 }}
                                    >
                                        {JSON.stringify(
                                            generateJSONSchema(),
                                            null,
                                            2,
                                        )}
                                    </SyntaxHighlighter>
                                </div>
                            </div>
                        </Tabs.TabContent>
                    </Tabs>
                </div>
            </Card>

            {/* Diálogo para agregar/editar campos */}
            <Dialog
                isOpen={isFieldDialogOpen}
                onClose={() => setIsFieldDialogOpen(false)}
                onRequestClose={() => setIsFieldDialogOpen(false)}
                width={800} // Hacemos el diálogo más ancho
                style={{ maxHeight: '90vh' }} // Máximo 90% de la altura visible
            >
                <h5 className="mb-4 text-lg font-medium">
                    {editingField.field
                        ? 'Editar Campo'
                        : 'Agregar Nuevo Campo'}
                </h5>

                <div
                    className="overflow-y-auto pr-1"
                    style={{ maxHeight: 'calc(85vh - 150px)' }}
                >
                    <Form onSubmit={handleSubmit(onSubmitField)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormItem
                                label="Nombre del Campo"
                                invalid={Boolean(errors.name)}
                                errorMessage={errors.name?.message}
                            >
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field }) => <Input {...field} />}
                                />
                            </FormItem>

                            <FormItem
                                label="Tipo de Dato"
                                invalid={Boolean(errors.type)}
                                errorMessage={errors.type?.message}
                            >
                                <Controller
                                    name="type"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            options={schemaTypes}
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label="Descripción"
                                className="col-span-2"
                            >
                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field }) => <Input {...field} />}
                                />
                            </FormItem>

                            <FormItem label="Campo Requerido">
                                <Controller
                                    name="required"
                                    control={control}
                                    render={({
                                        field: { value, onChange },
                                    }) => (
                                        <div className="flex items-center mt-2">
                                            <SimpleCheckbox
                                                checked={value}
                                                onChange={onChange}
                                            >
                                                Este campo es obligatorio
                                            </SimpleCheckbox>
                                        </div>
                                    )}
                                />
                            </FormItem>

                            {/* Campos específicos según el tipo */}
                            {selectedType === 'string' && (
                                <>
                                    <FormItem label="Formato">
                                        <Controller
                                            name="format"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    options={stringFormats}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />
                                    </FormItem>

                                    <FormItem label="Longitud Mínima">
                                        <Controller
                                            name="minLength"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    type="number"
                                                    {...field}
                                                />
                                            )}
                                        />
                                    </FormItem>

                                    <FormItem label="Longitud Máxima">
                                        <Controller
                                            name="maxLength"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    type="number"
                                                    {...field}
                                                />
                                            )}
                                        />
                                    </FormItem>

                                    <FormItem
                                        label="Patrón (Regex)"
                                        className="col-span-2"
                                    >
                                        <Controller
                                            name="pattern"
                                            control={control}
                                            render={({ field }) => (
                                                <Input {...field} />
                                            )}
                                        />
                                    </FormItem>
                                </>
                            )}

                            {(selectedType === 'number' ||
                                selectedType === 'integer') && (
                                <>
                                    <FormItem label="Valor Mínimo">
                                        <Controller
                                            name="minimum"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    type="number"
                                                    {...field}
                                                />
                                            )}
                                        />
                                    </FormItem>

                                    <FormItem label="Valor Máximo">
                                        <Controller
                                            name="maximum"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    type="number"
                                                    {...field}
                                                />
                                            )}
                                        />
                                    </FormItem>
                                </>
                            )}

                            {/* Valores enumerados para ciertos tipos */}
                            {(selectedType === 'string' ||
                                selectedType === 'number' ||
                                selectedType === 'integer') && (
                                <FormItem
                                    label="Valores Permitidos"
                                    className="col-span-2"
                                    extra="Separados por comas"
                                >
                                    <Controller
                                        name="enum"
                                        control={control}
                                        render={({ field }) => (
                                            <Input {...field} />
                                        )}
                                    />
                                </FormItem>
                            )}

                            {/* Valor por defecto */}
                            {selectedType !== 'object' &&
                                selectedType !== 'array' && (
                                    <FormItem
                                        label="Valor por Defecto"
                                        className="col-span-2"
                                    >
                                        <Controller
                                            name="default"
                                            control={control}
                                            render={({ field }) => (
                                                <Input {...field} />
                                            )}
                                        />
                                    </FormItem>
                                )}
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <Button
                                variant="plain"
                                onClick={() => setIsFieldDialogOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button variant="solid" type="submit">
                                {editingField.field ? 'Actualizar' : 'Crear'}
                            </Button>
                        </div>
                    </Form>
                </div>
            </Dialog>
        </div>
    )
}

export default JSONSchemaEditor
