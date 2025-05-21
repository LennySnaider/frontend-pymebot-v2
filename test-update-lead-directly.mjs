/**
 * Test directo de actualización del lead en Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testDirectUpdate() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const leadId = '08f89f3e-7441-4c99-96e4-745d813b9d09'; // Carolina López
  const newStage = 'prospecting';
  
  console.log('\n=== TEST DIRECTO DE ACTUALIZACIÓN ===');
  console.log(`Lead ID: ${leadId}`);
  console.log(`Nueva etapa: ${newStage}`);
  
  try {
    // Primero verificar el estado actual
    const { data: leadBefore, error: fetchError } = await supabase
      .from('leads')
      .select('id, full_name, stage')
      .eq('id', leadId)
      .single();
    
    if (fetchError) {
      console.error('Error al buscar lead:', fetchError);
      return;
    }
    
    console.log('\nEstado antes:', leadBefore);
    
    // Actualizar el stage
    const { data: updateData, error: updateError } = await supabase
      .from('leads')
      .update({ stage: newStage })
      .eq('id', leadId)
      .select();
    
    if (updateError) {
      console.error('Error al actualizar:', updateError);
      return;
    }
    
    console.log('\nResultado de actualización:', updateData);
    
    // Verificar el estado después
    const { data: leadAfter, error: fetchError2 } = await supabase
      .from('leads')
      .select('id, full_name, stage')
      .eq('id', leadId)
      .single();
    
    if (!fetchError2) {
      console.log('\nEstado después:', leadAfter);
      
      if (leadAfter.stage === newStage) {
        console.log('\n✅ Actualización exitosa!');
      } else {
        console.log('\n❌ La actualización no se aplicó correctamente');
      }
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

testDirectUpdate();