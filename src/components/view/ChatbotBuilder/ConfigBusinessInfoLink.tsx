/**
 * frontend/src/components/view/ChatbotBuilder/ConfigBusinessInfoLink.tsx
 * Componente que muestra un enlace a la configuración de información del negocio
 * @version 1.0.0
 * @updated 2025-04-15
 */

import React from 'react'
import { Button } from '@/components/ui'
import { PiStorefrontBold, PiArrowSquareOutBold } from 'react-icons/pi'
import Link from 'next/link'

interface ConfigBusinessInfoLinkProps {
    showIcon?: boolean
    compact?: boolean
    className?: string
}

const ConfigBusinessInfoLink: React.FC<ConfigBusinessInfoLinkProps> = ({ 
    showIcon = true, 
    compact = false,
    className = ''
}) => {
    return (
        <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
            <div className="flex items-start">
                {showIcon && (
                    <span className="flex-shrink-0 bg-blue-100 rounded-full p-2 mr-3">
                        <PiStorefrontBold className="h-5 w-5 text-blue-600" />
                    </span>
                )}
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-800 mb-1">
                        Configuración de información de la empresa
                    </h3>
                    {!compact && (
                        <p className="text-sm text-blue-600 mb-3">
                            Para personalizar el nombre, logo y colores de la empresa, ve a la configuración 
                            general. Los cambios que realices se reflejarán automáticamente en todos los chatbots.
                        </p>
                    )}
                    <Link href="/configuracion/empresa" passHref>
                        <Button
                            size="sm"
                            variant="default"
                            color="blue"
                            icon={<PiArrowSquareOutBold />}
                        >
                            Ir a configuración de empresa
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default ConfigBusinessInfoLink