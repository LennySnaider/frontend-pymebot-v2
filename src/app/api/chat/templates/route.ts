/**
 * Endpoint para devolver un error 404 en la carga de plantillas
 * Este endpoint está configurado para mostrar claramente el error que ocurre en producción
 * 
 * @version 1.0.0
 * @updated 2025-05-20
 */

import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  console.error('API: Endpoint temporal de plantillas accedido - DEVOLVIENDO ERROR');
  
  // Devolver error 404 para ver el problema real
  return new NextResponse(
    JSON.stringify({ error: 'Plantillas no encontradas' }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}