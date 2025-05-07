-- Esta migración crea la tabla module_dependencies para almacenar las dependencias entre módulos
-- @version 1.0.0
-- @created 2025-06-05

-- Tabla de Dependencias entre Módulos
CREATE TABLE IF NOT EXISTS module_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    dependency_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(module_id, dependency_id)
);

-- Políticas RLS: Solo SUPERADMIN puede acceder
ALTER TABLE module_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo SUPERADMIN puede acceder a dependencias de módulos" 
ON module_dependencies
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

-- Función para validar que no se creen dependencias circulares
CREATE OR REPLACE FUNCTION check_module_dependency_cycle()
RETURNS TRIGGER AS $$
DECLARE
    visited UUID[];
    queue UUID[];
    current_id UUID;
    dependency_exists BOOLEAN;
BEGIN
    -- Inicializamos la cola con el dependency_id
    queue := ARRAY[NEW.dependency_id];
    visited := ARRAY[NEW.module_id]; -- Para evitar que volvamos al módulo original
    
    -- Búsqueda en anchura (BFS) para detectar ciclos
    WHILE array_length(queue, 1) > 0 LOOP
        -- Extraemos el primer elemento de la cola
        current_id := queue[1];
        queue := array_remove(queue, current_id);
        
        -- Si encontramos el módulo original en sus dependencias, hay un ciclo
        IF current_id = NEW.module_id THEN
            RAISE EXCEPTION 'Dependencia circular detectada: el módulo % depende indirectamente de sí mismo', NEW.module_id;
        END IF;
        
        -- Añadimos este nodo a visitados
        IF NOT current_id = ANY(visited) THEN
            visited := visited || current_id;
            
            -- Obtenemos sus dependencias y las añadimos a la cola
            FOR dependency_exists, current_id IN 
                SELECT TRUE, md.dependency_id 
                FROM module_dependencies md 
                WHERE md.module_id = current_id
            LOOP
                IF dependency_exists THEN
                    queue := queue || current_id;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar dependencias circulares
CREATE TRIGGER check_module_dependency_cycle_trigger
BEFORE INSERT OR UPDATE ON module_dependencies
FOR EACH ROW EXECUTE FUNCTION check_module_dependency_cycle();

-- Índices para optimizar consultas
CREATE INDEX idx_module_dependencies_module_id ON module_dependencies (module_id);
CREATE INDEX idx_module_dependencies_dependency_id ON module_dependencies (dependency_id);

-- Insertar dependencias iniciales (ejemplos)
INSERT INTO module_dependencies (module_id, dependency_id, is_required, notes)
SELECT m.id, d.id, TRUE, 'Dependencia inicial'
FROM modules m, modules d
WHERE m.code = 'appointment' AND d.code = 'calendar'
ON CONFLICT (module_id, dependency_id) DO NOTHING;

INSERT INTO module_dependencies (module_id, dependency_id, is_required, notes)
SELECT m.id, d.id, TRUE, 'Dependencia inicial'
FROM modules m, modules d
WHERE m.code = 'crm' AND d.code = 'customer'
ON CONFLICT (module_id, dependency_id) DO NOTHING;

INSERT INTO module_dependencies (module_id, dependency_id, is_required, notes)
SELECT m.id, d.id, TRUE, 'Dependencia inicial'
FROM modules m, modules d
WHERE m.code = 'invoicing' AND d.code = 'products'
ON CONFLICT (module_id, dependency_id) DO NOTHING;

INSERT INTO module_dependencies (module_id, dependency_id, is_required, notes)
SELECT m.id, d.id, TRUE, 'Dependencia inicial'
FROM modules m, modules d
WHERE m.code = 'invoicing' AND d.code = 'customer'
ON CONFLICT (module_id, dependency_id) DO NOTHING;

INSERT INTO module_dependencies (module_id, dependency_id, is_required, notes)
SELECT m.id, d.id, TRUE, 'Dependencia inicial'
FROM modules m, modules d
WHERE m.code = 'reports' AND d.code = 'customer'
ON CONFLICT (module_id, dependency_id) DO NOTHING;

INSERT INTO module_dependencies (module_id, dependency_id, is_required, notes)
SELECT m.id, d.id, TRUE, 'Dependencia inicial'
FROM modules m, modules d
WHERE m.code = 'reports' AND d.code = 'products'
ON CONFLICT (module_id, dependency_id) DO NOTHING;

INSERT INTO module_dependencies (module_id, dependency_id, is_required, notes)
SELECT m.id, d.id, TRUE, 'Dependencia inicial'
FROM modules m, modules d
WHERE m.code = 'reports' AND d.code = 'sales'
ON CONFLICT (module_id, dependency_id) DO NOTHING;