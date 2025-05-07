/**
 * frontend/src/app/(protected-pages)/modules/properties/property-list/_components/PropertyListSelected.tsx
 * Componente para gestionar acciones sobre propiedades seleccionadas.
 *
 * @version 1.0.0
 * @updated 2025-05-20
 */

'use client'

import { useState } from 'react'
import StickyFooter from '@/components/shared/StickyFooter'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import usePropertyListStore from '../_store/propertyListStore'
import { TbChecks } from 'react-icons/tb'

const PropertyListSelected = () => {
    const selectedProperties = usePropertyListStore(
        (state) => state.selectedProperties,
    )
    const setSelectAllProperties = usePropertyListStore(
        (state) => state.setSelectAllProperties,
    )
    const propertyList = usePropertyListStore((state) => state.propertyList)
    const setPropertyList = usePropertyListStore(
        (state) => state.setPropertyList,
    )

    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

    const handleDelete = () => {
        setDeleteConfirmationOpen(true)
    }

    const handleCancel = () => {
        setDeleteConfirmationOpen(false)
    }

    const handleConfirmDelete = () => {
        const newPropertyList = propertyList.filter((property) => {
            return !selectedProperties.some(
                (selected) => selected.id === property.id,
            )
        })
        setSelectAllProperties([])
        setPropertyList(newPropertyList)
        setDeleteConfirmationOpen(false)
    }

    return (
        <>
            {selectedProperties.length > 0 && (
                <StickyFooter
                    className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
                    stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
                    defaultClass="container mx-auto px-8 rounded-xl border border-gray-200 dark:border-gray-600 mt-4"
                >
                    <div className="container mx-auto">
                        <div className="flex items-center justify-between">
                            <span>
                                {selectedProperties.length > 0 && (
                                    <span className="flex items-center gap-2">
                                        <span className="text-lg text-primary">
                                            <TbChecks />
                                        </span>
                                        <span className="font-semibold flex items-center gap-1">
                                            <span className="heading-text">
                                                {selectedProperties.length}{' '}
                                                {selectedProperties.length === 1
                                                    ? 'propiedad'
                                                    : 'propiedades'}
                                            </span>
                                            <span>
                                                seleccionada
                                                {selectedProperties.length !== 1
                                                    ? 's'
                                                    : ''}
                                            </span>
                                        </span>
                                    </span>
                                )}
                            </span>

                            <div className="flex items-center">
                                <Button
                                    size="sm"
                                    className="ltr:mr-3 rtl:ml-3"
                                    type="button"
                                    customColorClass={() =>
                                        'border-error ring-1 ring-error text-error hover:border-error hover:ring-error hover:text-error'
                                    }
                                    onClick={handleDelete}
                                >
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    </div>
                </StickyFooter>
            )}
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title="Eliminar propiedades"
                onClose={handleCancel}
                onRequestClose={handleCancel}
                onCancel={handleCancel}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    ¿Estás seguro que deseas eliminar estas propiedades? Esta
                    acción no se puede deshacer.
                </p>
            </ConfirmDialog>
        </>
    )
}

export default PropertyListSelected
