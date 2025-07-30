import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/services/auth/authService'

export async function GET(request: NextRequest) {
  try {
    // Obtener la sesión del servicio personalizado
    const session = await AuthService.getSession()
    
    if (!session) {
      return NextResponse.json(null, { status: 401 })
    }
    
    return NextResponse.json({
      user: session.user,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    })
  } catch (error) {
    console.error('Error in custom session endpoint:', error)
    return NextResponse.json(null, { status: 500 })
  }
}