/**
 * frontend/src/components/shared/PageHeader.tsx
 * Componente de cabecera de página con título y descripción
 * @version 1.0.0
 * @created 2025-04-10
 */

import React from 'react'

interface PageHeaderProps {
    title: string
    description?: string
    children?: React.ReactNode
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, children }) => {
    return (
        <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
                    {description && (
                        <p className="mt-1 text-gray-500 dark:text-gray-400">{description}</p>
                    )}
                </div>
                {children && <div className="mt-4 md:mt-0">{children}</div>}
            </div>
        </div>
    )
}

export { PageHeader }
