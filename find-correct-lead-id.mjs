/**
 * Buscar el ID correcto de Carolina López
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function findCorrectLeadId() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('\n=== BÚSQUEDA DE CAROLINA LÓPEZ ===');
  
  try {
    // Buscar por nombre
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, full_name, stage, created_at, updated_at')
      .ilike('full_name', '%Carolina López%');
    
    if (error) {
      console.error('Error al buscar:', error);
      return;
    }
    
    console.log(`\nEncontrados ${leads?.length || 0} leads con nombre Carolina López:\n`);
    
    leads?.forEach(lead => {
      console.log('ID:', lead.id);
      console.log('Nombre:', lead.full_name);
      console.log('Stage:', lead.stage);
      console.log('Creado:', lead.created_at);
      console.log('Actualizado:', lead.updated_at);
      console.log('---');
    });
    
    // También buscar leads con IDs cercanos
    const searchIds = [
      '08f89f3e-7441-4c99-96e4-745d813b9d09',
      'lead_08f89f3e-7441-4c99-96e4-745d813b9d09',
      '605ff65b-0920-480c-aace-0a3ca33b53ca'
    ];
    
    console.log('\n=== BÚSQUEDA POR IDS ===');
    
    for (const id of searchIds) {
      const { data: lead, error } = await supabase
        .from('leads')
        .select('id, full_name, stage')
        .eq('id', id)
        .single();
      
      if (!error && lead) {
        console.log(`\nID ${id} encontrado:`);
        console.log('Nombre:', lead.full_name);
        console.log('Stage:', lead.stage);
      } else {
        console.log(`\nID ${id}: No encontrado`);
      }
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

findCorrectLeadId();