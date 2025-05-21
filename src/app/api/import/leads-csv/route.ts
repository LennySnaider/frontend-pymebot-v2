import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import fs from 'fs/promises'
import path from 'path'
import Papa from 'papaparse'

// Installar papaparse si no está instalado: npm install papaparse @types/papaparse

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        
        if (!session || !session.user || session.user.role !== 'super_admin') {
            return NextResponse.json(
                { error: 'Solo super admin puede importar' },
                { status: 403 }
            )
        }
        
        // Crear cliente con service role
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )
        
        // Ruta al archivo CSV
        const csvPath = path.join(process.cwd(), '../../leads_rows (2).csv')
        
        try {
            // Leer el archivo CSV
            const csvContent = await fs.readFile(csvPath, 'utf-8')
            
            // Parsear el CSV
            const { data, errors } = Papa.parse(csvContent, {
                header: true,
                skipEmptyLines: true
            })
            
            if (errors.length > 0) {
                console.error('Errores parseando CSV:', errors)
                return NextResponse.json(
                    { error: 'Error parseando CSV', details: errors },
                    { status: 400 }
                )
            }
            
            console.log('Leads encontrados en CSV:', data.length)
            console.log('Muestra del primer lead:', data[0])
            
            // Procesar los leads para Supabase
            const leadsToInsert = data.map((row: any) => {
                // Ajustar campos según tu CSV
                return {
                    id: row.id,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    tenant_id: row.tenant_id,
                    full_name: row.full_name,
                    email: row.email,
                    phone: row.phone,
                    source: row.source || 'csv_import',
                    stage: row.stage || 'new',
                    status: row.status || 'active',
                    interest_level: row.interest_level || 'medio',
                    property_type: row.property_type,
                    budget_min: row.budget_min ? parseFloat(row.budget_min) : null,
                    budget_max: row.budget_max ? parseFloat(row.budget_max) : null,
                    bedrooms_needed: row.bedrooms_needed ? parseInt(row.bedrooms_needed) : null,
                    bathrooms_needed: row.bathrooms_needed ? parseInt(row.bathrooms_needed) : null,
                    description: row.description,
                    notes: row.notes,
                    metadata: row.metadata ? JSON.parse(row.metadata) : {},
                    agent_id: row.agent_id,
                    last_contact_date: row.last_contact_date,
                    next_contact_date: row.next_contact_date,
                    contact_count: row.contact_count ? parseInt(row.contact_count) : 0,
                }
            }).filter(lead => lead.tenant_id) // Solo incluir leads con tenant_id
            
            console.log('Leads procesados para insertar:', leadsToInsert.length)
            
            // Insertar en lotes de 100
            const batchSize = 100
            let inserted = 0
            
            for (let i = 0; i < leadsToInsert.length; i += batchSize) {
                const batch = leadsToInsert.slice(i, i + batchSize)
                
                const { error } = await supabase
                    .from('leads')
                    .upsert(batch, { onConflict: 'id' })
                
                if (error) {
                    console.error('Error insertando batch:', error)
                    return NextResponse.json(
                        { error: 'Error insertando leads', details: error },
                        { status: 400 }
                    )
                }
                
                inserted += batch.length
                console.log(`Insertados ${inserted} de ${leadsToInsert.length} leads`)
            }
            
            return NextResponse.json({
                success: true,
                message: `${inserted} leads importados exitosamente`,
                total: inserted
            })
            
        } catch (fileError: any) {
            console.error('Error leyendo archivo:', fileError)
            return NextResponse.json(
                { 
                    error: 'No se pudo leer el archivo CSV', 
                    details: fileError.message,
                    path: csvPath 
                },
                { status: 400 }
            )
        }
        
    } catch (error: any) {
        console.error('Error importando leads:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno' },
            { status: 500 }
        )
    }
}