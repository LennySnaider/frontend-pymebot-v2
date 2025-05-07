/**
 * frontend/src/app/(protected-pages)/superadmin/admin-tools/json-schema-forms/_components/JsonSchemaFormRenderer.tsx
 * Componente para renderizar formularios dinámicos basados en esquemas JSON.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import SimpleCheckbox from '@/components/shared/SimpleCheckbox'
import { Form, FormItem } from '@/components/ui/Form'
import { Notification } from '@/components/ui/Notification'
import { toast } from '@/components/ui/toast'
import { Tabs } from '@/components/ui/tabs'
import SyntaxHighlighter from '@/components/shared/SyntaxHighlighter'
import { 
    PiFileDuotone,
    PiEyeDuotone,
    PiTextboxDuotone,
    PiCodeDuotone,
    PiDownloadSimpleDuotone,
    PiCheckCircleDuotone,
    PiCalculatorDuotone
} from 'react-icons/pi'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Tipos de esquemas disponibles para selección
const sampleSchemas = [
    {
        id: '1',
        name: 'Formulario de Contacto',
        category: 'form',
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
        category: 'survey',
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
        category: 'user',
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
]

// Función para crear un esquema de validación Zod basado en un esquema JSON
const createZodSchemaFromJsonSchema = (jsonSchema: any) => {
    if (!jsonSchema || !jsonSchema.properties) {
        return z.object({})
    }

    const schemaMap: Record<string, any> = {}
    const requiredFields = jsonSchema.required || []

    Object.entries(jsonSchema.properties).forEach(([key, value]: [string, any]) => {
        let fieldSchema: any

        switch (value.type) {
            case 'string':
                fieldSchema = z.string()
                
                if (value.minLength !== undefined) {
                    fieldSchema = fieldSchema.min(value.minLength, `Mínimo ${value.minLength} caracteres`)
                }
                
                if (value.maxLength !== undefined) {
                    fieldSchema = fieldSchema.max(value.maxLength, `Máximo ${value.maxLength} caracteres`)
                }
                
                if (value.pattern) {
                    fieldSchema = fieldSchema.regex(new RegExp(value.pattern), 'Formato inválido')
                }
                
                if (value.format === 'email') {
                    fieldSchema = fieldSchema.email('Email inválido')
                } else if (value.format === 'date') {
                    // Validación simple para formato de fecha YYYY-MM-DD
                    fieldSchema = fieldSchema.regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
                }
                break
                
            case 'number':
            case 'integer':
                fieldSchema = value.type === 'integer' ? z.number().int() : z.number()
                
                if (value.minimum !== undefined) {
                    fieldSchema = fieldSchema.min(value.minimum, `Mínimo ${value.minimum}`)
                }
                
                if (value.maximum !== undefined) {
                    fieldSchema = fieldSchema.max(value.maximum, `Máximo ${value.maximum}`)
                }
                break
                
            case 'boolean':
                fieldSchema = z.boolean()
                break
                
            case 'object':
                if (value.properties) {
                    fieldSchema = createZodSchemaFromJsonSchema(value)
                } else {
                    fieldSchema = z.record(z.any())
                }
                break
                
            case 'array':
                if (value.items) {
                    const itemSchema = createZodSchemaFromJsonSchema({ properties: { item: value.items } }).shape.item
                    fieldSchema = z.array(itemSchema)
                    
                    if (value.minItems !== undefined) {
                        fieldSchema = fieldSchema.min(value.minItems, `Mínimo ${value.minItems} elementos`)
                    }
                    
                    if (value.maxItems !== undefined) {
                        fieldSchema = fieldSchema.max(value.maxItems, `Máximo ${value.maxItems} elementos`)
                    }
                } else {
                    fieldSchema = z.array(z.any())
                }
                break
                
            default:
                fieldSchema = z.any()
        }

        if (value.enum && Array.isArray(value.enum)) {
            fieldSchema = z.enum(value.enum as [string, ...string[]])
        }

        // Aplicar requerido/opcional
        if (requiredFields.includes(key)) {
            schemaMap[key] = fieldSchema
        } else {
            schemaMap[key] = fieldSchema.optional()
        }
    })

    return z.object(schemaMap)
}

// Componente para renderizar un campo basado en su definición de esquema
const SchemaField = ({ name, schema, control, errors }: any) => {
    const renderField = () => {
        if (!schema) return null

        switch (schema.type) {
            case 'string':
                if (schema.enum && Array.isArray(schema.enum)) {
                    const options = schema.enum.map((value: string) => ({
                        value,
                        label: value
                    }))
                    
                    return (
                        <Controller
                            name={name}
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={options}
                                    value={options.find(option => option.value === field.value) || null}
                                    onChange={(option) => field.onChange(option?.value || '')}
                                    placeholder="Seleccionar..."
                                />
                            )}
                        />
                    )
                }
                
                if (schema.format === 'date') {
                    return (
                        <Controller
                            name={name}
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="date"
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    )
                }
                
                return (
                    <Controller
                        name={name}
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                value={field.value || ''}
                                textArea={schema.maxLength > 100}
                                rows={schema.maxLength > 100 ? 3 : undefined}
                            />
                        )}
                    />
                )
                
            case 'number':
            case 'integer':
                return (
                    <Controller
                        name={name}
                        control={control}
                        render={({ field: { onChange, value, ...restField } }) => (
                            <Input
                                type="number"
                                {...restField}
                                value={value !== undefined && value !== null ? value : ''}
                                onChange={(e) => {
                                    const inputValue = e.target.value
                                    onChange(inputValue === '' ? null : Number(inputValue))
                                }}
                                min={schema.minimum}
                                max={schema.maximum}
                            />
                        )}
                    />
                )
                
            case 'boolean':
                return (
                    <Controller
                        name={name}
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <div className="mt-1">
                                <SimpleCheckbox
                                    checked={Boolean(value)}
                                    onChange={(checked) => onChange(checked)}
                                >
                                    {schema.description ? schema.description : ''}
                                </SimpleCheckbox>
                            </div>
                        )}
                    />
                )
                
            default:
                return <div>Tipo no soportado: {schema.type}</div>
        }
    }

    return (
        <FormItem
            label={schema.description || name}
            invalid={Boolean(errors?.[name])}
            errorMessage={errors?.[name]?.message}
            extra={schema.format ? `Formato: ${schema.format}` : undefined}
        >
            {renderField()}
        </FormItem>
    )
}

// Componente principal para renderizar formularios
const JsonSchemaFormRenderer = () => {
    const [selectedSchemaId, setSelectedSchemaId] = useState('')
    const [currentSchema, setCurrentSchema] = useState<any>(null)
    const [formData, setFormData] = useState<any>({})
    const [activeTab, setActiveTab] = useState('form')
    const [jsonSchemaInput, setJsonSchemaInput] = useState('')
    const [customSchema, setCustomSchema] = useState<any>(null)
    const [useCustomSchema, setUseCustomSchema] = useState(false)

    // Encuentra el esquema seleccionado
    useEffect(() => {
        if (!useCustomSchema) {
            const schema = sampleSchemas.find((s) => s.id === selectedSchemaId)
            setCurrentSchema(schema?.schema || null)
            setFormData({})
        }
    }, [selectedSchemaId, useCustomSchema])

    // Crea el esquema de validación Zod
    const zodSchema = currentSchema ? createZodSchemaFromJsonSchema(currentSchema) : z.object({})

    // Configuración del formulario
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(zodSchema),
        defaultValues: createDefaultValues(currentSchema),
        mode: 'onChange'
    })
    
    // Función para crear valores por defecto basados en el esquema
    function createDefaultValues(schema: any) {
        if (!schema || !schema.properties) return {}
        
        const defaultValues: Record<string, any> = {}
        
        Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
            if (value.type === 'object' && value.properties) {
                defaultValues[key] = createDefaultValues(value)
            } else {
                // Establecer valores por defecto según el tipo
                switch (value.type) {
                    case 'string':
                        defaultValues[key] = value.default || ''
                        break
                    case 'number':
                    case 'integer':
                        defaultValues[key] = value.default !== undefined ? value.default : 0
                        break
                    case 'boolean':
                        defaultValues[key] = value.default !== undefined ? value.default : false
                        break
                    case 'array':
                        defaultValues[key] = value.default || []
                        break
                    default:
                        defaultValues[key] = value.default !== undefined ? value.default : null
                }
            }
        })
        
        return defaultValues
    }

    // Reset el formulario cuando cambia el esquema
    useEffect(() => {
        if (currentSchema) {
            // Generar valores por defecto del esquema
            const defaultValues = createDefaultValues(currentSchema)
            reset(defaultValues)
        } else {
            reset({})
        }
        setFormData({})
    }, [currentSchema, reset])

    // Maneja el envío del formulario
    const onSubmit = (data: any) => {
        setFormData(data)
        setActiveTab('preview')
        
        toast.push(
            <Notification title="Formulario validado" type="success">
                Los datos del formulario se han validado correctamente
            </Notification>
        )
    }

    // Procesa un schema personalizado ingresado como JSON
    const processCustomSchema = () => {
        try {
            const parsed = JSON.parse(jsonSchemaInput)
            setCustomSchema(parsed)
            setCurrentSchema(parsed)
            setUseCustomSchema(true)
            reset({})
            setActiveTab('form')
            
            toast.push(
                <Notification title="Esquema cargado" type="success">
                    El esquema JSON se ha cargado correctamente
                </Notification>
            )
        } catch (error) {
            toast.push(
                <Notification title="Error de formato" type="danger">
                    El JSON ingresado no es válido
                </Notification>
            )
        }
    }

    // Genera código para el formulario
    const generateFormCode = () => {
        if (!currentSchema) return ''

        const fields = []
        const imports = []
        imports.push("import { useForm, Controller } from 'react-hook-form'")
        imports.push("import { zodResolver } from '@hookform/resolvers/zod'")
        imports.push("import { z } from 'zod'")
        imports.push("import { Button } from '@/components/ui/Button'")
        imports.push("import { Form, FormItem } from '@/components/ui/Form'")
        imports.push("import { Input } from '@/components/ui/Input'")
        
        // Añadir imports según los tipos de campos
        let hasSelect = false
        let hasCheckbox = false
        
        Object.entries(currentSchema.properties).forEach(([key, value]: [string, any]) => {
            if (value.type === 'string' && value.enum) {
                hasSelect = true
            } else if (value.type === 'boolean') {
                hasCheckbox = true
            }
        })
        
        if (hasSelect) imports.push("import { Select } from '@/components/ui/Select'")
        if (hasCheckbox) imports.push("import SimpleCheckbox from '@/components/shared/SimpleCheckbox'")

        // Código para el esquema Zod
        const zodCode = `// Crear esquema de validación con Zod
const schema = z.object({
${Object.entries(currentSchema.properties).map(([key, value]: [string, any]) => {
    const required = (currentSchema.required || []).includes(key)
    let fieldCode = ''
    
    switch (value.type) {
        case 'string':
            fieldCode = 'z.string()'
            if (value.minLength !== undefined) fieldCode += `.min(${value.minLength})`
            if (value.maxLength !== undefined) fieldCode += `.max(${value.maxLength})`
            if (value.format === 'email') fieldCode += '.email()'
            if (value.enum) fieldCode = `z.enum([${value.enum.map((v: string) => `'${v}'`).join(', ')}])`
            break
        case 'number':
        case 'integer':
            fieldCode = value.type === 'integer' ? 'z.number().int()' : 'z.number()'
            if (value.minimum !== undefined) fieldCode += `.min(${value.minimum})`
            if (value.maximum !== undefined) fieldCode += `.max(${value.maximum})`
            break
        case 'boolean':
            fieldCode = 'z.boolean()'
            break
        default:
            fieldCode = 'z.any()'
    }
    
    if (!required) fieldCode += '.optional()'
    
    return `  ${key}: ${fieldCode}, // ${value.description || ''}`
}).join('\n')}
})`

        // Código para el componente React
        const formCode = `// Componente del formulario
const MyForm = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {},
  })

  const onSubmit = (data) => {
    console.log('Form data:', data)
    // Procesar datos del formulario
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
${Object.entries(currentSchema.properties).map(([key, value]: [string, any]) => {
    let fieldCode = ''
    const label = value.description || key
    
    switch (value.type) {
        case 'string':
            if (value.enum) {
                fieldCode = `      <Controller
        name="${key}"
        control={control}
        render={({ field }) => (
          <Select
            options={[${value.enum.map((v: string) => `{ value: '${v}', label: '${v}' }`).join(', ')}]}
            value={options.find(option => option.value === field.value) || null}
            onChange={(option) => field.onChange(option?.value || '')}
            placeholder="Seleccionar..."
          />
        )}
      />`
            } else if (value.format === 'date') {
                fieldCode = `      <Controller
        name="${key}"
        control={control}
        render={({ field }) => (
          <Input type="date" value={field.value || ''} onChange={field.onChange} />
        )}
      />`
            } else {
                fieldCode = `      <Controller
        name="${key}"
        control={control}
        render={({ field }) => (
          <Input 
            ${value.maxLength > 100 ? 'textArea rows={3}' : ''} 
            value={field.value || ''}
            onChange={field.onChange}
          />
        )}
      />`
            }
            break
        case 'number':
        case 'integer':
            fieldCode = `      <Controller
        name="${key}"
        control={control}
        render={({ field: { onChange, value, ...restField } }) => (
          <Input
            type="number"
            {...restField}
            value={value !== undefined && value !== null ? value : ''}
            onChange={(e) => {
              const inputValue = e.target.value
              onChange(inputValue === '' ? null : Number(inputValue))
            }}
            ${value.minimum !== undefined ? `min={${value.minimum}}` : ''}
            ${value.maximum !== undefined ? `max={${value.maximum}}` : ''}
          />
        )}
      />`
            break
        case 'boolean':
            // Código para Checkbox
            fieldCode = `      <Controller
        name="${key}"
        control={control}
        render={({ field: { value, onChange } }) => (
          <div className="mt-1">
            <SimpleCheckbox
              checked={Boolean(value)}
              onChange={(checked) => onChange(checked)}
            >
              {/* Texto opcional */}
            </SimpleCheckbox>
          </div>
        )}
      />`
            break
        default:
            fieldCode = `      {/* Campo de tipo ${value.type} no soportado */}`
    }
    
    return `    <FormItem
      label="${label}"
      invalid={Boolean(errors?.${key})}
      errorMessage={errors?.${key}?.message}
    >
