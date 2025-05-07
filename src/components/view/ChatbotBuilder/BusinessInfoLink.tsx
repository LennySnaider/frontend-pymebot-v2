/**
 * frontend/src/components/view/ChatbotBuilder/BusinessInfoLink.tsx
 * Componente para mostrar un enlace a la configuración de empresa
 * @version 1.0.0
 * @updated 2025-04-15
 */

import React from 'react'
import { Card, Button } from '@/components/ui'
import { PiBuildings, PiArrowRightBold, PiInfoBold } from 'react-icons/pi'
import { useRouter } from 'next/navigation'

interface BusinessInfoLinkProps {
    className?: string
}

const BusinessInfoLink: React.FC<BusinessInfoLinkProps> = ({ className = '' }) => {
    const router = useRouter()
    
    const navigateToBusinessConfig = () => {
        router.push('/configuracion/empresa')
    }
    
    return (
        <Card className={`mb-4 ${className}`}>
            <div className="p-4 flex items-center bg-gradient-to-r from-primary-light to-primary bg-opacity-10">
                <div className="mr-4 p-3 bg-white rounded-full shadow">
                    <PiBuildings className="h-8 w-8 text-primary" />
                </div>
                
                <div className="flex-1">
                    <h3 className="text-lg font-medium text-white">
                        Información de empresa
                    </h3>
                    <p className="text-white text-opacity-80 text-sm">
                        Configura o actualiza la información de tu negocio que se usará en los chatbots
                    </p>
                </div>
                
                <Button
                    variant="solid"
                    color="white"
                    size="sm"
                    icon={<PiArrowRightBold />}
                    onClick={navigateToBusinessConfig}
                >
                    Configurar
                </Button>
            </div>
        </Card>
    )
}

export default BusinessInfoLink