/**
 * frontend/src/app/(protected-pages)/superadmin/verticals-manager/page.tsx
 * Página para gestión de verticales y tipos de verticales (SUPERADMIN)
 * @version 1.1.0
 * @updated 2025-05-01
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HeaderBreadcrumbs from '@/components/shared/HeaderBreadcrumbs'
import { Spinner, Tabs } from '@/components/ui'
import { useTranslation } from '@/utils/hooks/useTranslation'
import useCurrentSession from '@/utils/hooks/useCurrentSession'
import VerticalsManager from './_components/VerticalsManager'
import VerticalTypesManager from './_components/VerticalTypesManager'
import { useVerticalsStore } from '@/app/(protected-pages)/superadmin/subscription-plans/_store/verticalsStore'

const VerticalsManagerPage = () => {
    const navT = useTranslation('nav')
    const router = useRouter()
    const { session } = useCurrentSession()
    const [authLoading, setAuthLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('verticals')
    
    const { verticals, loading, fetchVerticals } = useVerticalsStore()

    // Efecto para simular el estado de carga inicial
    useEffect(() => {
        // Simulamos una breve carga para dar tiempo a que session se inicialice
        const timer = setTimeout(() => {
            setAuthLoading(false)
        }, 500)

        return () => clearTimeout(timer)
    }, [])
    
    // Cargar verticales
    useEffect(() => {
        if (!authLoading && session) {
            fetchVerticals()
        }
    }, [authLoading, session, fetchVerticals])

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
    
    // Opciones de pestañas
    const tabOptions = [
        {
            value: 'verticals',
            label: 'Verticales',
            component: <VerticalsManager />
        },
        {
            value: 'types',
            label: 'Tipos de Verticales',
            component: <VerticalTypesManager verticals={verticals} />
        }
    ]

    return (
        <>
            <HeaderBreadcrumbs
                heading="Gestión de Verticales"
                links={[
                    { name: navT('dashboard.dashboard'), href: '/home' },
                    { name: navT('superadmin.tools') },
                    { name: 'Gestión de Verticales' },
                ]}
            />

            <div className="mt-4">
                <Tabs
                    value={activeTab}
                    onChange={(val) => setActiveTab(val as string)}
                    variant="pill"
                >
                    <Tabs.TabList>
                        {tabOptions.map((tab) => (
                            <Tabs.TabNav key={tab.value} value={tab.value}>
                                {tab.label}
                            </Tabs.TabNav>
                        ))}
                    </Tabs.TabList>
                    <div className="mt-4">
                        {tabOptions.map((tab) => (
                            <Tabs.TabContent key={tab.value} value={tab.value}>
                                {loading && tab.value === 'types' ? (
                                    <div className="flex justify-center items-center p-8">
                                        <Spinner size={40} />
                                    </div>
                                ) : (
                                    tab.component
                                )}
                            </Tabs.TabContent>
                        ))}
                    </div>
                </Tabs>
            </div>
        </>
    )
}

export default VerticalsManagerPage
