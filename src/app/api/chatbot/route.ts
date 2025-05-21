/**
 * API para diagnosticar conexión con backend
 * Este endpoint ayuda a identificar problemas con la conexión al backend
 * 
 * @version 1.0.0
 * @updated 2025-05-20
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3090';
  
  console.log(`Probando conexión con backend en: ${backendUrl}`);
  
  try {
    // Intentar conectar con el backend real
    const response = await fetch(`${backendUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      // Tiempo máximo para la respuesta: 5 segundos
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json();
      
      return NextResponse.json({
        status: 'Backend conectado correctamente',
        url: backendUrl,
        healthCheck: data,
        env: process.env.NODE_ENV
      });
    } else {
      return NextResponse.json({
        status: 'Error con backend',
        url: backendUrl,
        statusCode: response.status,
        statusText: response.statusText,
        error: `El backend respondió con un error: ${response.status} ${response.statusText}`
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'Error de conexión con backend',
      url: backendUrl,
      error: error instanceof Error ? error.message : 'Error desconocido',
      env: process.env.NODE_ENV
    }, { status: 500 });
  }
}