const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simpleMigration() {
  console.log('Migración simplificada de agents a users (sin metadata)...\n');
  
  try {
    // 1. Primero, eliminar el constraint actual de leads
    console.log('Paso 1: Preparando la tabla leads...');
    // Esto requiere SQL directo, así que lo saltaremos
    
    // 2. Obtener todos los agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*');
    
    if (agentsError) {
      console.error('Error obteniendo agents:', agentsError);
      return;
    }
    
    console.log(`\nPaso 2: Encontrados ${agents.length} agents`);
    
    // 3. Crear usuarios para agents sin user_id
    console.log('\nPaso 3: Creando usuarios para agents sin user_id...');
    for (const agent of agents) {
      if (!agent.user_id) {
        // Verificar si ya existe un usuario con ese email
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', agent.email)
          .single();
        
        if (!existingUser) {
          // Crear nuevo usuario
          const newUser = {
            email: agent.email,
            full_name: agent.name,
            phone: agent.phone,
            tenant_id: agent.tenant_id,
            role: 'agent',
            status: agent.is_active ? 'active' : 'inactive'
          };
          
          const { data: createdUser, error: createError } = await supabase
            .from('users')
            .insert(newUser)
            .select()
            .single();
          
          if (createError) {
            console.error(`Error creando user para ${agent.email}:`, createError.message);
          } else {
            console.log(`✓ Creado nuevo user: ${createdUser.full_name}`);
          }
        } else {
          console.log(`! Usuario ya existe para ${agent.email}`);
        }
      }
    }
    
    // 4. Mapeo de agent_id a user_id
    console.log('\nPaso 4: Creando mapeo de agent_id a user_id...');
    const agentToUserMap = {};
    
    for (const agent of agents) {
      if (agent.user_id) {
        agentToUserMap[agent.id] = agent.user_id;
      } else {
        // Buscar el usuario creado o existente
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('email', agent.email)
          .eq('tenant_id', agent.tenant_id)
          .single();
        
        if (user) {
          agentToUserMap[agent.id] = user.id;
        }
      }
    }
    
    console.log('Mapeo creado:', agentToUserMap);
    
    // 5. Actualizar leads temporalmente sin constraint
    console.log('\nPaso 5: Actualizando leads (requiere eliminar constraint manualmente)...');
    console.log('Por favor ejecuta estos comandos SQL en Supabase:');
    console.log('1. ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_agent_id_fkey;');
    console.log('2. ALTER TABLE leads ADD COLUMN new_agent_id UUID;');
    
    // 6. Mostrar comandos SQL para actualizar leads
    console.log('\n3. Ejecuta estas actualizaciones para cada lead:');
    Object.entries(agentToUserMap).forEach(([agentId, userId]) => {
      console.log(`UPDATE leads SET new_agent_id = '${userId}' WHERE agent_id = '${agentId}';`);
    });
    
    console.log('\n4. Finalmente:');
    console.log('ALTER TABLE leads RENAME COLUMN agent_id TO old_agent_id;');
    console.log('ALTER TABLE leads RENAME COLUMN new_agent_id TO agent_id;');
    console.log('ALTER TABLE leads ADD CONSTRAINT leads_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES users(id);');
    console.log('ALTER TABLE leads DROP COLUMN old_agent_id;');
    
    // 7. Verificar resultados finales
    const { data: agentUsers } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('role', 'agent');
    
    console.log(`\n=== RESULTADO FINAL ===`);
    console.log(`Usuarios con rol agent: ${agentUsers?.length || 0}`);
    agentUsers?.forEach(user => {
      console.log(`- ${user.full_name || user.email}`);
    });
    
    console.log('\nIMPORTANTE: Ejecuta los comandos SQL mostrados arriba para completar la migración.');
    
  } catch (error) {
    console.error('Error en migración:', error);
  }
}

simpleMigration();