/**
 * Script para diagnosticar y limpiar leads duplicados
 * Ejecutar con: node debug-duplicate-leads.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkDuplicateLeads() {
  console.log('🔍 Buscando leads duplicados...\n');
  
  try {
    // Obtener todos los leads
    const { data: allLeads, error } = await supabase
      .from('leads')
      .select('id, full_name, email, stage, tenant_id, created_at')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error al obtener leads:', error);
      return;
    }
    
    // Agrupar por ID para encontrar duplicados
    const leadsByIdMap = new Map();
    
    allLeads?.forEach(lead => {
      if (leadsByIdMap.has(lead.id)) {
        leadsByIdMap.get(lead.id).push(lead);
      } else {
        leadsByIdMap.set(lead.id, [lead]);
      }
    });
    
    // Mostrar duplicados
    console.log('📊 Análisis de duplicados:\n');
    let duplicatesFound = false;
    
    leadsByIdMap.forEach((leads, id) => {
      if (leads.length > 1) {
        duplicatesFound = true;
        console.log(`❌ ID duplicado: ${id}`);
        console.log(`   Cantidad de registros: ${leads.length}`);
        
        leads.forEach((lead, index) => {
          console.log(`   ${index + 1}. ${lead.full_name || 'Sin nombre'} - ${lead.email || 'Sin email'}`);
          console.log(`      Etapa: ${lead.stage}`);
          console.log(`      Tenant: ${lead.tenant_id}`);
          console.log(`      Creado: ${lead.created_at}`);
          console.log('');
        });
        
        console.log('   ---\n');
      }
    });
    
    if (!duplicatesFound) {
      console.log('✅ No se encontraron leads duplicados por ID\n');
    }
    
    // Buscar duplicados por email
    console.log('📧 Buscando duplicados por email...\n');
    const leadsByEmailMap = new Map();
    
    allLeads?.forEach(lead => {
      if (lead.email) {
        const email = lead.email.toLowerCase();
        if (leadsByEmailMap.has(email)) {
          leadsByEmailMap.get(email).push(lead);
        } else {
          leadsByEmailMap.set(email, [lead]);
        }
      }
    });
    
    let emailDuplicatesFound = false;
    
    leadsByEmailMap.forEach((leads, email) => {
      if (leads.length > 1) {
        emailDuplicatesFound = true;
        console.log(`📧 Email duplicado: ${email}`);
        console.log(`   Cantidad de registros: ${leads.length}`);
        
        leads.forEach((lead, index) => {
          console.log(`   ${index + 1}. ID: ${lead.id} - ${lead.full_name || 'Sin nombre'}`);
          console.log(`      Etapa: ${lead.stage}`);
          console.log(`      Tenant: ${lead.tenant_id}`);
          console.log(`      Creado: ${lead.created_at}`);
          console.log('');
        });
        
        console.log('   ---\n');
      }
    });
    
    if (!emailDuplicatesFound) {
      console.log('✅ No se encontraron leads duplicados por email\n');
    }
    
    // Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`Total de leads: ${allLeads?.length || 0}`);
    console.log(`IDs únicos: ${leadsByIdMap.size}`);
    console.log(`Emails únicos: ${leadsByEmailMap.size}`);
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Script para limpiar duplicados (usar con precaución)
async function cleanDuplicates(dryRun = true) {
  if (dryRun) {
    console.log('\n🔍 MODO SIMULACIÓN - No se harán cambios reales\n');
  } else {
    console.log('\n⚠️  MODO REAL - Se eliminarán duplicados\n');
  }
  
  try {
    // Obtener todos los leads ordenados por fecha de creación
    const { data: allLeads, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error al obtener leads:', error);
      return;
    }
    
    // Agrupar por ID
    const leadsByIdMap = new Map();
    
    allLeads?.forEach(lead => {
      if (leadsByIdMap.has(lead.id)) {
        leadsByIdMap.get(lead.id).push(lead);
      } else {
        leadsByIdMap.set(lead.id, [lead]);
      }
    });
    
    // Procesar duplicados
    let deletionCount = 0;
    
    for (const [id, leads] of leadsByIdMap) {
      if (leads.length > 1) {
        // Mantener el más reciente con más información
        const leadsToProcess = [...leads];
        
        // Ordenar por cantidad de información (el que tenga más campos completos)
        leadsToProcess.sort((a, b) => {
          const scoreA = calculateCompleteness(a);
          const scoreB = calculateCompleteness(b);
          
          // Si tienen la misma completitud, preferir el más reciente
          if (scoreA === scoreB) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          
          return scoreB - scoreA;
        });
        
        const keepLead = leadsToProcess[0];
        const deleteLeads = leadsToProcess.slice(1);
        
        console.log(`\n📋 Procesando duplicados de ID: ${id}`);
        console.log(`   Mantener: ${keepLead.full_name || 'Sin nombre'} (score: ${calculateCompleteness(keepLead)})`);
        console.log(`   Eliminar: ${deleteLeads.length} registros`);
        
        if (!dryRun) {
          // Aquí deberíamos usar una estrategia diferente ya que no podemos eliminar por ID duplicado
          // En su lugar, deberíamos usar otro identificador único como created_at o algún campo interno
          console.log('   ⚠️  Eliminación requiere estrategia especial por IDs duplicados');
        }
        
        deletionCount += deleteLeads.length;
      }
    }
    
    console.log(`\n📊 Total de registros a eliminar: ${deletionCount}`);
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Función para calcular qué tan completo está un lead
function calculateCompleteness(lead) {
  let score = 0;
  
  if (lead.full_name) score += 2;
  if (lead.email) score += 2;
  if (lead.phone) score += 1;
  if (lead.stage && lead.stage !== 'new') score += 1;
  if (lead.metadata && Object.keys(lead.metadata).length > 0) score += 1;
  if (lead.description) score += 1;
  
  return score;
}

// Ejecutar el script
(async () => {
  console.log('🚀 Iniciando diagnóstico de leads duplicados\n');
  
  await checkDuplicateLeads();
  
  // Para ejecutar la limpieza, descomentar la siguiente línea
  // await cleanDuplicates(true); // true = modo simulación, false = eliminar realmente
})();