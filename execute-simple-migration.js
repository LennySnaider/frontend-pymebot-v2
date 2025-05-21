const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeMigration() {
  console.log('Iniciando migración de agents a users...\n');
  
  try {
    // 1. Obtener todos los agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*');
    
    if (agentsError) {
      console.error('Error obteniendo agents:', agentsError);
      return;
    }
    
    console.log(`Encontrados ${agents.length} agents`);
    
    // 2. Actualizar users con metadata de agents
    for (const agent of agents) {
      if (agent.user_id) {
        // Agent con user_id: actualizar metadata
        const metadata = {
          bio: agent.bio,
          specializations: agent.specializations,
          years_experience: agent.years_experience,
          languages: agent.languages,
          license_number: agent.license_number,
          rating: agent.rating,
          commission_rate: agent.commission_rate,
          availability: agent.availability,
          profile_image: agent.profile_image,
          is_active: agent.is_active
        };
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            metadata,
            avatar_url: agent.profile_image
          })
          .eq('id', agent.user_id);
        
        if (updateError) {
          console.error(`Error actualizando user ${agent.user_id}:`, updateError);
        } else {
          console.log(`Actualizado user ${agent.name} con metadata`);
        }
      } else {
        // Agent sin user_id: crear nuevo usuario
        const newUser = {
          email: agent.email,
          full_name: agent.name,
          phone: agent.phone,
          tenant_id: agent.tenant_id,
          role: 'agent',
          status: agent.is_active ? 'active' : 'inactive',
          metadata: {
            bio: agent.bio,
            specializations: agent.specializations,
            years_experience: agent.years_experience,
            languages: agent.languages,
            license_number: agent.license_number,
            rating: agent.rating,
            commission_rate: agent.commission_rate,
            availability: agent.availability,
            profile_image: agent.profile_image,
            is_active: agent.is_active
          },
          avatar_url: agent.profile_image
        };
        
        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();
        
        if (createError) {
          if (createError.message.includes('duplicate key')) {
            // El usuario ya existe, obtenerlo
            const { data: existingUser } = await supabase
              .from('users')
              .select('id')
              .eq('email', agent.email)
              .single();
            
            if (existingUser) {
              // Actualizar leads para este agent
              console.log(`Usuario ya existe para ${agent.email}, actualizando leads...`);
              const { error: leadsError } = await supabase
                .from('leads')
                .update({ agent_id: existingUser.id })
                .eq('agent_id', agent.id);
              
              if (leadsError) {
                console.error(`Error actualizando leads para agent ${agent.id}:`, leadsError);
              }
            }
          } else {
            console.error(`Error creando user para ${agent.email}:`, createError);
          }
        } else {
          console.log(`Creado nuevo user ${createdUser.full_name}`);
          
          // Actualizar leads para usar el nuevo user_id
          const { error: leadsError } = await supabase
            .from('leads')
            .update({ agent_id: createdUser.id })
            .eq('agent_id', agent.id);
          
          if (leadsError) {
            console.error(`Error actualizando leads para agent ${agent.id}:`, leadsError);
          }
        }
      }
    }
    
    // 3. Actualizar leads que tienen agent.user_id
    console.log('\nActualizando leads con agent.user_id...');
    const { data: agentsWithUserId } = await supabase
      .from('agents')
      .select('id, user_id')
      .not('user_id', 'is', null);
    
    for (const agent of agentsWithUserId || []) {
      const { error: updateLeadsError } = await supabase
        .from('leads')
        .update({ agent_id: agent.user_id })
        .eq('agent_id', agent.id);
      
      if (updateLeadsError) {
        console.error(`Error actualizando leads para agent ${agent.id}:`, updateLeadsError);
      } else {
        console.log(`Actualizado leads del agent ${agent.id} a user ${agent.user_id}`);
      }
    }
    
    // 4. Verificar resultados
    console.log('\n=== VERIFICACIÓN FINAL ===');
    const { data: agentUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, metadata')
      .eq('role', 'agent');
    
    console.log(`\nUsuarios con rol agent: ${agentUsers?.length || 0}`);
    
    const { data: leads } = await supabase
      .from('leads')
      .select('id, agent_id')
      .not('agent_id', 'is', null);
    
    console.log(`Leads con agent_id asignado: ${leads?.length || 0}`);
    
    console.log('\nMigración completada. Revisa los datos antes de eliminar la tabla agents.');
    
  } catch (error) {
    console.error('Error en migración:', error);
  }
}

executeMigration();