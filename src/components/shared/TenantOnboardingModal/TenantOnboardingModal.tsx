/**
 * frontend/src/components/shared/TenantOnboardingModal/TenantOnboardingModal.tsx
 * Modal para el onboarding de nuevos tenants que se muestra automáticamente después del primer inicio de sesión.
 * Implementa un flujo de pasos controlados para la configuración inicial del tenant.
 * @version 1.0.0
 * @updated 2025-03-22
 */

'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Steps from '@/components/ui/Steps'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Radio from '@/components/ui/Radio'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Card from '@/components/ui/Card'
import { HiCheck } from 'react-icons/hi'

// Tipos para el formulario
interface TenantFormData {
    // Paso 1: Información del negocio
    businessName: string
    industry: string
    phoneNumber: string

    // Paso 2: Zona horaria y moneda
    timezone: string
    currency: string

    // Paso 3: Plan de suscripción
    subscriptionPlan: 'free' | 'basic' | 'pro'
}

// Opciones para los selectores
const industryOptions = [
    { value: 'real_estate', label: 'Bienes Raíces' },
    { value: 'property_management', label: 'Administración de Propiedades' },
    { value: 'broker', label: 'Bróker Inmobiliario' },
    { value: 'construction', label: 'Construcción' },
    { value: 'interior_design', label: 'Diseño de Interiores' },
]

