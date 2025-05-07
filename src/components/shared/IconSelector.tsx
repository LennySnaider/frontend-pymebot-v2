/**
 * frontend/src/components/shared/IconSelector.tsx
 * Componente para seleccionar íconos comunes de la aplicación
 * @version 1.0.0
 * @updated 2025-05-01
 */

'use client'

import React, { useState } from 'react'
import { Card, Input, Button } from '@/components/ui'
import classNames from 'classnames'

// Importar íconos individualmente para asegurar que existen
import {
  PiQuestion,
  PiMagnifyingGlass,
  PiBuildings,
  PiBuilding,
  PiHouse,
  PiStorefront,
  PiUser,
  PiUsers,
  PiCalendar,
  PiClock,
  PiTag,
  PiStar,
} from 'react-icons/pi'

// Tipos de íconos disponibles
interface IconOption {
    name: string
    Component: React.ComponentType<any>
}

// Propiedades del componente
interface IconSelectorProps {
    selectedIcon: string
    onSelectIcon: (iconName: string) => void
    size?: 'sm' | 'md' | 'lg'
}

const IconSelector = ({ selectedIcon, onSelectIcon, size = 'md' }: IconSelectorProps) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [showSelector, setShowSelector] = useState(false)
    
    // Iconos comunes usados en la aplicación (versión simplificada)
    const commonIcons: IconOption[] = [
        { name: 'buildings', Component: PiBuildings },
        { name: 'building', Component: PiBuilding },
        { name: 'house', Component: PiHouse },
        { name: 'storefront', Component: PiStorefront },
        { name: 'user', Component: PiUser },
        { name: 'users', Component: PiUsers },
        { name: 'calendar', Component: PiCalendar },
        { name: 'clock', Component: PiClock },
        { name: 'tag', Component: PiTag },
        { name: 'star', Component: PiStar },
    ]
    
    // Filtrar íconos por término de búsqueda
    const filteredIcons = searchTerm
        ? commonIcons.filter(icon => 
            icon.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : commonIcons
    
    // Tamaños de íconos
    const iconSizes = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl'
    }
    
    // Función para renderizar el ícono seleccionado
    const renderSelectedIcon = () => {
        const iconOption = commonIcons.find(icon => icon.name === selectedIcon)
        if (iconOption) {
            const IconComponent = iconOption.Component
            return <IconComponent className={classNames(iconSizes[size], 'mr-2')} />
        }
        // Retornar un ícono por defecto si no se encuentra el seleccionado
        return <PiQuestion className={classNames(iconSizes[size], 'mr-2')} />
    }
    
    return (
        <div>
            <Button
                variant="default"
                className="w-full justify-start"
                onClick={(e) => {
                    // Evitar propagación del evento para que no cierre el modal principal
                    e.stopPropagation()
                    setShowSelector(!showSelector)
                }}
            >
                {renderSelectedIcon()}
                {selectedIcon || 'Seleccionar ícono'}
            </Button>
            
            {showSelector && (
                <Card className="mt-2 p-3" bordered onClick={(e) => e.stopPropagation()}>
                    <div className="mb-3">
                        <Input
                            prefix={<PiMagnifyingGlass />}
                            size="sm"
                            placeholder="Buscar ícono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto">
                        <div className="grid grid-cols-5 gap-2">
                            {filteredIcons.map((icon) => {
                                const IconComponent = icon.Component
                                return (
                                    <div
                                        key={icon.name}
                                        className={classNames(
                                            'p-2 flex flex-col items-center justify-center text-center cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                                            selectedIcon === icon.name && 'bg-primary-50 dark:bg-primary-900/20 border border-primary-500'
                                        )}
                                        onClick={(e) => {
                                            // Evitar propagación del evento para que no cierre el modal principal
                                            e.stopPropagation()
                                            
                                            // Llamar a la función de selección y cerrar el selector de íconos
                                            onSelectIcon(icon.name)
                                            setShowSelector(false)
                                        }}
                                    >
                                        <div className={classNames(iconSizes[size], 'mb-1')}>
                                            <IconComponent />
                                        </div>
                                        <div className="truncate text-xs w-full">
                                            {icon.name}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        
                        {filteredIcons.length === 0 && (
                            <div className="text-center text-gray-500 p-4">
                                No se encontraron íconos coincidentes
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    )
}

export default IconSelector
