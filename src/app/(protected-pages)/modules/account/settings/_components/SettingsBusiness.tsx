/**
 * frontend/src/app/(protected-pages)/modules/account/settings/_components/SettingsBusiness.fixed.tsx
 * Componente para la configuración de la información del negocio dentro de la página de settings
 * Implementa el mismo enfoque UI/UX que SettingsProfile para editar campos al hacer clic directamente
 * @version 3.2.0
 * @updated 2025-04-30
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/utils/hooks/useTranslation'
import dynamic from 'next/dynamic'
import {
    Avatar,
    Button,
    Input,
    Form,
    FormItem,
    Select,
    Upload,
    toast,
    Notification,
    Spinner,
} from '@/components/ui'

import { PiStorefrontBold, PiPlusBold } from 'react-icons/pi'
import useCurrentSession from '@/utils/hooks/useCurrentSession'
import { supabase } from '@/services/supabase/SupabaseClient'
import { uploadImageDirect, validateImageFile } from '@/utils/imageUploader'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import type { ZodType } from 'zod'
import useSWR from 'swr'
import sleep from '@/utils/sleep'

// Variables de entorno para autenticación
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Interfaz para la información del negocio (tenant)
interface BusinessInfo {
    id: string
    name: string
    logo_url?: string
    primary_color?: string
    description?: string
    business_type?: string
    timezone?: string
    contact_email?: string
    phone_number?: string
    address?: string
    city?: string
    state?: string
    country?: string
    postal_code?: string
    website?: string
    updated_at?: string
}

// Esquema de validación para el formulario
type BusinessSchema = {
    name: string
    description: string
    business_type: string
    timezone: string
    website: string
    primary_color: string
    contact_email: string
    phone_number: string
    address: string
    city: string
    postal_code: string
    logo_url: string
}

// Opciones para tipos de negocio (deberían venir de traducciones o constantes)
const businessTypeOptions = [
    { value: 'real_estate', label: 'Bienes Raíces' },
    { value: 'restaurant', label: 'Restaurante' },
    { value: 'salon', label: 'Salón de Belleza / Spa' },
    { value: 'gym', label: 'Gimnasio' },
    { value: 'retail', label: 'Tienda Minorista' },
    { value: 'consulting', label: 'Consultoría' },
    { value: 'healthcare', label: 'Salud' },
    { value: 'education', label: 'Educación' },
    { value: 'other', label: 'Otro' },
]

// Opciones para husos horarios (deberían venir de traducciones o constantes)
const timezoneOptions = [
    { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6)' },
    { value: 'America/New_York', label: 'Nueva York (UTC-5)' },
    { value: 'America/Chicago', label: 'Chicago (UTC-6)' },
    { value: 'America/Denver', label: 'Denver (UTC-7)' },
    { value: 'America/Los_Angeles', label: 'Los Ángeles (UTC-8)' },
    { value: 'America/Bogota', label: 'Bogotá (UTC-5)' },
    { value: 'America/Santiago', label: 'Santiago (UTC-4)' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires (UTC-3)' },
    { value: 'Europe/Madrid', label: 'Madrid (UTC+1)' },
]

// Esquema de validación
const validationSchema: ZodType<BusinessSchema> = z.object({
    name: z.string().min(1, { message: 'El nombre es requerido' }),
    description: z.string().optional(),
    business_type: z.string().optional(),
    timezone: z.string().optional(),
    website: z
        .string()
        .url({ message: 'URL no válida' })
        .optional()
        .or(z.literal('')),
    primary_color: z.string().optional(),
    contact_email: z
        .string()
        .email({ message: 'Email no válido' })
        .optional()
        .or(z.literal('')),
    phone_number: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    logo_url: z.string().optional(),
})

// Función para obtener datos del negocio desde la API
const fetchBusinessInfo = async (tenantId: string) => {
    console.log('Cargando información del negocio para tenant:', tenantId)

    try {
        const { data, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', tenantId)
            .single()

        if (error) {
            console.error('Error al obtener información del tenant:', error)
            throw new Error(
                `Error al cargar datos del negocio: ${error.message}`,
            )
        }

        return data as BusinessInfo
    } catch (error) {
        console.error('Error en fetchBusinessInfo:', error)
        throw error
    }
}

// Definimos el componente
const SettingsBusiness: React.FC = () => {
    const t = useTranslation('system') // Usar namespace 'system' para settings
    const tCore = useTranslation('core') // Para botones como Guardar, Cancelar, Editar

    // Estado local para previsualizar la imagen subida
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    // Estado para controlar errores de carga de imagen
    const [imageLoadError, setImageLoadError] = useState<boolean>(false);
    
    // Obtener sesión actual para el tenantId
    const { session } = useCurrentSession()
    const tenantId = session?.user?.tenant_id || process.env.DEFAULT_TENANT_ID

    // Configurar SWR para obtener y cachear los datos del negocio
    const {
        data: businessData,
        error: fetchError,
        mutate,
    } = useSWR(
        tenantId ? [`businessInfo`, tenantId] : null,
        () => (tenantId ? fetchBusinessInfo(tenantId) : null),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
            shouldRetryOnError: false,
            onError: (err) => {
                console.error('Error SWR al cargar datos:', err)
                toast.push(
                    <Notification title={tCore('error')} type="danger">
                        {t('business.loadError')}
                    </Notification>,
                )
            },
        },
    )

    // Configurar el formulario con React Hook Form
    const {
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isDirty },
        control,
        setValue,
    } = useForm<BusinessSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            name: '',
            description: '',
            business_type: '',
            timezone: '',
            website: '',
            primary_color: '#3b82f6',
            contact_email: '',
            phone_number: '',
            address: '',
            city: '',
            postal_code: '',
            logo_url: '',
        },
    })

    // Actualizar el formulario cuando llegan los datos
    useEffect(() => {
        if (businessData) {
            // Resetear el formulario con los datos obtenidos
            reset({
                name: businessData.name || '',
                description: businessData.description || '',
                business_type: businessData.business_type || '',
                timezone: businessData.timezone || '',
                website: businessData.website || '',
                primary_color: businessData.primary_color || '#3b82f6',
                contact_email: businessData.contact_email || '',
                phone_number: businessData.phone_number || '',
                address: businessData.address || '',
                city: businessData.city || '',
                postal_code: businessData.postal_code || '',
                logo_url: businessData.logo_url || '',
            })
            console.log('Formulario actualizado con datos:', businessData)
        }
    }, [businessData, reset])
    
    // Verificamos si la imagen ya está cargada cuando se inicializa el componente
    useEffect(() => {
        if (businessData?.logo_url) {
            // Si tenemos una URL de logo en los datos del negocio,
            // intentamos precargar la imagen para verificar si es válida
            const img = new Image();
            img.onload = () => {
                // La imagen se cargó correctamente, resetear cualquier error previo
                setImageLoadError(false);
                console.log('Imagen precargada exitosamente:', businessData.logo_url);
            };
            img.onerror = () => {
                // Error al cargar la imagen, marcar para mostrar fallback
                setImageLoadError(true);
                console.error('Error al precargar imagen del logo:', businessData.logo_url);
            };
            // Añadir un timestamp para evitar caché
            img.src = `${businessData.logo_url}?t=${Date.now()}`;
        }
    }, [businessData?.logo_url]);

    // Validación de archivos para la carga de logo - usando la utilidad centralizada
    const beforeUpload = (files: FileList | null) => {
        let valid: string | boolean = true

        if (files) {
            const fileArray = Array.from(files)
            for (const file of fileArray) {
                console.log('Validando archivo:', {
                    name: file.name,
                    type: file.type,
                    size: `${(file.size / 1024).toFixed(2)} KB`,
                })

                // Usar la función de validación centralizada
                const validationResult = validateImageFile(file)
                if (validationResult !== true) {
                    valid = validationResult
                    console.warn('Validación fallida:', validationResult)
                }
            }
        }

        return valid
    }

    // Manejar la subida del logo usando nuestra utilidad especializada
    const handleLogoUpload = async (file: File) => {
        if (!tenantId) return null

        try {
            // Validar el archivo usando nuestra función centralizada
            const validationResult = validateImageFile(file);
            if (validationResult !== true) {
                throw new Error(validationResult);
            }

            console.log('Iniciando subida de logo para tenant:', tenantId);
            
            // Usar nuestra nueva función de carga directa con FormData
            // Esta enfoque evita problemas de tipo MIME al usar fetch directamente
            const result = await uploadImageDirect(
                file,
                'images',         // bucket
                'tenant_logos'    // carpeta
            );
            
            console.log('Logo subido exitosamente:', result);
            
            // Guardar inmediatamente la URL del logo en la base de datos
            // para evitar que se pierda al recargar
            if (result && result.baseUrl) {
                console.log('Guardando URL del logo en la base de datos:', result.baseUrl);
                
                try {
                    const { error } = await supabase
                        .from('tenants')
                        .update({
                            logo_url: result.baseUrl,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', tenantId);
                        
                    if (error) {
                        console.error('Error al guardar URL del logo:', error);
                        throw new Error('No se pudo guardar la URL del logo');
                    }
                    
                    // También actualizamos el caché de SWR
                    if (businessData) {
                        mutate({
                            ...businessData,
                            logo_url: result.baseUrl,
                            updated_at: new Date().toISOString(),
                        });
                    }
                    
                    console.log('URL del logo guardada exitosamente');
                } catch (saveError) {
                    console.error('Error al guardar URL del logo:', saveError);
                    // Seguimos adelante para al menos tener el campo actualizado en el formulario
                }
            }
            
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            console.error('Error en carga de logo:', error);
            toast.push(
                <Notification title={tCore('error')} type="danger">
                    Error de procesamiento: {errorMessage}
                </Notification>
            );
            return null;
        }
    }

    // Guardar los cambios
    const onSubmit = async (values: BusinessSchema) => {
        if (!tenantId) return

        try {
            // Simular retraso para mostrar el estado de carga
            await sleep(500)
            
            // Crear una copia para no modificar el objeto original
            const dataToSave = {...values};
            
            // Limpiar cualquier posible caracter de cache busting si existe
            if (dataToSave.logo_url && dataToSave.logo_url.includes('?t=')) {
                dataToSave.logo_url = dataToSave.logo_url.split('?t=')[0];
            }
            
            // Asegurarnos que si hay un valor en el campo, sea una URL válida
            if (dataToSave.logo_url && !dataToSave.logo_url.startsWith('http')) {
                console.warn('URL de logo inválida, será omitida:', dataToSave.logo_url);
                dataToSave.logo_url = '';
            }

            const { error } = await supabase
                .from('tenants')
                .update({
                    ...dataToSave,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', tenantId)

            if (error) {
                console.error(
                    'Error al actualizar información del tenant:',
                    error,
                )
                toast.push(
                    <Notification title={tCore('error')} type="danger">
                        {t('business.saveError')}
                    </Notification>,
                )
                return
            }

            // Actualizar la caché de SWR con los nuevos datos
            mutate({
                ...businessData,
                ...dataToSave,
                updated_at: new Date().toISOString(),
            })

            toast.push(
                <Notification title={tCore('success')} type="success">
                    {t('business.saveSuccess')}
                </Notification>,
            )
        } catch (error) {
            console.error('Error al guardar info del tenant:', error)
            toast.push(
                <Notification title={tCore('error')} type="danger">
                    {t('business.saveError')}
                </Notification>,
            )
        }
    }

    // Mostrar spinner de carga si estamos cargando datos
    if (!businessData && !fetchError) {
        return (
            <div className="h-full w-full flex justify-center items-center py-10">
                <Spinner size="lg" />
            </div>
        )
    }

    // Mostrar error si no hay tenantId
    if (!tenantId) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
                No se pudo identificar el ID de su empresa. Por favor contacte
                al soporte.
            </div>
        )
    }

    // Mostrar error si hay un error de carga
    if (fetchError) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
                <h4 className="text-red-600 mb-2">Error al cargar los datos</h4>
                <p className="text-red-500 mb-4">{fetchError.message}</p>
                <Button onClick={() => mutate()} variant="solid" color="red">
                    Reintentar
                </Button>
            </div>
        )
    }

    // Función auxiliar para el formulario
    const handleFormSubmit = handleSubmit(onSubmit);

    return (
        <>
            <h4 className="mb-8">Configuración de Negocio</h4>
            <Form onSubmit={(e) => handleFormSubmit(e)}>
                {/* Logo */}
                <div className="mb-8">
                    <Controller
                        name="logo_url"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center gap-4">
                                {/* Vista previa de la imagen con manejador de fallos */}
                                <div className="w-[90px] h-[90px] relative flex items-center justify-center rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                                    {previewImage ? (
                                        // Vista previa local de la imagen recién subida
                                        <img
                                            src={previewImage}
                                            alt="Vista previa del logo"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                console.error('Error al cargar la vista previa de la imagen');
                                                // Marcar el error y mostrar fallback
                                                setImageLoadError(true);
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : field.value ? (
                                        // Si hay URL pero no preview local, intentar cargar desde la URL
                                        // con cache busting para evitar problemas
                                        <>
                                            {/* Siempre intentamos cargar la imagen, incluso si hubo errores previos */}
                                            <img
                                                key={`img-${Date.now()}`} 
                                                src={`${field.value}?t=${Date.now()}`}
                                                alt="Logo de la empresa"
                                                className="w-full h-full object-cover"
                                                onLoad={() => {
                                                    console.log('Imagen cargada exitosamente');
                                                    setImageLoadError(false); // Resetear errores si la imagen carga
                                                }}
                                                onError={(e) => {
                                                    console.error('Error al cargar la imagen desde URL externa');
                                                    setImageLoadError(true);
                                                    // No ocultamos la imagen, solo mostramos el fallback
                                                }}
                                            />
                                            
                                            {/* Fallback si hay error - mostramos junto con la imagen para evitar parpadeos */}
                                            {imageLoadError && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                                    <PiStorefrontBold size={40} className="text-gray-300" />
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        // Icono por defecto si no hay imagen
                                        <PiStorefrontBold size={40} className="text-gray-300" />
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <Upload
                                        showList={false}
                                        uploadLimit={1}
                                        beforeUpload={beforeUpload}
                                        onChange={async (files) => {
                                            if (files.length > 0) {
                                                try {
                                                    // Crear una vista previa local inmediata
                                                    const localPreview = URL.createObjectURL(files[0]);
                                                    setPreviewImage(localPreview);
                                                    
                                                    // Mostrar un indicador de carga
                                                    toast.push(
                                                        <Notification
                                                            title="Subiendo imagen"
                                                            type="info"
                                                        >
                                                            Subiendo logo, por favor espere...
                                                        </Notification>
                                                    );
                                                    
                                                    // Verificar el archivo antes de subir
                                                    const fileToUpload = files[0];
                                                    console.log('Información de archivo antes de subir:', {
                                                        name: fileToUpload.name,
                                                        type: fileToUpload.type,
                                                        size: `${(fileToUpload.size / 1024).toFixed(2)} KB`
                                                    });
                                                    
                                                    // Resetear cualquier error previo
                                                    setImageLoadError(false);
                                                    
                                                    // Subir el archivo a Supabase usando el nuevo método
                                                    const result = await handleLogoUpload(fileToUpload);
                                                    
                                                    if (result) {
                                                        // Resetear cualquier error previo de carga de imagen
                                                        setImageLoadError(false);
                                                        
                                                        // Guardamos la URL base en el campo (sin parámetros de cache busting)
                                                        // Ya que queremos una URL estable en la base de datos
                                                        field.onChange(result.baseUrl);
                                                        
                                                        toast.push(
                                                            <Notification
                                                                title="Éxito"
                                                                type="success"
                                                            >
                                                                Logo subido correctamente
                                                            </Notification>
                                                        );
                                                    }
                                                } catch (error) {
                                                    console.error('Error en proceso de carga de logo:', error);
                                                    setPreviewImage(null);
                                                    field.onChange('');
                                                    toast.push(
                                                        <Notification
                                                            title={tCore('error')}
                                                            type="danger"
                                                        >
                                                            Error al cargar el logo. Por favor intenta con otra imagen.
                                                        </Notification>
                                                    );
                                                }
                                            }
                                        }}
                                    >
                                        <Button
                                            variant="solid"
                                            size="sm"
                                            type="button"
                                            icon={<PiPlusBold />}
                                        >
                                            Subir Logo
                                        </Button>
                                    </Upload>
                                    <Button
                                        size="sm"
                                        type="button"
                                        onClick={() => {
                                            setPreviewImage(null);
                                            field.onChange('');
                                            setImageLoadError(false);
                                        }}
                                    >
                                        Eliminar
                                    </Button>
                                    {field.value && imageLoadError && (
                                        <Button
                                            size="sm"
                                            type="button"
                                            variant="solid"
                                            color="blue"
                                            icon={<PiPlusBold />}
                                            onClick={() => {
                                                // Reintentar carga de imagen con nuevo timestamp
                                                const img = new Image();
                                                img.onload = () => {
                                                    setImageLoadError(false);
                                                    console.log('Imagen recargada exitosamente');
                                                    // Forzar re-render
                                                    setValue('logo_url', field.value + '?' + Date.now(), 
                                                        { shouldDirty: false, shouldValidate: false });
                                                    setTimeout(() => {
                                                        setValue('logo_url', field.value, 
                                                        { shouldDirty: false, shouldValidate: false });
                                                    }, 100);
                                                };
                                                img.onerror = () => {
                                                    toast.push(
                                                        <Notification title="Error" type="danger">
                                                            No se pudo cargar la imagen. Intenta subir una nueva.
                                                        </Notification>
                                                    );
                                                };
                                                // Cachebuster
                                                img.src = `${field.value}?reload=${Date.now()}`;
                                            }}
                                        >
                                            Reintentar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    />
                </div>

                {/* Información Básica */}
                <h5 className="text-lg font-medium mb-4">Información Básica</h5>
                <div className="grid grid-cols-1 gap-4 mb-6">
                    <FormItem
                        label="Nombre de la Empresa"
                        invalid={Boolean(errors.name)}
                        errorMessage={errors.name?.message}
                    >
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Nombre de tu Empresa"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem
                        label="Descripción"
                        invalid={Boolean(errors.description)}
                        errorMessage={errors.description?.message}
                    >
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    textArea
                                    autoComplete="off"
                                    placeholder="Breve descripción de tu empresa"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <FormItem
                        label="Tipo de Negocio"
                        invalid={Boolean(errors.business_type)}
                        errorMessage={errors.business_type?.message}
                    >
                        <Controller
                            name="business_type"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={businessTypeOptions}
                                    placeholder="Selecciona un tipo"
                                    value={businessTypeOptions.find(
                                        (option) =>
                                            option.value === field.value
                                    )}
                                    onChange={(option) =>
                                        field.onChange(option?.value)
                                    }
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem
                        label="Zona Horaria"
                        invalid={Boolean(errors.timezone)}
                        errorMessage={errors.timezone?.message}
                    >
                        <Controller
                            name="timezone"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={timezoneOptions}
                                    placeholder="Selecciona una zona horaria"
                                    value={timezoneOptions.find(
                                        (option) =>
                                            option.value === field.value
                                    )}
                                    onChange={(option) =>
                                        field.onChange(option?.value)
                                    }
                                />
                            )}
                        />
                    </FormItem>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <FormItem
                        label="Sitio Web"
                        invalid={Boolean(errors.website)}
                        errorMessage={errors.website?.message}
                    >
                        <Controller
                            name="website"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="https://www.tuempresa.com"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem
                        label="Color Principal"
                        invalid={Boolean(errors.primary_color)}
                        errorMessage={errors.primary_color?.message}
                    >
                        <Controller
                            name="primary_color"
                            control={control}
                            render={({ field }) => (
                                <div className="flex gap-2 items-center">
                                    <div
                                        className="w-10 h-10 rounded border"
                                        style={{
                                            backgroundColor:
                                                field.value || '#3b82f6',
                                        }}
                                    />
                                    <Input
                                        type="color"
                                        className="flex-1"
                                        {...field}
                                    />
                                </div>
                            )}
                        />
                    </FormItem>
                </div>

                {/* Información de Contacto */}
                <h5 className="text-lg font-medium mb-4">
                    Información de Contacto
                </h5>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <FormItem
                        label="Correo de Contacto"
                        invalid={Boolean(errors.contact_email)}
                        errorMessage={errors.contact_email?.message}
                    >
                        <Controller
                            name="contact_email"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="email"
                                    autoComplete="off"
                                    placeholder="contacto@tuempresa.com"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem
                        label="Teléfono"
                        invalid={Boolean(errors.phone_number)}
                        errorMessage={errors.phone_number?.message}
                    >
                        <Controller
                            name="phone_number"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="tel"
                                    autoComplete="off"
                                    placeholder="+52 123 456 7890"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                </div>

                <FormItem
                    label="Dirección"
                    invalid={Boolean(errors.address)}
                    errorMessage={errors.address?.message}
                >
                    <Controller
                        name="address"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Calle, número, colonia"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <FormItem
                        label="Ciudad"
                        invalid={Boolean(errors.city)}
                        errorMessage={errors.city?.message}
                    >
                        <Controller
                            name="city"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Ciudad"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem
                        label="Código Postal"
                        invalid={Boolean(errors.postal_code)}
                        errorMessage={errors.postal_code?.message}
                    >
                        <Controller
                            name="postal_code"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="12345"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                </div>

                {/* Botón de Guardar */}
                <div className="flex justify-end">
                    <Button
                        variant="solid"
                        type="submit"
                        loading={isSubmitting}
                        disabled={!isDirty}
                    >
                        Guardar
                    </Button>
                </div>

                {/* Nota informativa */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">
                        {t('business.importantInfoTitle') ||
                            'Información importante'}
                    </p>
                    <p>
                        {t('business.importantInfoText') ||
                            'Esta información se utilizará en diversos aspectos de la plataforma:'}
                    </p>
                    <ul className="list-disc pl-5 mt-1">
                        <li>
                            {t('business.importantInfoItem1') ||
                                'Para personalizar la apariencia según tu marca'}
                        </li>
                        <li>
                            {t('business.importantInfoItem2') ||
                                'Como información de contacto en comunicaciones con clientes'}
                        </li>
                        <li>
                            {t('business.importantInfoItem3') ||
                                'Para configurar correctamente la zona horaria en citas y recordatorios'}
                        </li>
                    </ul>
                </div>
            </Form>
        </>
    )
}

// Exportamos el componente con dynamic para asegurar que solo se renderiza en el cliente
// Usamos React.memo para evitar re-renders innecesarios
const MemoizedSettingsBusiness = React.memo(SettingsBusiness)
export default dynamic(() => Promise.resolve(MemoizedSettingsBusiness), {
    ssr: false,
})
