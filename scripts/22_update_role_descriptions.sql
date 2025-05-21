-- Actualizar las descripciones de los roles para que sean más genéricas
UPDATE roles 
SET description = CASE name
    WHEN 'super_admin' THEN 'Super Administrador con acceso completo al sistema'
    WHEN 'admin' THEN 'Administrador con acceso a la mayor parte del sistema'
    WHEN 'agent' THEN 'Agente operativo'
    WHEN 'viewer' THEN 'Acceso de solo lectura'
    ELSE description
END
WHERE name IN ('super_admin', 'admin', 'agent', 'viewer');