${fieldCode}
    </FormItem>`
}).join('\n\n')}

      <div className="mt-4">
        <Button type="submit" variant="solid">
          Enviar
        </Button>
      </div>
    </Form>
  )
}

export default MyForm`

        return `${imports.join('\n')}\n\n${zodCode}\n\n${formCode}`
    }

    // Renderiza los campos del formulario de forma recursiva
    const renderFormFields = (properties: any, required: string[] = [], parentName = '') => {
        if (!properties) return null

        return Object.entries(properties).map(([key, value]: [string, any]) => {
            const fieldName = parentName ? `${parentName}.${key}` : key
            
            if (value.type === 'object' && value.properties) {
                return (
                    <div key={fieldName} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 py-2 my-4">
                        <h6 className="font-medium text-base mb-2">{value.description || key}</h6>
                        {renderFormFields(value.properties, value.required || [], fieldName)}
                    </div>
                )
            }
            
            return (
                <SchemaField
                    key={fieldName}
                    name={fieldName}
                    schema={{
                        ...value,
                        required: required.includes(key),
                    }}
                    control={control}
                    errors={errors}
                />
            )
        })
    }

    // Descarga los datos del formulario como JSON
    const downloadFormData = () => {
        const dataStr = JSON.stringify(formData, null, 2)
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
        const exportFileDefaultName = 'form-data.json'

        const linkElement = document.createElement('a')
        linkElement.setAttribute('href', dataUri)
        linkElement.setAttribute('download', exportFileDefaultName)
        linkElement.click()
    }

    // Genera código para el esquema de validación
    const generateValidationCode = () => {
        if (!currentSchema) return ''

        return `import { z } from 'zod'

const schema = ${JSON.stringify(createZodSchemaFromJsonSchema(currentSchema).shape, null, 2)
            .replace(/"([^"]+)":/g, '$1:')
            .replace(/"/g, "'")
            .replace(/\s{2}/g, '  ')}`
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
                <Card className="w-full md:w-2/3 p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium">Renderizador de Formularios</h4>
                        <div>
                            <Button
                                variant="plain"
                                color="blue-600"
                                onClick={() => setUseCustomSchema(false)}
                                disabled={!useCustomSchema}
                            >
                                Usar Esquemas Predefinidos
                            </Button>
                        </div>
                    </div>

                    {!useCustomSchema ? (
                        <div className="mb-4">
                            <Select
                                options={sampleSchemas.map((schema) => ({
                                    value: schema.id,
                                    label: schema.name
                                }))}
                                value={selectedSchemaId}
                                onChange={setSelectedSchemaId}
                                placeholder="Seleccione un esquema para probar"
                            />
                        </div>
                    ) : (
                        <div className="mb-4 flex justify-between items-center">
                            <p className="font-medium">
                                Esquema personalizado cargado
                            </p>
                            <Button
                                variant="plain"
                                size="sm"
                                color="red-600"
                                onClick={() => {
                                    setUseCustomSchema(false)
                                    setCustomSchema(null)
                                    setSelectedSchemaId('')
                                    setCurrentSchema(null)
                                    setFormData({})
                                }}
                            >
                                Limpiar
                            </Button>
                        </div>
                    )}

                    <Tabs value={activeTab} onChange={(val) => setActiveTab(val)}>
                        <Tabs.TabList>
                            <Tabs.TabNav value="form" icon={<PiTextboxDuotone />}>
                                Formulario
                            </Tabs.TabNav>
                            <Tabs.TabNav value="schema" icon={<PiFileDuotone />}>
                                Esquema JSON
                            </Tabs.TabNav>
                            <Tabs.TabNav value="preview" icon={<PiEyeDuotone />} disabled={!Object.keys(formData).length}>
                                Vista de Datos
                            </Tabs.TabNav>
                            <Tabs.TabNav value="code" icon={<PiCodeDuotone />} disabled={!currentSchema}>
                                Código
                            </Tabs.TabNav>
                            <Tabs.TabNav value="validation" icon={<PiCalculatorDuotone />} disabled={!currentSchema}>
                                Validación
                            </Tabs.TabNav>
                        </Tabs.TabList>

                        <Tabs.TabContent value="form">
                            <div className="p-4">
                                {currentSchema ? (
                                    <Form onSubmit={handleSubmit(onSubmit)}>
                                        <div className="space-y-4">
                                            {renderFormFields(
                                                currentSchema.properties,
                                                currentSchema.required
                                            )}
                                        </div>

                                        <div className="mt-6">
                                            <Button
                                            variant="solid"
                                            color="blue-600"
                                            type="submit"
                                            icon={<PiCheckCircleDuotone />}
                                            >
                                            Validar Formulario
                                            </Button>
                                        </div>
                                    </Form>
                                ) : (
                                    <div className="text-center p-8 border border-dashed rounded-md">
                                        <PiTextboxDuotone size={36} className="mx-auto mb-3 text-gray-400" />
                                        <h5 className="font-medium text-lg mb-1">Ningún esquema seleccionado</h5>
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                                            Seleccione un esquema predefinido o cargue uno propio para comenzar
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Tabs.TabContent>

                        <Tabs.TabContent value="schema">
                            <div className="p-4">
                                <div className="mb-4">
                                    <h5 className="font-medium mb-2">Esquema JSON</h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        Pegue un esquema JSON para generar un formulario dinámico
                                    </p>

                                    <Input
                                        textArea
                                        rows={10}
                                        value={jsonSchemaInput}
                                        onChange={(e) => setJsonSchemaInput(e.target.value)}
                                        placeholder={`{\n  "type": "object",\n  "properties": {\n    "name": {\n      "type": "string",\n      "description": "Nombre"\n    }\n  },\n  "required": ["name"]\n}`}
                                    />

                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            variant="solid"
                                            color="blue-600"
                                            onClick={processCustomSchema}
                                            disabled={!jsonSchemaInput.trim()}
                                        >
                                            Cargar Esquema
                                        </Button>
                                    </div>
                                </div>

                                {currentSchema && (
                                    <div className="mt-6">
                                        <h5 className="font-medium mb-2">Esquema Actual</h5>
                                        <div className="rounded-md overflow-hidden">
                                            <SyntaxHighlighter
                                                language="json"
                                                style="a11yDark"
                                                showLineNumbers
                                                customStyle={{ margin: 0 }}
                                            >
                                                {JSON.stringify(currentSchema, null, 2)}
                                            </SyntaxHighlighter>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Tabs.TabContent>

                        <Tabs.TabContent value="preview">
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h5 className="font-medium">Datos del Formulario</h5>
                                    <Button
                                        variant="plain"
                                        color="blue-600"
                                        icon={<PiDownloadSimpleDuotone />}
                                        onClick={downloadFormData}
                                    >
                                        Descargar JSON
                                    </Button>
                                </div>

                                <div className="rounded-md overflow-hidden">
                                    <SyntaxHighlighter
                                        language="json"
                                        style="a11yDark"
                                        showLineNumbers
                                        customStyle={{ margin: 0 }}
                                    >
                                        {JSON.stringify(formData, null, 2)}
                                    </SyntaxHighlighter>
                                </div>
                            </div>
                        </Tabs.TabContent>

                        <Tabs.TabContent value="code">
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h5 className="font-medium">Código del Formulario</h5>
                                    <Button
                                        variant="plain"
                                        color="blue-600"
                                        onClick={() => {
                                            navigator.clipboard.writeText(generateFormCode())
                                            toast.push(
                                                <Notification title="Código copiado" type="success">
                                                    El código se ha copiado al portapapeles
                                                </Notification>
                                            )
                                        }}
                                    >
                                        Copiar Código
                                    </Button>
                                </div>

                                <div className="rounded-md overflow-hidden">
                                    <SyntaxHighlighter
                                        language="typescript"
                                        style="a11yDark"
                                        showLineNumbers
                                        customStyle={{ margin: 0 }}
                                    >
                                        {generateFormCode()}
                                    </SyntaxHighlighter>
                                </div>
                            </div>
                        </Tabs.TabContent>

                        <Tabs.TabContent value="validation">
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h5 className="font-medium">Esquema de Validación (Zod)</h5>
                                    <Button
                                        variant="plain"
                                        color="blue-600"
                                        onClick={() => {
                                            navigator.clipboard.writeText(generateValidationCode())
                                            toast.push(
                                                <Notification title="Código copiado" type="success">
                                                    El esquema de validación se ha copiado al portapapeles
                                                </Notification>
                                            )
                                        }}
                                    >
                                        Copiar Código
                                    </Button>
                                </div>

                                <div className="rounded-md overflow-hidden">
                                    <SyntaxHighlighter
                                        language="typescript"
                                        style="a11yDark"
                                        showLineNumbers
                                        customStyle={{ margin: 0 }}
                                    >
                                        {generateValidationCode()}
                                    </SyntaxHighlighter>
                                </div>
                            </div>
                        </Tabs.TabContent>
                    </Tabs>
                </Card>

                <Card className="w-full md:w-1/3 p-4">
                    <h5 className="font-medium mb-4">Instrucciones</h5>
                    <div className="space-y-4 text-sm">
                        <div>
                            <h6 className="font-medium mb-1">Paso 1: Seleccione un esquema</h6>
                            <p className="text-gray-600 dark:text-gray-400">
                                Elija uno de los esquemas predefinidos o cargue un esquema JSON personalizado en la pestaña "Esquema JSON".
                            </p>
                        </div>
                        
                        <div>
                            <h6 className="font-medium mb-1">Paso 2: Complete el formulario</h6>
                            <p className="text-gray-600 dark:text-gray-400">
                                Los campos del formulario se generan automáticamente basados en el esquema seleccionado.
                            </p>
                        </div>
                        
                        <div>
                            <h6 className="font-medium mb-1">Paso 3: Valide y visualice</h6>
                            <p className="text-gray-600 dark:text-gray-400">
                                Haga clic en "Validar Formulario" para ver los datos en formato JSON en la pestaña "Vista de Datos".
                            </p>
                        </div>
                        
                        <div>
                            <h6 className="font-medium mb-1">Paso 4: Genere código</h6>
                            <p className="text-gray-600 dark:text-gray-400">
                                Use las pestañas "Código" y "Validación" para obtener el código del formulario y su esquema de validación.
                            </p>
                        </div>

                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                            <h6 className="font-medium mb-1 text-blue-700 dark:text-blue-300">Beneficios</h6>
                            <ul className="list-disc pl-4 text-blue-600 dark:text-blue-400 space-y-1">
                                <li>Generación dinámica de formularios</li>
                                <li>Validación automática basada en esquemas</li>
                                <li>Exportación de datos en formato JSON</li>
                                <li>Generación de código React y Zod</li>
                                <li>Soporte para esquemas anidados</li>
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default JsonSchemaFormRenderer
