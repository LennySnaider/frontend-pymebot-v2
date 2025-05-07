/**
 * frontend/src/utils/dbSchemaUtils.ts
 * Utilidades para trabajar con el esquema de la base de datos
 * @version 1.0.0
 * @updated 2025-04-08
 */

import { supabase } from '@/services/supabase/SupabaseClient';

/**
 * Verifica si una columna existe en una tabla
 * @param tableName Nombre de la tabla
 * @param columnName Nombre de la columna
 * @returns Promise<boolean> True si la columna existe, false en caso contrario
 */
export const columnExists = async (tableName: string, columnName: string): Promise<boolean> => {
  try {
    console.log(`Verificando si la columna ${columnName} existe en ${tableName}...`);
    
    // Método simple: obtener una fila y verificar si la columna está en los resultados
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`Error al consultar ${tableName}:`, error);
      return false;
    }
    
    // Si hay datos, verificar si la columna existe en el primer registro
    if (data && data.length > 0) {
      const columnExists = columnName in data[0];
      console.log(`Columna ${columnName} ${columnExists ? 'encontrada' : 'no encontrada'} en ${tableName}`);
      return columnExists;
    }
    
    // Si no hay datos pero no hubo error, asumimos que la tabla existe pero está vacía
    // En este caso, no podemos verificar las columnas, así que es mejor devolver false
    console.log(`La tabla ${tableName} existe pero está vacía, no se puede verificar la columna ${columnName}`);
    return false;
  } catch (err) {
    console.error(`Error general al verificar columna ${columnName} en ${tableName}:`, err);
    return false;
  }
};

/**
 * Crea una función RPC para verificar si una columna existe
 * Nota: Esta función debe ser ejecutada como migración en Supabase
 */
export const createColumnExistsFunction = async (): Promise<void> => {
  try {
    const functionSql = `
    CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text)
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      schema_name text := 'public';
      exists_val boolean;
    BEGIN
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = schema_name
        AND table_name = column_exists.table_name
        AND column_name = column_exists.column_name
      ) INTO exists_val;
      
      RETURN exists_val;
    END;
    $$;

    GRANT EXECUTE ON FUNCTION column_exists(text, text) TO authenticated;
    GRANT EXECUTE ON FUNCTION column_exists(text, text) TO anon;
    GRANT EXECUTE ON FUNCTION column_exists(text, text) TO service_role;
    `;
    
    // Esto solo funcionará si el usuario tiene permisos para crear funciones
    const { error } = await supabase.rpc('exec_sql', { sql: functionSql });
    
    if (error) {
      console.error('Error al crear función column_exists:', error);
    }
  } catch (err) {
    console.error('Error general al crear función column_exists:', err);
  }
};

/**
 * Crea una función RPC para ejecutar una consulta SQL de prueba
 * Nota: Esta función debe ser ejecutada como migración en Supabase
 */
export const createSelectTestFunction = async (): Promise<void> => {
  try {
    const functionSql = `
    CREATE OR REPLACE FUNCTION select_test(query_text text)
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      EXECUTE query_text;
      RETURN true;
    EXCEPTION WHEN OTHERS THEN
      RETURN false;
    END;
    $$;

    GRANT EXECUTE ON FUNCTION select_test(text) TO authenticated;
    GRANT EXECUTE ON FUNCTION select_test(text) TO anon;
    GRANT EXECUTE ON FUNCTION select_test(text) TO service_role;
    `;
    
    // Esto solo funcionará si el usuario tiene permisos para crear funciones
    const { error } = await supabase.rpc('exec_sql', { sql: functionSql });
    
    if (error) {
      console.error('Error al crear función select_test:', error);
    }
  } catch (err) {
    console.error('Error general al crear función select_test:', err);
  }
};

export default {
  columnExists,
  createColumnExistsFunction,
  createSelectTestFunction
};
