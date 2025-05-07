/**
 * frontend/src/app/(protected-pages)/layout.tsx
 * Layout principal para páginas protegidas post-login.
 * Incluye el VerticalsProvider para inicializar módulos de verticales.
 * @version 1.1.0
 * @updated 2025-04-30
 */

'use client';

import React from 'react'
import PostLoginLayout from '@/components/layouts/PostLoginLayout'
import { ReactNode } from 'react'
import VerticalsProvider from '@/components/providers/core/VerticalsProvider'

const Layout = ({ children }: { children: ReactNode }) => {
    return (
        <VerticalsProvider>
            <PostLoginLayout>{children}</PostLoginLayout>
        </VerticalsProvider>
    )
}

export default Layout
