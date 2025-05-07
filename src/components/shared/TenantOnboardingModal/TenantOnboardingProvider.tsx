/**
 * frontend/src/components/shared/TenantOnboardingModal/TenantOnboardingProvider.tsx
 * Proveedor que controla la lógica de mostrar el modal de onboarding para tenants nuevos.
 * Detecta si es el primer inicio de sesión después del registro y muestra el modal automáticamente.
 * @version 1.1.0
 * @updated 2025-03-22
 */

'use client'

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import TenantOnboardingModal from './TenantOnboardingModal'
import useCurrentSession from '@/utils/hooks/useCurrentSession'
import { createTenant } from '@/server/actions/tenant/createTenant'

// Tipo para los datos del tenant
interface TenantFormData {
    businessName: string
    industry: string
    phoneNumber: string
    timezone: string
    currency: string
    subscriptionPlan: 'free' | 'basic' | 'pro'
}

// Contexto para el onboarding
interface TenantOnboardingContextProps {
    showOnboardingModal: () => void
    hideOnboardingModal: () => void
    isCompleted: boolean
}

const TenantOnboardingContext = createContext<TenantOnboardingContextProps>({
    showOnboardingModal: () => {},
    hideOnboardingModal: () => {},
    isCompleted: false,
})

export const useTenantOnboarding = () => useContext(TenantOnboardingContext)

interface TenantOnboardingProviderProps {
    children: ReactNode
}

export const TenantOnboardingProvider = ({
    children,
}: TenantOnboardingProviderProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isCompleted, setIsCompleted] = useState(true) // Asumimos completado por defecto
    const { session } = useCurrentSession()
    const router = useRouter()
    const pathname = usePathname()

    // Verificar si el usuario tiene tenant_id
    const hasTenant = !!session?.user?.tenant_id

    useEffect(() => {
        // Verificar si el usuario está autenticado y necesita completar el onboarding
        const checkOnboardingStatus = () => {
            if (pathname === '/home' && session?.user) {
                // Verificar si el usuario es tenant_admin
                const isTenantAdmin = session.user.role === 'tenant_admin'

                // También verificar si el rol está en la propiedad authority (para compatibilidad)
                const hasAdminAuthority =
                    session.user.authority &&
                    Array.isArray(session.user.authority) &&
                    session.user.authority.includes('tenant_admin')

                console.log('Usuario actual:', session.user)
                console.log('Es tenant_admin (role):', isTenantAdmin)
                console.log('Es tenant_admin (authority):', hasAdminAuthority)
                console.log('Tiene tenant:', hasTenant)

                // Mostrar el modal si el usuario es tenant_admin (por role o authority) y no tiene tenant
                if ((isTenantAdmin || hasAdminAuthority) && !hasTenant) {
                    console.log(
                        'Usuario tenant_admin sin tenant. Mostrando modal.',
                    )
                    setIsCompleted(false)
                    setIsModalOpen(true)
                }
            }
        }

        checkOnboardingStatus()
    }, [pathname, session, hasTenant])

    const showOnboardingModal = () => {
        setIsModalOpen(true)
    }

    const hideOnboardingModal = () => {
        setIsModalOpen(false)
    }

    const handleOnboardingComplete = async (tenantData: TenantFormData) => {
        try {
            if (!session?.user?.id) {
                throw new Error('No se pudo obtener el ID de usuario')
            }

            // Crear el tenant en la base de datos
            await createTenant({
                name: tenantData.businessName,
                industry: tenantData.industry,
                phone: tenantData.phoneNumber,
                timezone: tenantData.timezone,
                currency: tenantData.currency,
                subscriptionPlan: tenantData.subscriptionPlan,
                userId: session.user.id,
            })

            // Marcar como completado
            setIsCompleted(true)

            // Redirigir al home para refrescar la sesión con la nueva información del tenant
            router.refresh()
        } catch (error) {
            console.error('Error al completar onboarding:', error)
            throw error // Re-lanzar para que el modal pueda mostrar el error
        }
    }

    return (
        <TenantOnboardingContext.Provider
            value={{
                showOnboardingModal,
                hideOnboardingModal,
                isCompleted,
            }}
        >
            {children}

            {/* 
              Botón de depuración - solo visible en desarrollo, en la ruta /home 
              y cuando el usuario NO tiene un tenant_id asignado
            */}
            {process.env.NODE_ENV !== 'production' &&
                pathname === '/home' &&
                !hasTenant && (
                    <div className="fixed bottom-4 right-4 z-50">
                        <button
                            onClick={showOnboardingModal}
                            className="bg-primary text-white px-4 py-2 rounded-md shadow-md text-sm"
                        >
                            Abrir Onboarding
                        </button>
                    </div>
                )}

            <TenantOnboardingModal
                isOpen={isModalOpen}
                onClose={hideOnboardingModal}
                onComplete={handleOnboardingComplete}
            />
        </TenantOnboardingContext.Provider>
    )
}

export default TenantOnboardingProvider
