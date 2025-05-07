/**
 * frontend/src/components/layouts/admin/AdminLayout.tsx
 * Layout para páginas de administración con estructura estándar
 * @version 1.0.1
 * @updated 2025-05-02
 */

'use client'

import React, { ReactNode } from 'react'

interface AdminLayoutProps {
    children: ReactNode
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
    return (
        <div className="admin-layout h-full">
            {children}
        </div>
    )
}

export default AdminLayout
