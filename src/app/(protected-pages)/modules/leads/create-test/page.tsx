'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/toast'
import { Notification } from '@/components/ui/Notification'
import { useRouter } from 'next/navigation'

export default function CreateTestLeadsPage() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    
    const createTestLeads = async () => {
        setIsLoading(true)
        
        try {
            const response = await fetch('/api/leads/create-test-leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al crear leads')
            }
            
            toast.push(
                <Notification title="Éxito" type="success">
                    {data.message}
                </Notification>
            )
            
            // Redirigir al funnel de ventas
            setTimeout(() => {
                router.push('/modules/leads/leads-scrum')
            }, 1000)
            
        } catch (error: any) {
            toast.push(
                <Notification title="Error" type="danger">
                    {error.message || 'Error al crear leads de prueba'}
                </Notification>
            )
        } finally {
            setIsLoading(false)
        }
    }
    
    return (
        <div className="container mx-auto py-8">
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-4">Crear Leads de Prueba</h1>
                
                <p className="text-gray-600 dark:bg-gray-400 mb-6">
                    Esta página creará 4 leads de prueba en diferentes etapas del funnel
                    para tu tenant actual.
                </p>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold mb-2">Se crearán los siguientes leads:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Juan Pérez - Etapa: Nuevo</li>
                        <li>María García - Etapa: Prospectando</li>
                        <li>Carlos Rodríguez - Etapa: Calificación</li>
                        <li>Ana Martínez - Etapa: Oportunidad</li>
                    </ul>
                </div>
                
                <Button
                    variant="solid"
                    className="w-full"
                    loading={isLoading}
                    onClick={createTestLeads}
                >
                    Crear Leads de Prueba
                </Button>
                
                <div className="mt-4">
                    <Button
                        variant="default"
                        className="w-full"
                        onClick={() => router.push('/modules/leads/leads-scrum')}
                    >
                        Ir al Funnel de Ventas
                    </Button>
                </div>
            </div>
        </div>
    )
}