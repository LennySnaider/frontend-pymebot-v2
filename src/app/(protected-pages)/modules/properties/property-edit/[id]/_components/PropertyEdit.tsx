/**
 * frontend/src/app/(protected-pages)/modules/properties/property-edit/[id]/_components/PropertyEdit.tsx
 * Componente para editar propiedades inmobiliarias.
 * Adaptado para trabajar con Supabase y la estructura del PropertyForm.
 *
 * @version 2.0.0
 * @updated 2025-06-22
 */

'use client'

import { useState } from 'react'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import PropertyForm from '@/components/view/PropertyForm'
import { TbTrash, TbArrowNarrowLeft } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import type { PropertyFormSchema } from '@/components/view/PropertyForm/types'
import { updateProperty } from '@/server/actions/properties/updateProperty'
import { deleteProperty } from '@/server/actions/properties/deleteProperty'

type PropertyEditProps = {
    data: any // Datos de la propiedad desde getProperty
}

const PropertyEdit = ({ data }: PropertyEditProps) => {
    const router = useRouter()

    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const [isSubmiting, setIsSubmiting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // const getDefaultValues = () => {
    //     if (data) {
    //         console.log('Datos recibidos en PropertyEdit:', data)

    //         // Los datos ya vienen mapeados desde getProperty() a través de PropertyMapper
    //         // Solo necesitamos asegurarnos de que todos los campos requeridos existan
    //         return {
    //             id: data.id,
    //             name: data.name || '',
    //             description: data.description || '',
    //             propertyCode: data.propertyCode || '',
    //             propertyType: data.propertyType || 'house',
    //             status: data.status || 'available',
    //             price: data.price || 0,
    //             currency: data.currency || 'MXN',
    //             operationType: data.operationType || 'sale',
    //             features: data.features || {
    //                 bedrooms: 0,
    //                 bathrooms: 0,
    //                 area: 0,
    //                 parkingSpots: 0,
    //                 yearBuilt: new Date().getFullYear(),
    //                 hasPool: false,
    //                 hasGarden: false,
    //                 hasGarage: false,
    //                 hasSecurity: false,
    //             },
    //             location: data.location || {
    //                 address: '',
    //                 city: '',
    //                 state: '',
    //                 zipCode: '',
    //                 country: 'México',
    //                 coordinates: {
    //                     lat: 0,
    //                     lng: 0,
    //                 },
    //             },
    //             // Usar media si ya está mapeado correctamente
    //             media: data.media || [],
    //             // Asegurarnos de que agentId tenga un valor
    //             agentId: data.agentId || '1',
    //         }
    //     }

    //     return {}
    // }
    const getDefaultValues = () => {
        if (data) {
            console.log('Datos recibidos en PropertyEdit:', data)

            return {
                id: data.id,
                name: data.name || '',
                description: data.description || '',
                propertyCode: data.propertyCode || '',
                propertyType: data.propertyType || 'house',
                status: data.status || 'available',
                price: data.price || 0,
                currency: data.currency || 'MXN',
                operationType: data.operationType || 'sale',
                features: data.features || {
                    bedrooms: 0,
                    bathrooms: 0,
                    area: 0,
                    parkingSpots: 0,
                    yearBuilt: new Date().getFullYear(),
                    hasPool: false,
                    hasGarden: false,
                    hasGarage: false,
                    hasSecurity: false,
                },
                location: {
                    address: data.location?.address || '',
                    city: data.location?.city || '',
                    state: data.location?.state || '',
                    zipCode: data.location?.zipCode || '',
                    colony: data.location?.colony || '',
                    country: data.location?.country || 'México',
                    coordinates: {
                        lat: data.location?.coordinates?.lat || 0,
                        lng: data.location?.coordinates?.lng || 0,
                    },
                    showApproximateLocation:
                        data.location?.showApproximateLocation ?? false,
                },
                media: data.media || [],
                agentId: data.agentId || '1',
            }
        }

        return {}
    }

    const handleFormSubmit = async (values: PropertyFormSchema) => {
        try {
            setIsSubmiting(true)
            console.log('Enviando formulario con valores:', values)

            // Filtrar las imágenes para asegurarnos de que no hay duplicados
            const uniqueMedia = values.media
                // Filtrar elementos válidos
                .filter((media) => media && media.url && !media._uploading)
                // Filtrar duplicados por URL
                .filter(
                    (media, index, self) =>
                        index === self.findIndex((m) => m.url === media.url),
                )

            console.log(
                `Media después de filtrar duplicados: ${uniqueMedia.length} imágenes`,
            )

            // IMPORTANTE: El problema es que estamos sobrescribiendo el valor que ya viene correcto del formulario.
            // Simplemente vamos a usar directamente los valores que vienen del formulario sin transformaciones.

            // Primero vamos a verificar los valores exactos que recibimos del formulario
            console.log('ANÁLISIS - valores originales del formulario:', {
                'location.showApproximateLocation':
                    values.location?.showApproximateLocation,
                tipo: typeof values.location?.showApproximateLocation,
            })

            // No necesitamos hacer transformaciones complejas ni sobrescribir los valores
            // que ya vienen correctamente desde el componente LocationSection
            const propertyData = {
                id: values.id,
                name: values.name,
                description: values.description,
                propertyCode: values.propertyCode,
                propertyType: values.propertyType,
                status: values.status,
                price: values.price,
                currency: values.currency,
                operationType: values.operationType,
                // Incluir features como está
                features: values.features,
                // IMPORTANTE: Incluir location EXACTAMENTE como viene del formulario,
                // sin hacer ninguna transformación que pueda cambiar los valores
                location: values.location,
                // También copiamos el valor directamente a la raíz para el campo show_approximate_location
                // sin ninguna transformación para no perder su valor booleano original
                show_approximate_location:
                    values.location?.showApproximateLocation,
                // Incluir media filtrada sin duplicados
                media: uniqueMedia,
                // Agregar agentId si existe
                agentId: values.agentId || 'agent-1',
            }

            // Log para depuración
            console.log(
                'show_approximate_location definitivo:',
                propertyData.show_approximate_location,
                'tipo:',
                typeof propertyData.show_approximate_location,
            )

            console.log(
                'location.showApproximateLocation definitivo:',
                propertyData.location.showApproximateLocation,
                'tipo:',
                typeof propertyData.location.showApproximateLocation,
            )

            // Llamar al server action para actualizar la propiedad
            const result = await updateProperty(data.id, propertyData)

            if (result.success) {
                toast.push(
                    <Notification type="success">
                        ¡Propiedad actualizada con éxito!
                    </Notification>,
                    {
                        placement: 'top-center',
                    },
                )
                router.push('/modules/properties/property-list')
            } else {
                toast.push(
                    <Notification type="danger">
                        Error al actualizar: {result.error}
                    </Notification>,
                    {
                        placement: 'top-center',
                    },
                )
            }
        } catch (error) {
            console.error('Error al actualizar la propiedad:', error)
            toast.push(
                <Notification type="danger">
                    Error al guardar los cambios. Por favor, inténtelo de nuevo.
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsSubmiting(false)
        }
    }

    const handleDelete = () => {
        setDeleteConfirmationOpen(true)
    }

    const handleCancel = () => {
        setDeleteConfirmationOpen(false)
    }

    const handleBack = () => {
        router.push('/modules/properties/property-list')
    }

    const handleConfirmDelete = async () => {
        try {
            setIsDeleting(true)
            const result = await deleteProperty(data.id)

            if (result.success) {
                toast.push(
                    <Notification type="success">
                        ¡Propiedad eliminada correctamente!
                    </Notification>,
                    { placement: 'top-center' },
                )
                router.push('/modules/properties/property-list')
            } else {
                toast.push(
                    <Notification type="danger">
                        Error al eliminar: {result.error}
                    </Notification>,
                    { placement: 'top-center' },
                )
                setDeleteConfirmationOpen(false)
                setIsDeleting(false)
            }
        } catch (error) {
            console.error('Error al eliminar la propiedad:', error)
            toast.push(
                <Notification type="danger">
                    Error al eliminar la propiedad. Por favor, inténtelo de
                    nuevo.
                </Notification>,
                { placement: 'top-center' },
            )
            setDeleteConfirmationOpen(false)
            setIsDeleting(false)
        }
    }

    return (
        <>
            <PropertyForm
                defaultValues={getDefaultValues() as PropertyFormSchema}
                newProperty={false}
                onFormSubmit={handleFormSubmit}
            >
                <Container>
                    <div className="flex items-center justify-between px-8 py-4">
                        <Button
                            className="ltr:mr-3 rtl:ml-3"
                            type="button"
                            variant="plain"
                            icon={<TbArrowNarrowLeft />}
                            onClick={handleBack}
                        >
                            Volver
                        </Button>
                        <div className="flex items-center">
                            <Button
                                className="ltr:mr-3 rtl:ml-3"
                                type="button"
                                customColorClass={() =>
                                    'border-error ring-1 ring-error text-error hover:border-error hover:ring-error hover:text-error bg-transparent'
                                }
                                icon={<TbTrash />}
                                onClick={handleDelete}
                            >
                                Eliminar
                            </Button>
                            <Button
                                variant="solid"
                                type="submit"
                                loading={isSubmiting}
                            >
                                Guardar
                            </Button>
                        </div>
                    </div>
                </Container>
            </PropertyForm>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title="Eliminar Propiedad"
                onClose={handleCancel}
                onRequestClose={handleCancel}
                onCancel={handleCancel}
                onConfirm={handleConfirmDelete}
                confirmButtonProps={{
                    loading: isDeleting,
                }}
            >
                <p>
                    ¿Está seguro de que desea eliminar esta propiedad? Esta
                    acción no se puede deshacer.
                </p>
            </ConfirmDialog>
        </>
    )
}

export default PropertyEdit
