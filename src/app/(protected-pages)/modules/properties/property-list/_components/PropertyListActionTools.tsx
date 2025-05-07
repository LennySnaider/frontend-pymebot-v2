/**
 * frontend/src/app/(protected-pages)/modules/properties/property-list/_components/PropertyListActionTools.tsx
 * Componente para las acciones principales de la lista de propiedades.
 * Implementa verificación de límites de plan.
 *
 * @version 2.1.0
 * @updated 2025-07-05
 */

'use client'

import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { TbPlus } from 'react-icons/tb'
import RefreshPropertyList from './RefreshPropertyList'
import { ResourceLimit } from '@/components/core/permissions'
import usePropertyListStore from '../_store/propertyListStore'

interface PropertyListActionToolsProps {
    hideResourceLimit?: boolean;
}

const PropertyListActionTools = ({ hideResourceLimit = false }: PropertyListActionToolsProps) => {
    const router = useRouter()
    const { total } = usePropertyListStore()

    const handleAddNewProperty = () => {
        router.push('/modules/properties/property-create')
    }

    return (
        <div className="flex items-center gap-2 w-full">
            <RefreshPropertyList />
            
            <div className="flex-grow">
                {!hideResourceLimit && (
                    <ResourceLimit 
                        verticalCode="bienes_raices"
                        moduleCode="properties"
                        resourceType="records"
                        compact
                        labels={{
                            title: "Propiedades",
                            description: "El límite de propiedades se define en tu plan de suscripción"
                        }}
                    />
                )}
                {!hideResourceLimit && (
                    <div className="text-xs text-gray-500 mt-1">
                        <strong>{total}</strong> {total === 1 ? 'propiedad' : 'propiedades'} en el sistema
                    </div>
                )}
            </div>
            
            <Button
                size="sm"
                variant="solid"
                icon={<TbPlus />}
                onClick={handleAddNewProperty}
            >
                Agregar propiedad
            </Button>
        </div>
    )
}

export default PropertyListActionTools
