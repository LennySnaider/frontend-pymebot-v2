import { NextRequest, NextResponse } from 'next/server'
import getServerSession from '@/server/actions/auth/getServerSession'
import { getTenantFromSession } from '@/server/actions/tenant/getTenantFromSession'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession()
        const tenant_id = await getTenantFromSession()
        
        return NextResponse.json({
            session: {
                user_id: session?.user?.id,
                role: session?.user?.role,
                tenant_id: session?.user?.tenant_id,
            },
            resolved_tenant_id: tenant_id,
            env_default_tenant: process.env.DEFAULT_TENANT_ID,
        })
    } catch (error) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 })
    }
}