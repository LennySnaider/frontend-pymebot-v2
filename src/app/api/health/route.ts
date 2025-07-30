import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Application is running without infinite loops',
    timestamp: new Date().toISOString()
  });
}