const timezoneOptions = [
    { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
    { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
    { value: 'America/Lima', label: 'Lima (GMT-5)' },
    { value: 'America/Santiago', label: 'Santiago (GMT-4)' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
    { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
]

const currencyOptions = [
    { value: 'MXN', label: 'MXN - Peso mexicano' },
    { value: 'USD', label: 'USD - Dólar estadounidense' },
    { value: 'COP', label: 'COP - Peso colombiano' },
    { value: 'PEN', label: 'PEN - Sol peruano' },
    { value: 'CLP', label: 'CLP - Peso chileno' },
    { value: 'ARS', label: 'ARS - Peso argentino' },
    { value: 'EUR', label: 'EUR - Euro' },
]

// Planes de suscripción
const subscriptionPlans = [
    {
        id: 'free',
        name: 'Free',
        price: '$0.00',
        period: '1 mes',
        features: [
            '1 Integrante',
            'Recepcionista IA de WhatsApp (horario limitado)',
            '15 citas por mes',
            'Clientes limitados',
        ],
    },
    {
        id: 'basic',
        name: 'Básico',
        price: '$499.00',
        period: '12 meses',
        features: [
            '3 Integrantes',
            'Recepcionista IA de WhatsApp 12/7',
            '50 citas por mes',
            'Clientes ilimitados',
            'Embudo de ventas básico',
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$999.00',
        period: '12 meses',
        features: [
            '6 Integrantes',
            'Recepcionista IA de WhatsApp 24/7',
            '100 citas por mes',
            'Clientes ilimitados',
            'Embudo de ventas',
            'Sistema de reseñas',
            'Sistema de reservaciones',
            'Página web de Reservas',
            'Dominio Personalizado',
            'Soporte prioritario',
        ],
    },
]

interface TenantOnboardingModalProps {
    isOpen: boolean
    onClose: () => void
    // Esta función se llama cuando el tenant completa el proceso de onboarding
    onComplete: (tenantData: TenantFormData) => Promise<void>
}

const TenantOnboardingModal = ({
    isOpen,
    onClose,
    onComplete,
}: TenantOnboardingModalProps) => {
    // Estado para el paso actual
    const [currentStep, setCurrentStep] = useState(0)

    // Estado para los datos del formulario
    const [formData, setFormData] = useState<TenantFormData>({
        businessName: '',
        industry: '',
        phoneNumber: '',
        timezone: '',
        currency: '',
        subscriptionPlan: 'free',
    })

    // Estado para el procesamiento del formulario
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Estado para la validación del formulario
    const [errors, setErrors] = useState<
        Partial<Record<keyof TenantFormData, string>>
    >({})

    // Manejador para cambiar de paso
    const handleStepChange = (nextStep: number) => {
        // Validar el paso actual antes de avanzar
        if (nextStep > currentStep) {
            const currentErrors = validateStep(currentStep)
            if (Object.keys(currentErrors).length > 0) {
                setErrors(currentErrors)
                return
            }
        }

        // Cambiar al siguiente paso
        if (nextStep < 0) {
            setCurrentStep(0)
        } else if (nextStep > 3) {
            setCurrentStep(3)
        } else {
            setCurrentStep(nextStep)
            // Limpiar errores al cambiar de paso
            setErrors({})
        }
    }

    // Manejador para cambiar los datos del formulario
    const handleFormChange = (field: keyof TenantFormData, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))

        // Limpiar error del campo
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: undefined,
            }))
        }
    }

    // Validar el paso actual
    const validateStep = (
        step: number,
    ): Partial<Record<keyof TenantFormData, string>> => {
        const stepErrors: Partial<Record<keyof TenantFormData, string>> = {}

        switch (step) {
            case 0: // Información del negocio
                if (!formData.businessName.trim()) {
                    stepErrors.businessName =
                        'El nombre del negocio es requerido'
                }
                if (!formData.industry) {
                    stepErrors.industry = 'La industria es requerida'
                }
                if (!formData.phoneNumber.trim()) {
                    stepErrors.phoneNumber =
                        'El número de teléfono es requerido'
                } else if (
                    !/^\+?[0-9]{10,15}$/.test(formData.phoneNumber.trim())
                ) {
                    stepErrors.phoneNumber =
                        'El número de teléfono no es válido'
                }
                break

            case 1: // Zona horaria y moneda
                if (!formData.timezone) {
                    stepErrors.timezone = 'La zona horaria es requerida'
                }
                if (!formData.currency) {
                    stepErrors.currency = 'La moneda es requerida'
                }
                break

            case 2: // Plan de suscripción
                if (!formData.subscriptionPlan) {
                    stepErrors.subscriptionPlan =
                        'Debe seleccionar un plan de suscripción'
                }
                break

            default:
                break
        }

        return stepErrors
    }

    // Manejador para enviar el formulario
    const handleSubmit = async () => {
        try {
            setIsSubmitting(true)

            // Simular el proceso de pago (aquí se integraría con Stripe en el futuro)
            await new Promise((resolve) => setTimeout(resolve, 2000))

            // Llamar a la función onComplete proporcionada
            await onComplete(formData)

            // Mostrar notificación de éxito
            toast.push(
                <Notification title="Onboarding completado" type="success">
                    ¡Enhorabuena! Tu tenant se ha configurado correctamente.
                </Notification>,
            )

            // Cerrar modal
            onClose()
        } catch (error) {
            console.error('Error al completar el onboarding:', error)

            toast.push(
                <Notification title="Error en el onboarding" type="danger">
                    Ha ocurrido un error al configurar tu tenant. Por favor,
                    inténtalo de nuevo.
                </Notification>,
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    // Renderizar el contenido según el paso actual
    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="p-6">
                        <h4 className="mb-4 text-lg font-semibold">
                            Información del Negocio
                        </h4>

                        <div className="mb-4">
                            <label className="form-label mb-2">
                                Nombre del Negocio
                            </label>
                            <Input
                                value={formData.businessName}
                                onChange={(e) =>
                                    handleFormChange(
                                        'businessName',
                                        e.target.value,
                                    )
                                }
                                placeholder="Ingrese el nombre de su negocio"
                                invalid={!!errors.businessName}
                            />
                            {errors.businessName && (
                                <div className="text-red-500 mt-1 text-sm">
                                    {errors.businessName}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="form-label mb-2">Industria</label>
                            <Select
                                options={industryOptions}
                                value={industryOptions.find(
                                    (option) =>
                                        option.value === formData.industry,
                                )}
                                onChange={(option) =>
                                    handleFormChange(
                                        'industry',
                                        option?.value || '',
                                    )
                                }
                                placeholder="Seleccione la industria"
                            />
                            {errors.industry && (
                                <div className="text-red-500 mt-1 text-sm">
                                    {errors.industry}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="form-label mb-2">
                                Número de Teléfono
                            </label>
                            <Input
                                value={formData.phoneNumber}
                                onChange={(e) =>
                                    handleFormChange(
                                        'phoneNumber',
                                        e.target.value,
                                    )
                                }
                                placeholder="+52 123 456 7890"
                                invalid={!!errors.phoneNumber}
                            />
                            {errors.phoneNumber && (
                                <div className="text-red-500 mt-1 text-sm">
                                    {errors.phoneNumber}
                                </div>
                            )}
                        </div>
                    </div>
                )

            case 1:
                return (
                    <div className="p-6">
                        <h4 className="mb-4 text-lg font-semibold">
                            Zona horaria y moneda
                        </h4>

                        <div className="mb-4">
                            <label className="form-label mb-2">
                                Zona Horaria
                            </label>
                            <Select
                                options={timezoneOptions}
                                value={timezoneOptions.find(
                                    (option) =>
                                        option.value === formData.timezone,
                                )}
                                onChange={(option) =>
                                    handleFormChange(
                                        'timezone',
                                        option?.value || '',
                                    )
                                }
                                placeholder="Seleccione su zona horaria"
                            />
                            {errors.timezone && (
                                <div className="text-red-500 mt-1 text-sm">
                                    {errors.timezone}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="form-label mb-2">Moneda</label>
                            <Select
                                options={currencyOptions}
                                value={
                                    formData.currency
                                        ? currencyOptions.find(
                                              (option) =>
                                                  option.value ===
                                                  formData.currency,
                                          )
                                        : null
                                }
                                onChange={(option) =>
                                    handleFormChange(
                                        'currency',
                                        option?.value || '',
                                    )
                                }
                                placeholder="Seleccione su moneda"
                            />
                            {errors.currency && (
                                <div className="text-red-500 mt-1 text-sm">
                                    {errors.currency}
                                </div>
                            )}
                        </div>
                    </div>
                )

            case 2:
                return (
                    <div className="p-6">
                        <h4 className="mb-4 text-lg font-semibold">
                            Plan de Suscripción
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {subscriptionPlans.map((plan) => (
                                <Card
                                    key={plan.id}
                                    onClick={() =>
                                        handleFormChange(
                                            'subscriptionPlan',
                                            plan.id,
                                        )
                                    }
                                    className={`cursor-pointer transition-all ${formData.subscriptionPlan === plan.id ? 'border-2 border-primary' : 'hover:shadow-lg'}`}
                                >
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h5 className="font-semibold">
                                                    {plan.name}
                                                </h5>
                                                <div className="flex items-baseline">
                                                    <span className="text-lg font-bold">
                                                        {plan.price}
                                                    </span>
                                                    <span className="text-sm text-gray-500 ml-1">
                                                        / {plan.period}
                                                    </span>
                                                </div>
                                            </div>
                                            <Radio
                                                checked={
                                                    formData.subscriptionPlan ===
                                                    plan.id
                                                }
                                                onChange={() =>
                                                    handleFormChange(
                                                        'subscriptionPlan',
                                                        plan.id,
                                                    )
                                                }
                                            />
                                        </div>

                                        <ul className="mt-4 space-y-2">
                                            {plan.features.map(
                                                (feature, index) => (
                                                    <li
                                                        key={index}
                                                        className="flex items-center text-sm"
                                                    >
                                                        <HiCheck className="mr-2 text-emerald-500" />
                                                        <span>{feature}</span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {errors.subscriptionPlan && (
                            <div className="text-red-500 mt-4 text-sm">
                                {errors.subscriptionPlan}
                            </div>
                        )}
                    </div>
                )

            case 3:
                // Buscar el plan seleccionado
                const selectedPlan = subscriptionPlans.find(
                    (plan) => plan.id === formData.subscriptionPlan,
                )

                return (
                    <div className="p-6">
                        <h4 className="mb-4 text-lg font-semibold">
                            Confirmar Suscripción
                        </h4>

                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                            <h5 className="font-semibold mb-2">
                                {selectedPlan?.name}
                            </h5>
                            <p className="text-lg font-bold mb-4">
                                {selectedPlan?.price} / {selectedPlan?.period}
                            </p>

                            <ul className="space-y-2">
                                {selectedPlan?.features.map(
                                    (feature, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center text-sm"
                                        >
                                            <HiCheck className="mr-2 text-emerald-500" />
                                            <span>{feature}</span>
                                        </li>
                                    ),
                                )}
                            </ul>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-4 rounded-lg mb-4">
                            <p className="text-sm">
                                <strong>Nota:</strong> Este es un entorno de
                                prueba. No se realizará ningún cargo real a tu
                                tarjeta.
                            </p>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
            width={800}
        >
            <div>
                <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                    <h4 className="text-lg font-semibold">
                        Configuración de tu negocio
                    </h4>
                </div>

                <div className="p-4">
                    <Steps current={currentStep}>
                        <Steps.Item title="Negocio" />
                        <Steps.Item title="Configuración" />
                        <Steps.Item title="Suscripción" />
                        <Steps.Item title="Confirmación" />
                    </Steps>
                </div>

                <div className="mb-6">{renderStepContent()}</div>

                <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-600 flex justify-between">
                    <Button
                        disabled={currentStep === 0}
                        onClick={() => handleStepChange(currentStep - 1)}
                        variant="plain"
                    >
                        Anterior
                    </Button>

                    {currentStep < 3 ? (
                        <Button
                            variant="solid"
                            onClick={() => handleStepChange(currentStep + 1)}
                        >
                            Siguiente
                        </Button>
                    ) : (
                        <Button
                            variant="solid"
                            loading={isSubmitting}
                            onClick={handleSubmit}
                        >
                            Completar Registro
                        </Button>
                    )}
                </div>
            </div>
        </Dialog>
    )
}

export default TenantOnboardingModal
