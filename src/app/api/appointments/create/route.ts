/**
 * API endpoint para crear citas
 * Este endpoint recibe los datos de una cita y la crea en la base de datos
 * Utilizado por el salesfunnel para programar citas cuando un lead se mueve a la columna "confirmed"
 * 
 * @version 1.0.0
 * @updated 2025-04-28
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAppointment } from '@/server/actions/appointments/createAppointment'

export async function POST(request: NextRequest) {
  try {
    // Extraer los datos de la cita del cuerpo de la solicitud
    const appointmentData = await request.json()

    // Validar los datos esenciales
    if (!appointmentData.lead_id) {
      console.error('Error en API appointments/create: lead_id faltante', appointmentData);
      return NextResponse.json(
        { error: 'El ID del lead es requerido' },
        { status: 400 }
      )
    }

    if (!appointmentData.appointment_date || !appointmentData.appointment_time) {
      console.error('Error en API appointments/create: fecha/hora faltante', appointmentData);
      return NextResponse.json(
        { error: 'La fecha y hora de la cita son requeridos' },
        { status: 400 }
      )
    }

    console.log(`API appointments/create: Creando cita para lead: ${appointmentData.lead_id}`);

    // Llamar a la acción del servidor para crear la cita
    const result = await createAppointment(appointmentData)

    // Responder con éxito
    console.log(`API appointments/create: Cita creada exitosamente, ID: ${result?.id}`);
    return NextResponse.json(
      result,
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}