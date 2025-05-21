import { NextRequest, NextResponse } from 'next/server';

// Endpoint de diagnóstico para verificar la conexión con el backend
export async function GET(request: NextRequest) {
  try {
    // URL del backend - asumimos que está corriendo en puerto 3090
    const backendUrl = 'http://localhost:3090/api/templates';
    
    console.log(`Intentando conexión con backend en: ${backendUrl}`);
    
    // Intentar conexión con el backend
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        // Añadir encabezado de autenticación si es necesario
        'Authorization': 'Bearer desarrollo' // Token básico para modo desarrollo
      },
    });
    
    const status = response.status;
    let data;
    
    try {
      data = await response.json();
    } catch (e) {
      data = { error: 'No se pudo parsear la respuesta como JSON' };
    }
    
    return NextResponse.json({
      conexion: 'exitosa',
      status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
      url: backendUrl
    });
  } catch (error) {
    console.error('Error al conectar con el backend:', error);
    
    return NextResponse.json({
      conexion: 'fallida',
      error: error instanceof Error ? error.message : 'Error desconocido',
      url: 'http://localhost:3090/api/templates'
    }, { status: 500 });
  }
}