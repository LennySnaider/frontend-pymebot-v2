'use client'

/**
 * frontend/src/components/auth/AuthProvider/AuthProvider.tsx
 * Proveedor de autenticación que integra NextAuth con nuestro sistema de permisos
 * y control de acceso a verticales y módulos.
 * 
 * @version 2.0.0
 * @updated 2025-04-30
 */

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import SessionContext from './SessionContext'
import { AuthProvider as CustomAuthProvider } from '@/components/providers/AuthProvider';
import type { Session as NextAuthSession } from 'next-auth'

type Session = NextAuthSession | null

type AuthProviderProps = {
    session: Session | null
    children: React.ReactNode
}

const AuthProvider = (props: AuthProviderProps) => {
    const { session, children } = props

    return (
        // Mantener el proveedor original de NextAuth para compatibilidad
        <NextAuthSessionProvider session={session} refetchOnWindowFocus={false}>
            {/* Mantener el contexto de sesión original para compatibilidad con código existente */}
            <SessionContext.Provider value={session}>
                {/* Integrar nuestro nuevo proveedor de autenticación con permisos */}
                <CustomAuthProvider>
                    {children}
                </CustomAuthProvider>
            </SessionContext.Provider>
        </NextAuthSessionProvider>
    )
}

export default AuthProvider
