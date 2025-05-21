'use client'

import { useAuthContext } from '@/components/providers/AuthProvider'

export default function DebugUserRole() {
    const { role } = useAuthContext()
    
    return (
        <div className="bg-yellow-100 p-2 rounded text-sm">
            Current user role: {role || 'undefined'}
        </div>
    )
}