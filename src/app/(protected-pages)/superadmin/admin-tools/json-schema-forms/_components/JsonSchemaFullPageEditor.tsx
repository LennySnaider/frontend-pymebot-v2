'use client'

/**
 * frontend/src/app/(protected-pages)/superadmin/admin-tools/json-schema-forms/_components/JsonSchemaFullPageEditor.tsx
 * Editor de esquemas JSON en página completa en lugar de modal para mejor visualización.
 * @version 1.0.0
 * @updated 2025-05-01
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Form, FormItem } from '@/components/ui/Form'
import { Notification } from '@/components/ui/Notification'
import { toast } from '@/components/ui/toast'
import { JSONSchemaEditor } from '@/components/shared/JSONSchemaEditor'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import SimpleCheckbox from '@/components/shared/SimpleCheckbox'
import { PageHeader } from '@/components/shared'
import { Save, X, ArrowLeft } from 'lucide-react'

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

interface JsonSchemaFullPageEditorProps {
    currentSchema: any
    schemaInEditor: Record<string, any>
    onSchemaChange: (schema: Record<string, any>) => void
    onSubmit: (data: SchemaFormValues) => void
    onCancel: () => void
}

const JsonSchemaFullPageEditor: React.FC<JsonSchemaFullPageEditorProps> = ({
    currentSchema,
    schemaInEditor,
    onSchemaChange,
    onSubmit,
    onCancel,
}) => {
    const router = useRouter()
    const [editorHeight, setEditorHeight] = useState(500)

    // Configurar la altura del editor basada en el tamaño de la ventana
    useEffect(() => {
        const updateHeight = () => {
            // Calcular altura dejando espacio para los otros elementos
            const newHeight = window.innerHeight - 350
            setEditorHeight(Math.max(500, newHeight)) // Mínimo 500px
        }

        updateHeight()
        window.addEventListener('resize', updateHeight)
        return () => window.removeEventListener('resize', updateHeight)
    }, [])

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<SchemaFormValues>({
        resolver: zodResolver(schemaFormSchema),
        defaultValues: {
            name: currentSchema?.name || '',
            description: currentSchema?.description || '',
            category: currentSchema?.category || '',
            isPublic: currentSchema?.isPublic || false,
        },
    })

    const handleFormSubmit = (data: SchemaFormValues) => {
        onSubmit(data)
    }

    return (
        <div className="container mx-auto py-4 h-full flex flex-col">
            <PageHeader
                title={
                    currentSchema ? 'Editar Esquema JSON' : 'Nuevo Esquema JSON'
                }
                desc="Configure los detalles y estructura del esquema JSON"
                breadcrumbs={[
                    { text: 'Superadmin', path: '/superadmin' },
                    { text: 'Herramientas', path: '/superadmin/admin-tools' },
                    {
                        text: 'Esquemas JSON',
                        path: '/superadmin/admin-tools/json-schema-forms',
                    },
                    {
                        text: currentSchema
                            ? 'Editar Esquema'
                            : 'Nuevo Esquema',
                        path: '#',
                    },
                ]}
                extra={
                    <div className="flex space-x-2">
                        <Button variant="plain" icon={<X />} onClick={onCancel}>
                            Cancelar
                        </Button>
                        <Button
                            variant="solid"
                            color="blue-600"
                            icon={<Save />}
                            onClick={handleSubmit(handleFormSubmit)}
                        >
                            {currentSchema ? 'Actualizar' : 'Guardar'}
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-1">
                    <Card className="p-6">
                        <h5 className="text-lg font-medium mb-4">
                            Detalles del Esquema
                        </h5>
                        <Form onSubmit={handleSubmit(handleFormSubmit)}>
                            <div className="space-y-4">
                                <FormItem
                                    label="Nombre del Esquema"
                                    invalid={Boolean(errors.name)}
                                    errorMessage={errors.name?.message}
                                >
                                    <Controller
                                        name="name"
                                        control={control}
                                        render={({ field }) => (
                                            <Input {...field} />
                                        )}
                                    />
                                </FormItem>

                                <FormItem
                                    label="Categoría"
                                    invalid={Boolean(errors.category)}
                                    errorMessage={errors.category?.message}
                                >
                                    <Controller
                                        name="category"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                options={schemaCategories}
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                </FormItem>

                                <FormItem label="Esquema Público">
                                    <Controller
                                        name="isPublic"
                                        control={control}
                                        render={({
                                            field: { value, onChange },
                                        }) => (
                                            <div className="flex items-center mt-2">
                                                <SimpleCheckbox
                                                    checked={value}
                                                    onChange={onChange}
                                                >
                                                    Disponible para todos los
                                                    tenants
                                                </SimpleCheckbox>
                                            </div>
                                        )}
                                    />
                                </FormItem>

                                <FormItem label="Descripción">
                                    <Controller
                                        name="description"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                textArea
                                                rows={4}
                                            />
                                        )}
                                    />
                                </FormItem>
                            </div>
                        </Form>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className="p-6">
                        <h5 className="text-lg font-medium mb-4">
                            Estructura del Esquema
                        </h5>
                        <div
                            style={{ height: `${editorHeight}px` }}
                            className="dark:border-gray-700 rounded overflow-hidden"
                        >
                            <JSONSchemaEditor
                                initialSchema={schemaInEditor}
                                onChange={onSchemaChange}
                            />
                        </div>
                    </Card>
                </div>
            </div>

            <div className="flex justify-end mt-6 space-x-2">
                <Button variant="plain" icon={<X />} onClick={onCancel}>
                    Cancelar
                </Button>
                <Button
                    variant="solid"
                    color="blue-600"
                    icon={<Save />}
                    onClick={handleSubmit(handleFormSubmit)}
                >
                    {currentSchema ? 'Actualizar' : 'Guardar'}
                </Button>
            </div>
        </div>
    )
}

export default JsonSchemaFullPageEditor
