/**
 * API endpoint para actualizar citas existentes
 * Este endpoint recibe los datos de una cita y la actualiza en la base de datos
 * Utilizado por el salesfunnel para reprogramar citas de leads en la columna "confirmed"
 * 
 * @version 1.0.0
 * @updated 2025-04-28
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateAppointment } from '@/server/actions/appointments/updateAppointment'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = String(params?.id || '')
    
    // Validar que el ID existe
    if (!id) {
      console.error('Error en API appointments/update: ID faltante en URL');
      return NextResponse.json(
        { error: 'ID de cita requerido' },
        { status: 400 }
      )
    }

    // Extraer los datos de actualización
    const appointmentData = await request.json()

    // Validar datos mínimos
    if (!appointmentData) {
      console.error('Error en API appointments/update: Datos faltantes', appointmentData);
      return NextResponse.json(
        { error: 'Datos de cita requeridos' },
        { status: 400 }
      )
    }

    console.log(`API appointments/update: Actualizando cita ID: ${id}`);

    // Llamar a la acción del servidor para actualizar la cita
    const result = await updateAppointment(id, appointmentData)

    // Responder con éxito
    console.log(`API appointments/update: Cita actualizada exitosamente, ID: ${id}`);
    return NextResponse.json(
      result,
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}