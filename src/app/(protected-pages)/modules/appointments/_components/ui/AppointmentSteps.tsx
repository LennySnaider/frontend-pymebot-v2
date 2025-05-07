import React from 'react'
import classNames from 'classnames'
import { TbHome, TbCalendarEvent, TbCheck } from 'react-icons/tb'

interface Step {
    number: number
    title: string
    description: string
    icon: React.ReactNode
}

interface AppointmentStepsProps {
    currentStep: number
    totalSteps: number // Será 2 o 3 dependiendo de hasAssignedProps
    hasAssignedProps: boolean
}

const AppointmentSteps: React.FC<AppointmentStepsProps> = ({
    currentStep,
    hasAssignedProps,
}) => {
    // Definir los pasos basados en si hay propiedades asignadas
    let steps: Step[] = []

    if (hasAssignedProps) {
        // Flujo de 2 pasos (Horario -> Revisar)
        steps = [
            {
                number: 1,
                title: 'Horario', // Título del paso 3 original
                description: 'Seleccione fecha y hora',
                icon: <TbCalendarEvent className="text-lg" />,
            },
            {
                number: 2,
                title: 'Revisar',
                description: 'Confirme los detalles',
                icon: <TbCheck className="text-lg" />, // Usar TbCheck para el último paso
            },
        ]
    } else {
        // Flujo de 3 pasos (Propiedades -> Horario -> Revisar)
        steps = [
            {
                number: 1,
                title: 'Propiedades', // Título del paso 2 original
                description: 'Seleccione propiedades',
                icon: <TbHome className="text-lg" />,
            },
            {
                number: 2,
                title: 'Horario', // Título del paso 3 original
                description: 'Seleccione fecha y hora',
                icon: <TbCalendarEvent className="text-lg" />,
            },
            {
                number: 3,
                title: 'Revisar',
                description: 'Confirme los detalles',
                icon: <TbCheck className="text-lg" />, // Usar TbCheck para el último paso
            },
        ]
    }

    return (
        <div className="flex w-full mb-6 overflow-x-auto py-4 justify-center space-x-6 border-b border-gray-200 dark:border-gray-700">
            {steps.map((step, index) => (
                <div
                    key={step.number}
                    className={classNames('flex-1 min-w-[140px] max-w-[200px]')}
                >
                    <div className="flex items-center">
                        {/* Círculo del icono */}
                        <div
                            className={classNames(
                                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300',
                                {
                                    'bg-primary-500 text-white':
                                        currentStep >= step.number,
                                    'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400':
                                        currentStep < step.number,
                                    'ring-2 ring-offset-2 ring-primary-300 dark:ring-offset-gray-800':
                                        currentStep === step.number,
                                },
                            )}
                        >
                            {step.icon}
                        </div>
                        {/* Línea de conexión */}
                        {index < steps.length - 1 && (
                            <div
                                className={classNames(
                                    'flex-grow h-2 mx-3 transition-colors duration-300 rounded',
                                    {
                                        'bg-primary-500':
                                            currentStep > step.number,
                                        'bg-gray-200 dark:bg-gray-700':
                                            currentStep <= step.number,
                                    },
                                )}
                            />
                        )}
                    </div>
                    {/* Texto del paso */}
                    <div className="mt-2">
                        <p
                            className={classNames(
                                'text-sm font-medium transition-colors duration-300',
                                {
                                    'text-primary-600 dark:text-primary-400':
                                        currentStep === step.number,
                                    'text-gray-900 dark:text-gray-100':
                                        currentStep > step.number,
                                    'text-gray-500 dark:text-gray-400':
                                        currentStep < step.number,
                                },
                            )}
                        >
                            Paso {step.number}: {step.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {step.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default AppointmentSteps
