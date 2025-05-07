/**
 * frontend/src/app/(protected-pages)/modules/appointments/page.tsx
 * Página principal para el concepto de citas con redirección a la vista de calendario por defecto.
 * @version 1.1.0
 * @updated 2025-07-04
 */

import { redirect } from 'next/navigation'

export default function AppointmentsPage() {
    redirect('/modules/appointments/calendar-view')
}