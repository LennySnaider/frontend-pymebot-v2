/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/steps/LocationNotesStep.tsx
 * Paso para ingresar ubicación y notas adicionales para la cita.
 * 
 * @version 1.0.0
 * @updated 2025-04-28
 */

import React from 'react'
import Input from '@/components/ui/Input'
import { HiLocationMarker, HiPencil } from 'react-icons/hi'
import type { Dispatch, SetStateAction } from 'react'

interface LocationNotesStepProps {
    location: string
    notes: string
    setLocation: Dispatch<SetStateAction<string>>
    setNotes: Dispatch<SetStateAction<string>>
    formErrors: Record<string, string>
}

const LocationNotesStep: React.FC<LocationNotesStepProps> = ({
    location,
    notes,
    setLocation,
    setNotes,
    formErrors,
}) => {
    return (
        <div className="space-y-6">
            {/* Ubicación */}
            <div>
                <label
                    htmlFor="appointmentLocation"
                    className="flex items-center mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                    <HiLocationMarker className="mr-1 text-red-500" />
                    Ubicación <span className="text-red-500 ml-1">*</span>
                </label>
                <Input
                    id="appointmentLocation"
                    placeholder="Ingresar ubicación de la cita"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`bg-white dark:bg-gray-700 ${formErrors.location ? 'border-red-500' : ''}`}
                />
                {formErrors.location && (
                    <p className="text-red-500 text-xs mt-1">
                        La ubicación de la cita es obligatoria.
                    </p>
                )}
            </div>

            {/* Notas adicionales */}
            <div>
                <label
                    htmlFor="appointmentNotes"
                    className="flex items-center mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                    <HiPencil className="mr-1" />
                    Notas Adicionales
                </label>
                <Input
                    id="appointmentNotes"
                    textArea
                    rows={4}
                    placeholder="Información adicional para el agente..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-white dark:bg-gray-700 resize-none"
                />
            </div>
        </div>
    )
}

export default LocationNotesStep