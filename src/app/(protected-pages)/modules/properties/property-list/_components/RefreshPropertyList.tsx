/**
 * frontend/src/app/(protected-pages)/modules/properties/property-list/_components/RefreshPropertyList.tsx
 * Componente para permitir la actualización manual de la lista de propiedades.
 *
 * @version 1.1.0
 * @updated 2025-06-12
 */

'use client'

import Button from '@/components/ui/Button'
import { TbRefresh } from 'react-icons/tb'
import Tooltip from '@/components/ui/Tooltip'
import usePropertyListStore from '../_store/propertyListStore'

const RefreshPropertyList = () => {
    const loading = usePropertyListStore(state => state.loading)
    const getData = usePropertyListStore(state => state.getData)

    return (
        <Tooltip title="Actualizar lista de propiedades">
            <Button
                variant="plain"
                size="sm"
                icon={<TbRefresh />}
                onClick={() => getData()}
                loading={loading}
                disabled={loading}
            >
                Actualizar
            </Button>
        </Tooltip>
    )
}

export default RefreshPropertyList
