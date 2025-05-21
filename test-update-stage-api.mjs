import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const FRONTEND_URL = 'http://localhost:3000';
const leadId = '08f89f3e-7441-4c99-96e4-745d813b9d09'; // ID real de Carolina López
const newStage = 'prospecting';

async function testUpdateStageAPI() {
  console.log('[TEST] Probando endpoint /api/leads/update-stage');
  console.log('[TEST] Lead ID:', leadId);
  console.log('[TEST] Nueva etapa:', newStage);
  
  try {
    // Llamar al endpoint de la API
    const response = await fetch(`${FRONTEND_URL}/api/leads/update-stage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leadId,
        newStage,
        fromChatbot: true
      })
    });
    
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('[TEST] Error parseando respuesta:', text);
      return;
    }
    
    console.log('[TEST] Respuesta status:', response.status);
    console.log('[TEST] Respuesta data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('[TEST] ✅ Actualización exitosa');
      
      // Verificar en la base de datos
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: updatedLead, error } = await supabase
        .from('leads')
        .select('id, full_name, stage')
        .eq('id', leadId)
        .single();
      
      if (error) {
        console.error('[TEST] Error verificando en DB:', error);
      } else {
        console.log('[TEST] Estado actual en DB:');
        console.log('  - ID:', updatedLead.id);
        console.log('  - Nombre:', updatedLead.full_name);
        console.log('  - Stage:', updatedLead.stage);
      }
    } else {
      console.error('[TEST] ❌ Error en actualización');
    }
    
  } catch (error) {
    console.error('[TEST] Error general:', error);
  }
}

testUpdateStageAPI();