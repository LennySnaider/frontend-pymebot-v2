'use client'

import { useState, useEffect } from 'react'
import Switcher from '@/components/ui/Switcher'
import Select from '@/components/ui/Select'
import usePermissions from '@/lib/core/permissions'
import useDemoMode from '@/hooks/core/useDemoMode'
import { useTenantStore } from '@/stores/core/tenantStore'
import { useRouter } from 'next/navigation'
import { Tag } from '@/components/ui'

const DemoModeSwitcher = () => {
    const { role } = usePermissions()
    const router = useRouter()
    const { currentTenant } = useTenantStore()
    
    // Solo mostrar para super_admin
    const canShowDemo = role === 'super_admin'
    
    const {
        isEnabled,
        toggleDemoMode,
        changePlan,
        changeVertical,
        getAvailablePlans,
        getAvailableVerticals,
        PLANS
    } = useDemoMode()
    
    const [selectedPlan, setSelectedPlan] = useState<string>('professional')
    const [selectedVertical, setSelectedVertical] = useState<string>('medicina')
    const [availableVerticals, setAvailableVerticals] = useState<string[]>([])
    
    // Sincronizar estado con servicio demo
    useEffect(() => {
        if (isEnabled) {
            // Forzar un pequeño delay para que el cambio de plan se aplique primero
            setTimeout(() => {
                const verticals = getAvailableVerticals() || []
                console.log('Verticales disponibles:', verticals)
                setAvailableVerticals(verticals)
                
                if (verticals.length > 0 && !verticals.includes(selectedVertical)) {
                    setSelectedVertical(verticals[0])
                }
            }, 100)
        }
    }, [isEnabled, selectedPlan])
    
    // Manejar cambio de estado Demo
    const handleToggleDemo = (checked: boolean) => {
        toggleDemoMode(checked)
        
        if (checked) {
            setSelectedPlan('professional')
            
            // Añadimos un pequeño retraso para permitir que el plan se actualice
            setTimeout(() => {
                // Actualizar verticales disponibles
                const verticals = getAvailableVerticals() || []
                console.log('Activación: Verticales disponibles:', verticals)
                setAvailableVerticals(verticals)
                
                if (verticals && verticals.length > 0) {
                    setSelectedVertical(verticals[0])
                }
            }, 100)
        }
    }
    
    // Manejar cambio de plan
    const handlePlanChange = (value: string) => {
        setSelectedPlan(value)
        changePlan(value as any)
        
        // Utilizamos un pequeño delay para permitir que el cambio de plan se aplique
        setTimeout(() => {
            // Actualizar verticales disponibles
            const verticals = getAvailableVerticals() || []
            console.log('Verticales después de cambio de plan:', verticals)
            setAvailableVerticals(verticals)
            
            // Si la vertical actual no está disponible, seleccionar la primera
            if (verticals && verticals.length > 0 && !verticals.includes(selectedVertical)) {
                setSelectedVertical(verticals[0])
            }
        }, 100)
    }
    
    // Manejar cambio de vertical
    const handleVerticalChange = (value: string) => {
        setSelectedVertical(value)
        if (changeVertical(value)) {
            router.push(`/vertical-${value}`)
        }
    }
    
    if (!canShowDemo) {
        return null
    }
    
    return (
        <div>
            <Switcher
                checked={isEnabled}
                onChange={handleToggleDemo}
                color="amber"
            />
            
            {isEnabled && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-600 pt-4 space-y-4">
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Plan:</div>
                        <Select
                            value={selectedPlan}
                            onChange={handlePlanChange}
                            size="sm"
                            className="w-full"
                        >
                            {Object.entries(PLANS).map(([key, plan]) => (
                                <option key={key} value={key}>
                                    {plan.name}
                                </option>
                            ))}
                        </Select>
                        
                        <div className="flex flex-wrap gap-1 mt-1">
                            {selectedPlan && PLANS[selectedPlan]?.limits && (
                                <>
                                    <Tag size="sm">
                                        {PLANS[selectedPlan].limits?.users} Usuarios
                                    </Tag>
                                    <Tag size="sm">
                                        {PLANS[selectedPlan].limits?.storage} GB
                                    </Tag>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {availableVerticals.length > 0 && (
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Vertical:</div>
                            <Select
                                value={selectedVertical}
                                onChange={handleVerticalChange}
                                size="sm"
                                className="w-full"
                            >
                                {availableVerticals.map((vertical) => (
                                    <option key={vertical} value={vertical}>
                                        {vertical.charAt(0).toUpperCase() + vertical.slice(1)}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default DemoModeSwitcher