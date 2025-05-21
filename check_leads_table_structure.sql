-- Check the actual structure of the leads table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'leads' 
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- Specific check for has_appointment and is_active columns
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'has_appointment'
    ) AS has_appointment_exists,
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'is_active'
    ) AS is_active_exists;