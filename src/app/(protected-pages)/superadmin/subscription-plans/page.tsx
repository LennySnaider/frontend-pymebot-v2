/**
 * frontend/src/app/(protected-pages)/superadmin/subscription-plans/page.tsx
 * Página para gestión de módulos y planes de suscripción (SUPERADMIN)
 * @version 1.0.0
 * @created 2025-04-10
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HeaderBreadcrumbs from '@/components/shared/HeaderBreadcrumbs'
import { Spinner } from '@/components/ui'
import { useTranslation } from '@/utils/hooks/useTranslation'
import useCurrentSession from '@/utils/hooks/useCurrentSession'
import PlansTab from './_components/PlansTab'

const SubscriptionPlansPage = () => {
    const navT = useTranslation('nav')
    const router = useRouter()
    const { session } = useCurrentSession()
    const [authLoading, setAuthLoading] = useState(true)

    // Efecto para simular el estado de carga inicial
    useEffect(() => {
        // Simulamos una breve carga para dar tiempo a que session se inicialice
        const timer = setTimeout(() => {
            setAuthLoading(false)
        }, 500)

        return () => clearTimeout(timer)
    }, [])

    // Verificar que el usuario sea super_admin
    useEffect(() => {
        if (!authLoading && session) {
            console.log('Verificando rol:', session.user?.role)

            // Verificar el rol correcto (super_admin en minúsculas)
            const isSuperAdmin =
                session.user?.role === 'super_admin' ||
                session.user?.authority?.includes('super_admin')

            if (!isSuperAdmin) {
                // Redirigir a la página de inicio si no tiene permisos, ya que access-denied no existe
                console.log('Usuario no es super_admin, redirigiendo a home')
                router.push('/home')
                // También mostrar un mensaje al usuario
                alert('No tienes permiso para acceder a esta sección')
            } else {
                console.log('Usuario verificado como super_admin')
            }
        }
    }, [session, authLoading, router])

    // Mostrar spinner mientras se verifica la autorización
    if (authLoading || !session) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spinner size={40} />
            </div>
        )
    }

    return (
        <>
            <HeaderBreadcrumbs
                heading="Planes de Suscripción"
                links={[
                    { name: navT('dashboard.dashboard'), href: '/home' },
                    { name: navT('superadmin.tools') },
                    { name: 'Planes de Suscripción' },
                ]}
            />

            <div className="mt-4">
                <PlansTab />
            </div>
        </>
    )
}

export default SubscriptionPlansPage
