'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/toast'
import { Notification } from '@/components/ui/Notification'
import { useRouter } from 'next/navigation'

export default function ImportLeadsPage() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    
    const createSampleLeads = async () => {
        setIsLoading(true)
        
        try {
            const response = await fetch('/api/create-sample-leads', {
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
            
            // Redirigir al funnel después de 1 segundo
            setTimeout(() => {
                router.push('/modules/leads/leads-scrum')
            }, 1000)
            
        } catch (error: any) {
            toast.push(
                <Notification title="Error" type="danger">
                    {error.message || 'Error al crear leads'}
                </Notification>
            )
        } finally {
            setIsLoading(false)
        }
    }
    
    return (
        <div className="container mx-auto py-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Importar Leads</h1>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Crear Leads de Muestra</h2>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Esto creará 4 leads de muestra en diferentes etapas del funnel
                        (new, prospecting, qualification, opportunity) para tu tenant actual.
                    </p>
                    
                    <Button
                        variant="solid"
                        loading={isLoading}
                        onClick={createSampleLeads}
                    >
                        Crear Leads de Muestra
                    </Button>
                </div>
            </div>
        </div>
    )
}