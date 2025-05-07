/**
 * frontend/src/app/layout.tsx
 * Layout principal con integración del TenantOnboardingProvider
 * @version 1.0.0
 * @updated 2025-03-22
 */

import { auth } from '@/auth'
import AuthProvider from '@/components/auth/AuthProvider'
import LocaleProvider from '@/components/template/LocaleProvider'
import { getLocale, getMessages } from 'next-intl/server'
import ThemeProvider from '@/components/template/Theme/ThemeProvider'
import NavigationProvider from '@/components/template/Navigation/NavigationProvider'
import { getNavigation } from '@/server/actions/navigation/getNavigation'
import { getTheme } from '@/server/actions/theme'
import TenantOnboardingProvider from '@/components/shared/TenantOnboardingModal/TenantOnboardingProvider'
import type { ReactNode } from 'react'
import '@/assets/styles/app.css'
import pageMetaConfig from '@/configs/page-meta.config'

export const metadata = {
    ...pageMetaConfig,
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: ReactNode
}>) {
    const session = await auth()
    const locale = await getLocale()
    const messages = await getMessages()
    const navigationTree = await getNavigation()
    const theme = await getTheme()

    return (
        <AuthProvider session={session}>
            <html
                className={theme.mode === 'dark' ? 'dark' : 'light'}
                dir={theme.direction}
                suppressHydrationWarning
            >
                <body suppressHydrationWarning>
                    <LocaleProvider locale={locale} messages={messages}>
                        <ThemeProvider theme={theme}>
                            <NavigationProvider navigationTree={navigationTree}>
                                <TenantOnboardingProvider>
                                    {children}
                                </TenantOnboardingProvider>
                            </NavigationProvider>
                        </ThemeProvider>
                    </LocaleProvider>
                </body>
            </html>
        </AuthProvider>
    )
}
