import React from 'react'
import Button from '@/components/ui/Button' // Asumiendo que Button existe aquí
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb'

interface AppointmentFooterProps {
    currentStep: number
    totalSteps: number // 2 o 3
    onPrevious: () => void
    onNext: () => void
    onSubmit: () => void
    isSubmitting: boolean
    isNextDisabled?: boolean // Para deshabilitar "Siguiente" si la validación falla
    isEditMode?: boolean // Para cambiar el texto del botón final
}

const AppointmentFooter: React.FC<AppointmentFooterProps> = ({
    currentStep,
    totalSteps,
    onPrevious,
    onNext,
    onSubmit,
    isSubmitting,
    isNextDisabled = false, // Por defecto habilitado
    isEditMode = false,
}) => {
    const isLastStep = currentStep === totalSteps

    return (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            {/* Botón Cancelar (o similar, podría estar fuera del footer) */}
            {/* <Button
                onClick={onClose} // Necesitaría onClose de props
                variant="plain"
                disabled={isSubmitting}
            >
                Cancelar
            </Button> */}

            <div className="flex space-x-3">
                {/* Botón Anterior */}
                {currentStep > 1 && (
                    <Button
                        onClick={onPrevious}
                        variant="default" // O el estilo deseado
                        disabled={isSubmitting}
                        icon={<TbChevronLeft />}
                    >
                        Anterior
                    </Button>
                )}
            </div>

            <div className="flex space-x-3">
                {/* Botón Siguiente / Finalizar */}
                {!isLastStep ? (
                    <Button
                        onClick={onNext}
                        variant="solid"
                        color="primary"
                        disabled={isSubmitting || isNextDisabled}
                        icon={<TbChevronRight className="ml-1" />}
                    >
                        Siguiente
                    </Button>
                ) : (
                    <Button
                        onClick={onSubmit}
                        variant="solid"
                        color="primary"
                        loading={isSubmitting}
                        disabled={isSubmitting} // Deshabilitar si ya está enviando
                    >
                        {isEditMode ? 'Actualizar Cita' : 'Programar Cita'}
                    </Button>
                )}
            </div>
        </div>
    )
}

export default AppointmentFooter
