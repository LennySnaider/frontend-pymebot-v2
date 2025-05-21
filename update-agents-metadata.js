const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateAgentsMetadata() {
  console.log('Actualizando metadata de agentes...\n');
  
  try {
    // Metadata para cada agente basada en los datos originales
    const agentsMetadata = [
      {
        email: 'carlos@agentprop.com',
        metadata: {
          bio: 'Especialista en propiedades residenciales con amplia experiencia en el mercado inmobiliario de la Ciudad de México',
          specializations: ['Residencial', 'Casas', 'Departamentos'],
          years_experience: 8,
          languages: ['Español', 'Inglés'],
          license_number: 'AG-2023-1234',
          rating: 4.8,
          commission_rate: 2.5,
          profile_image: 'https://i.pravatar.cc/150?img=68'
        }
      },
      {
        email: 'ana@agentprop.com',
        metadata: {
          bio: 'Experta en propiedades de lujo y desarrollos nuevos en las zonas más exclusivas',
          specializations: ['Lujo', 'Residencial', 'Nuevos Desarrollos'],
          years_experience: 5,
          languages: ['Español', 'Inglés', 'Francés'],
          license_number: 'AG-2023-5678',
          rating: 4.9,
          commission_rate: 3,
          profile_image: 'https://i.pravatar.cc/150?img=5'
        }
      },
      {
        email: 'miguel@agentprop.com',
        metadata: {
          bio: 'Especializado en propiedades comerciales e inversiones inmobiliarias de alto rendimiento',
          specializations: ['Comercial', 'Oficinas', 'Inversiones'],
          years_experience: 12,
          languages: ['Español', 'Inglés'],
          license_number: 'AG-2023-9012',
          rating: 4.7,
          commission_rate: 2.75,
          profile_image: 'https://i.pravatar.cc/150?img=12'
        }
      },
      {
        email: 'ventas@pymebot.ai',
        metadata: {
          bio: 'Asesor ventas',
          specializations: ['Agente con mas de 10 años de experiencia en el sector.'],
          years_experience: 10,
          languages: ['Español'],
          commission_rate: 5,
          is_active: true
        }
      }
    ];
    
    // Actualizar cada agente
    for (const agent of agentsMetadata) {
      const { data, error } = await supabase
        .from('users')
        .update({
          metadata: agent.metadata,
          avatar_url: agent.metadata.profile_image || null
        })
        .eq('email', agent.email)
        .eq('role', 'agent')
        .select();
      
      if (error) {
        console.error(`Error actualizando ${agent.email}:`, error);
      } else {
        console.log(`✅ Actualizado: ${data[0]?.full_name || agent.email}`);
      }
    }
    
    // Verificar resultados
    console.log('\n=== VERIFICACIÓN DE METADATA ===');
    const { data: agents } = await supabase
      .from('users')
      .select('full_name, email, metadata, avatar_url')
      .eq('role', 'agent')
      .eq('tenant_id', 'afa60b0a-3046-4607-9c48-266af6e1d322');
    
    agents?.forEach(agent => {
      console.log(`\n${agent.full_name} (${agent.email})`);
      console.log('Avatar URL:', agent.avatar_url || 'No definido');
      if (agent.metadata) {
        console.log('Metadata:', JSON.stringify(agent.metadata, null, 2));
      } else {
        console.log('Metadata: No definida');
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

updateAgentsMetadata();