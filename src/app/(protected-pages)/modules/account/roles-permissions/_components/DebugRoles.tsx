'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabase/SupabaseClient'

export default function DebugRoles() {
    const [roles, setRoles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    useEffect(() => {
        async function fetchRoles() {
            try {
                const { data, error } = await supabase
                    .from('roles')
                    .select('*')
                    .order('name')
                
                if (error) {
                    setError(error.message)
                } else {
                    setRoles(data || [])
                }
            } catch (err) {
                setError(String(err))
            } finally {
                setLoading(false)
            }
        }
        
        fetchRoles()
    }, [])
    
    if (loading) return <div>Loading roles...</div>
    if (error) return <div>Error: {error}</div>
    
    return (
        <div className="bg-blue-100 p-2 rounded text-sm mb-4">
            <h4 className="font-bold">Debug - All Roles in Database:</h4>
            <ul>
                {roles.map(role => (
                    <li key={role.id}>
                        {role.name} - {role.description}
                    </li>
                ))}
            </ul>
            <p>Total roles: {roles.length}</p>
        </div>
    )
}