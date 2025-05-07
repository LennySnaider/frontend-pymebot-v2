import { useTranslations } from 'next-intl'

/**
 * Hook personalizado para traducciones con manejo de errores
 * 
 * @param namespace - Namespace de traducciones opcional
 * @returns Función para obtener traducciones con fallback
 */
export const useTranslation = (namespace?: string) => {
    // Intentar usar next-intl para traducciones
    try {
        const t = useTranslations(namespace);
        
        // Wrapper de la función para manejar errores
        return (key: string, options?: any) => {
            try {
                return t(key, options);
            } catch (e) {
                // Si falla la traducción, mostrar error en consola y devolver clave
                console.warn(`Translation error for "${namespace}.${key}"`, e);
                
                // Extraer la última parte de la clave como fallback (por ejemplo, "title" de "business.title")
                const fallback = key.split('.').pop() || key;
                
                // Capitalizar primer letra como fallback básico
                return options?.default || 
                    fallback.charAt(0).toUpperCase() + fallback.slice(1).replace(/([A-Z])/g, ' $1');
            }
        };
    } catch (e) {
        // Si falla completamente, devolver una función que devuelve la clave como fallback
        console.error(`Failed to initialize translations for namespace "${namespace}"`, e);
        
        return (key: string, options?: any) => {
            // Extraer la última parte de la clave como fallback
            const fallback = key.split('.').pop() || key;
            
            // Devolver default si está disponible, o el fallback formateado
            return options?.default || 
                fallback.charAt(0).toUpperCase() + fallback.slice(1).replace(/([A-Z])/g, ' $1');
        };
    }
}

export default useTranslation