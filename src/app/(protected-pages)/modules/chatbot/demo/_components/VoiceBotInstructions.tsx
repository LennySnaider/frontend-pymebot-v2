/**
 * frontend/src/app/(protected-pages)/modules/chatbot/demo/_components/VoiceBotInstructions.tsx
 * Componente que muestra las instrucciones de implementación del VoiceBot
 * @version 1.0.0
 * @updated 2025-04-28
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui'
import { 
    PiPresentationChartDuotone, 
    PiBrowserDuotone, 
    PiCursorClickDuotone 
} from 'react-icons/pi'

const VoiceBotInstructions: React.FC = () => {
    return (
        <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">
                Instrucciones de implementación
            </h2>
            <div className="space-y-6">
                <div className="flex items-start">
                    <div className="bg-primary/10 p-2 rounded-lg mr-3">
                        <PiPresentationChartDuotone className="text-primary text-xl" />
                    </div>
                    <div>
                        <h3 className="font-medium mb-1">
                            Demostración
                        </h3>
                        <p className="text-sm text-gray-500">
                            El widget de Voice Bot funcional está
                            activo en esta página (esquina inferior
                            derecha).
                        </p>
                    </div>
                </div>
                <div className="flex items-start">
                    <div className="bg-purple-100 p-2 rounded-lg mr-3">
                        <PiBrowserDuotone className="text-purple-600 text-xl" />
                    </div>
                    <div>
                        <h3 className="font-medium mb-1">
                            Integración
                        </h3>
                        <p className="text-sm text-gray-500">
                            Para integrar el Voice Bot funcional,
                            usa el componente VoiceChat y conecta la
                            lógica necesaria.
                        </p>
                    </div>
                </div>
                <div className="flex items-start">
                    <div className="bg-amber-100 p-2 rounded-lg mr-3">
                        <PiCursorClickDuotone className="text-amber-600 text-xl" />
                    </div>
                    <div>
                        <h3 className="font-medium mb-1">
                            Personalización
                        </h3>
                        <p className="text-sm text-gray-500">
                            El componente VoiceChat puede aceptar
                            props para personalizar su apariencia y
                            comportamiento.
                        </p>
                        <Button
                            className="mt-2"
                            variant="default"
                            color="blue"
                            onClick={() => window.scrollTo(0, 0)}
                        >
                            Ver opciones de configuración
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VoiceBotInstructions
