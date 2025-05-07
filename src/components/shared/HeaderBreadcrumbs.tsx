/**
 * frontend/src/components/shared/HeaderBreadcrumbs.tsx
 * Componente de header con breadcrumbs para la navegación
 * @version 1.1.0
 * @updated 2025-04-09
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { PiCaretRightBold, PiHouseBold } from 'react-icons/pi'

interface HeaderBreadcrumbsProps {
    heading: string
    links?: { name: string; href?: string }[]
    action?: React.ReactNode
    className?: string
    Icon?: React.ReactNode
}

const HeaderBreadcrumbs: React.FC<HeaderBreadcrumbsProps> = ({
    heading,
    links = [],
    action,
    className = '',
    Icon,
}) => {
    return (
        <div className={`mb-6 ${className}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center">
                        {Icon && <span className="mr-2 text-xl">{Icon}</span>}
                        {heading}
                    </h1>
                    {links.length > 0 && (
                        <nav className="flex" aria-label="Breadcrumb">
                            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                                {links.map((link, index) => {
                                    const isLast = index === links.length - 1

                                    return (
                                        <li
                                            key={link.name}
                                            className="inline-flex items-center"
                                        >
                                            {index > 0 && (
                                                <PiCaretRightBold className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mx-1" />
                                            )}
                                            {link.href && !isLast ? (
                                                <Link
                                                    href={link.href}
                                                    className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light"
                                                >
                                                    {index === 0 && (
                                                        <PiHouseBold className="w-4 h-4 mr-1" />
                                                    )}
                                                    {link.name}
                                                </Link>
                                            ) : (
                                                <span
                                                    className={`inline-flex items-center text-sm font-medium ${isLast ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}
                                                >
                                                    {index === 0 &&
                                                        !link.href && (
                                                            <PiHouseBold className="w-4 h-4 mr-1" />
                                                        )}
                                                    {link.name}
                                                </span>
                                            )}
                                        </li>
                                    )
                                })}
                            </ol>
                        </nav>
                    )}
                </div>
                {action && <div className="mt-4 md:mt-0">{action}</div>}
            </div>
        </div>
    )
}

export default HeaderBreadcrumbs
