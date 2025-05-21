import Container from '@/components/shared/Container'
import AgentProfileInfo from './_components/AgentProfileInfo'
import { auth } from '@/auth'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

export default async function AgentProfilePage() {
    const t = await getTranslations()
    const session = await auth()
    
    if (!session || !session.user) {
        redirect('/login')
    }
    
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Verificar que el usuario sea un agente
    const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()
    
    if (!user || user.role !== 'agent') {
        // Si no es agente, redireccionar al dashboard principal
        redirect('/modules/account/dashboard')
    }
    
    // Obtener datos del agente
    const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
    
    // Obtener datos del usuario completos
    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
    
    return (
        <Container className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <div className="mb-6">
                <h3>{t('agents.myProfile')}</h3>
            </div>
            <AgentProfileInfo agent={agent} user={userData} />
        </Container>
    )
}