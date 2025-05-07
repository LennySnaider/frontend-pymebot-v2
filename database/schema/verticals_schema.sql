-- agentprop/database/schema/verticals_schema.sql
-- Esquema para verticales de negocio y sus relaciones
-- @version 1.0.0
-- @created 2025-04-11

-- Tabla de Verticales de Negocio
CREATE TABLE verticals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE, -- Identificador único (belleza, bienes_raices, etc.)
    description TEXT,
    icon VARCHAR(50), -- Nombre del ícono a mostrar
    brand_name VARCHAR(100), -- Nombre de marca (AgentProp, AgentBeauty, etc.)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de relación entre Verticales y Módulos
CREATE TABLE vertical_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vertical_id UUID NOT NULL REFERENCES verticals(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vertical_id, module_id)
);

-- Tabla para categorías dentro de cada vertical
CREATE TABLE vertical_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vertical_id UUID NOT NULL REFERENCES verticals(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vertical_id, code)
);

-- Tabla que relaciona tenants con verticales
CREATE TABLE tenant_verticals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vertical_id UUID NOT NULL REFERENCES verticals(id) ON DELETE CASCADE,
    category_id UUID REFERENCES vertical_categories(id) ON DELETE SET NULL,
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    custom_settings JSONB, -- Configuraciones específicas para este tenant en esta vertical
    UNIQUE(tenant_id, vertical_id)
);

-- Relación entre plantillas de chatbot y verticales
ALTER TABLE chatbot_templates ADD COLUMN vertical_id UUID REFERENCES verticals(id) ON DELETE SET NULL;

-- Políticas RLS: Solo SUPERADMIN puede gestionar verticales
ALTER TABLE verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo SUPERADMIN puede gestionar verticales" 
ON verticals 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

CREATE POLICY "Solo SUPERADMIN puede gestionar relación vertical-módulo" 
ON vertical_modules 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

CREATE POLICY "Solo SUPERADMIN puede gestionar categorías de verticales" 
ON vertical_categories 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

-- Política para tenant_verticals: SUPERADMIN puede hacer todo, ADMIN solo ver su tenant
ALTER TABLE tenant_verticals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SUPERADMIN puede gestionar todas las relaciones tenant-vertical" 
ON tenant_verticals 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

CREATE POLICY "ADMIN puede ver solo sus propias verticales" 
ON tenant_verticals 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

-- Triggers para actualizar el campo updated_at
CREATE TRIGGER update_verticals_modtime
BEFORE UPDATE ON verticals
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_vertical_categories_modtime
BEFORE UPDATE ON vertical_categories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Insertar datos iniciales
INSERT INTO verticals (name, code, description, icon, brand_name, is_active) VALUES
('Belleza', 'belleza', 'Salones de belleza, barberías y servicios estéticos', 'beauty', 'AgentBeauty by PymeBot', true),
('Bienestar y Relajación', 'bienestar_y_relajación', 'Spas, saunas y servicios de masajes', 'spa', 'AgentZen by PymeBot', true),
('Salud y Recuperación', 'salud_y_recuperación', 'Fisioterapia y servicios de recuperación física', 'health', 'AgentVital by PymeBot', true),
('Arte Corporal', 'arte_corporal', 'Estudios de tatuajes y piercings', 'tattoo', 'AgentInk by PymeBot', true),
('Mascotas', 'mascotas', 'Veterinarias y servicios para mascotas', 'pet', 'AgentPet by PymeBot', true),
('Bienes Raíces', 'bienes_raices', 'Inmobiliarias, constructoras y servicios inmobiliarios', 'building', 'AgentProp by PymeBot', true),
('Restaurantes', 'restaurantes', 'Restaurantes, cafeterías y servicios de comida', 'food', 'AgentChef by PymeBot', true),
('Medicina', 'medicina', 'Consultorios médicos, dentistas y servicios de salud', 'medical', 'AgentMedic by PymeBot', true);

-- Insertar categorías para cada vertical
-- Belleza
INSERT INTO vertical_categories (vertical_id, name, code, description, is_active)
SELECT 
    v.id, 
    unnest(ARRAY['Salón', 'Barbería', 'Salón de uñas', 'Estudio de bronceado']), 
    unnest(ARRAY['salon', 'barberia', 'salon_unas', 'bronceado']), 
    'Categoría para vertical de belleza', 
    true
FROM verticals v WHERE v.code = 'belleza';

-- Bienestar y Relajación
INSERT INTO vertical_categories (vertical_id, name, code, description, is_active)
SELECT 
    v.id, 
    unnest(ARRAY['Spa', 'Sauna', 'Masajes']), 
    unnest(ARRAY['spa', 'sauna', 'masajes']), 
    'Categoría para vertical de bienestar', 
    true
FROM verticals v WHERE v.code = 'bienestar_y_relajación';

-- Salud y Recuperación
INSERT INTO vertical_categories (vertical_id, name, code, description, is_active)
SELECT 
    v.id, 
    unnest(ARRAY['Fisioterapia', 'Práctica sanitaria', 'Fitness y recuperación']), 
    unnest(ARRAY['fisioterapia', 'practica_sanitaria', 'fitness_recuperacion']), 
    'Categoría para vertical de salud', 
    true
FROM verticals v WHERE v.code = 'salud_y_recuperación';

-- Arte Corporal
INSERT INTO vertical_categories (vertical_id, name, code, description, is_active)
SELECT 
    v.id, 
    unnest(ARRAY['Tatuajes', 'Piercing']), 
    unnest(ARRAY['tatuajes', 'piercing']), 
    'Categoría para vertical de arte corporal', 
    true
FROM verticals v WHERE v.code = 'arte_corporal';

-- Mascotas
INSERT INTO vertical_categories (vertical_id, name, code, description, is_active)
SELECT 
    v.id, 
    unnest(ARRAY['Peluquería para mascotas', 'Veterinarias']), 
    unnest(ARRAY['peluqueria_mascotas', 'veterinarias']), 
    'Categoría para vertical de mascotas', 
    true
FROM verticals v WHERE v.code = 'mascotas';

-- Bienes Raíces
INSERT INTO vertical_categories (vertical_id, name, code, description, is_active)
SELECT 
    v.id, 
    unnest(ARRAY['Inmobiliarias', 'Constructoras', 'Bienes raíces']), 
    unnest(ARRAY['inmobiliarias', 'constructoras', 'bienes_raices']), 
    'Categoría para vertical de bienes raíces', 
    true
FROM verticals v WHERE v.code = 'bienes_raices';

-- Restaurantes
INSERT INTO vertical_categories (vertical_id, name, code, description, is_active)
SELECT 
    v.id, 
    unnest(ARRAY['Restaurantes', 'Comida rápida', 'Cafeterías', 'Repostería y pastelería']), 
    unnest(ARRAY['restaurantes', 'comida_rapida', 'cafeterias', 'reposteria']), 
    'Categoría para vertical de restaurantes', 
    true
FROM verticals v WHERE v.code = 'restaurantes';

-- Medicina
INSERT INTO vertical_categories (vertical_id, name, code, description, is_active)
SELECT 
    v.id, 
    unnest(ARRAY['Médicos', 'Dentistas', 'Psicólogos', 'Nutriólogos', 'Oftalmólogos', 'Podólogos', 'Centro de medicina estética']), 
    unnest(ARRAY['medicos', 'dentistas', 'psicologos', 'nutriologos', 'oftalmologos', 'podologos', 'medicina_estetica']), 
    'Categoría para vertical de medicina', 
    true
FROM verticals v WHERE v.code = 'medicina';
