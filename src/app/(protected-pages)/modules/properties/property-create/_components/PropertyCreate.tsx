/**
 * frontend/src/app/(protected-pages)/modules/properties/property-create/_components/PropertyCreate.tsx
 * Componente para crear propiedades con navegación directa a la lista actualizada.
 *
 * @version 2.0.0
 * @updated 2025-06-16
 */

'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import PropertyForm from '@/components/view/PropertyForm/PropertyForm'
import Notification from '@/components/ui/Notification'
import { toast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'
import { createProperty } from '@/server/actions/properties/createProperty'
import type { PropertyFormSchema } from '@/components/view/PropertyForm/types'

const PropertyCreate = () => {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)

    const handleDiscard = () => {
        router.push('/modules/properties/property-list')
    }

    const handleFormSubmit = async (values: PropertyFormSchema) => {
        setSubmitting(true)
        try {
            const result = await createProperty(values)

            if (result.success) {
                // Notificar éxito usando Notification
                toast.push(
                    <Notification type="success" title="Propiedad creada">
                        La propiedad ha sido creada exitosamente.
                    </Notification>,
                    {
                        placement: 'top-center',
                        duration: 3000,
                    },
                )

                // Establecer cookies en el lado del cliente como respaldo
                if (typeof document !== 'undefined') {
                    document.cookie = `property_created=true; path=/; max-age=60`
                    if (result.propertyId) {
                        document.cookie = `last_created_property_id=${result.propertyId}; path=/; max-age=300`
                    }
                }

                // Usar un timestamp para forzar una recarga completa y evitar caché
                const timestamp = Date.now()

                // Redirigir a la lista con parámetros de consulta especiales
                setTimeout(() => {
                    // Al añadir force=true y un timestamp, aseguramos que Next.js recargue completamente la página
                    window.location.href = `/modules/properties/property-list?force=true&t=${timestamp}`
                }, 800)
            } else {
                toast.push(
                    <Notification type="danger" title="Error">
                        {result.message || 'Error al crear la propiedad'}
                    </Notification>,
                    {
                        placement: 'top-center',
                        duration: 3000,
                    },
                )
            }
        } catch (error) {
            toast.push(
                <Notification type="danger" title="Error inesperado">
                    Ha ocurrido un error al crear la propiedad
                </Notification>,
                {
                    placement: 'top-center',
                    duration: 3000,
                },
            )
            console.error('Error al crear propiedad:', error)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <PropertyForm onFormSubmit={handleFormSubmit}>
            <div className="flex items-center justify-between w-full">
                <Button size="sm" onClick={handleDiscard} variant="plain">
                    Descartar
                </Button>
                <div className="flex items-center gap-2">
                    <Button
                        variant="solid"
                        size="sm"
                        loading={submitting}
                        type="submit"
                    >
                        Crear
                    </Button>
                </div>
            </div>
        </PropertyForm>
    )
}

export default PropertyCreate
