import { getRequestConfig } from 'next-intl/server'
import { getLocale } from '@/server/actions/locale'
import { set } from 'lodash'

export default getRequestConfig(async () => {
    const locale = await getLocale()
    
    // Para ambos idiomas, usar el archivo index.ts que combina todos los módulos
    if (locale === 'en' || locale === 'es') {
        try {
            // Importar el archivo index.ts que combina todos los módulos
            const messages = (await import(`../../messages/${locale}/index.ts`)).default;
            
            return {
                locale,
                messages,
            }
        } catch (error) {
            console.warn('Error al importar el archivo index.ts, intentando importar archivos individuales:', error)
            
            try {
                // Importar todos los archivos JSON individuales
                const core = (await import(`../../messages/${locale}/core.json`)).default;
                const customers = (await import(`../../messages/${locale}/customers.json`)).default;
                const appointments = (await import(`../../messages/${locale}/appointments.json`)).default;
                const appointment = (await import(`../../messages/${locale}/appointment.json`)).default;
                const properties = (await import(`../../messages/${locale}/properties.json`)).default;
                const dashboard = (await import(`../../messages/${locale}/dashboard.json`)).default;
                const navigation = (await import(`../../messages/${locale}/navigation.json`)).default;
                const ui = (await import(`../../messages/${locale}/ui.json`)).default;
                const system = (await import(`../../messages/${locale}/system.json`)).default;
                const systemForms = (await import(`../../messages/${locale}/system-forms.json`)).default;
                const tasks = (await import(`../../messages/${locale}/tasks.json`)).default;
                const salesFunnel = (await import(`../../messages/${locale}/salesFunnel.json`)).default;
                const scrumboard = (await import(`../../messages/${locale}/scrumboard.json`)).default;
                const common = (await import(`../../messages/${locale}/common.json`)).default;
                
                // Cargar los módulos de notificaciones y superadmin
                let notificationBuilder = {};
                let superadmin = {};
                try {
                    notificationBuilder = (await import(`../../messages/${locale}/notificationBuilder.json`)).default;
                    superadmin = (await import(`../../messages/${locale}/superadmin.json`)).default;
                } catch (error) {
                    console.warn(`No se pudieron cargar los archivos notificationBuilder.json o superadmin.json para ${locale}:`, error);
                }
                
                // Importar system-basic.json solo para español
                let systemBasic = {};
                if (locale === 'es') {
                    try {
                        systemBasic = (await import(`../../messages/${locale}/system-basic.json`)).default;
                    } catch (error) {
                        console.warn('No se pudo cargar system-basic.json para español:', error);
                    }
                }
                
                // Crear un objeto para los mensajes con estructura anidada
                const messages = {};
                
                // Procesar las claves de navegación para convertirlas en una estructura anidada
                if (navigation.nav) {
                    Object.entries(navigation.nav).forEach(([section, sectionValue]) => {
                        if (typeof sectionValue === 'object' && sectionValue !== null) {
                            // Si es un objeto (sección con subclaves)
                            Object.entries(sectionValue as Record<string, unknown>).forEach(([key, value]) => {
                                set(messages, `nav.${section}.${key}`, value);
                            });
                        } else {
                            // Si es un valor directo
                            set(messages, `nav.${section}`, sectionValue);
                        }
                    });
                }
                
                // Procesar las claves de core
                Object.entries(core).forEach(([key, value]) => {
                    if (typeof value === 'object' && value !== null) {
                        // Si es un objeto (sección con subclaves)
                        Object.entries(value as Record<string, unknown>).forEach(([subKey, subValue]) => {
                            set(messages, `core.${key}.${subKey}`, subValue);
                        });
                    } else {
                        // Si es un valor directo
                        set(messages, `core.${key}`, value);
                    }
                });
                
                // Procesar las claves de system
                Object.entries(system).forEach(([key, value]) => {
                    if (typeof value === 'object' && value !== null) {
                        // Si es un objeto (sección con subclaves)
                        Object.entries(value as Record<string, unknown>).forEach(([subKey, subValue]) => {
                            if (typeof subValue === 'object' && subValue !== null) {
                                // Si es un objeto anidado (subsección con subclaves)
                                Object.entries(subValue as Record<string, unknown>).forEach(([subSubKey, subSubValue]) => {
                                    set(messages, `system.${key}.${subKey}.${subSubKey}`, subSubValue);
                                });
                            } else {
                                // Si es un valor directo
                                set(messages, `system.${key}.${subKey}`, subValue);
                            }
                        });
                    } else {
                        // Si es un valor directo
                        set(messages, `system.${key}`, value);
                    }
                });
                
                // Si estamos en español, combinar systemBasic con system
                if (locale === 'es' && Object.keys(systemBasic).length > 0) {
                    Object.entries(systemBasic).forEach(([key, value]) => {
                        if (typeof value === 'object' && value !== null) {
                            // Si es un objeto (sección con subclaves)
                            Object.entries(value as Record<string, unknown>).forEach(([subKey, subValue]) => {
                                set(messages, `system.${key}.${subKey}`, subValue);
                            });
                        } else {
                            // Si es un valor directo
                            set(messages, `system.${key}`, value);
                        }
                    });
                }
                
                // Procesar las claves de los demás módulos
                [
                    { namespace: 'customers', data: customers },
                    { namespace: 'appointments', data: appointments },
                    { namespace: 'appointment', data: appointment },
                    { namespace: 'properties', data: properties },
                    { namespace: 'dashboard', data: dashboard },
                    { namespace: 'ui', data: ui },
                    { namespace: 'systemForms', data: systemForms },
                    { namespace: 'tasks', data: tasks },
                    { namespace: 'salesFunnel', data: salesFunnel },
                    { namespace: 'scrumboard', data: scrumboard },
                    { namespace: 'common', data: common },
                    { namespace: 'notificationBuilder', data: notificationBuilder },
                    { namespace: 'superadmin', data: superadmin }
                ].forEach(({ namespace, data }) => {
                    Object.entries(data).forEach(([key, value]) => {
                        if (typeof value === 'object' && value !== null) {
                            // Si es un objeto (sección con subclaves)
                            Object.entries(value as Record<string, unknown>).forEach(([subKey, subValue]) => {
                                set(messages, `${namespace}.${key}.${subKey}`, subValue);
                            });
                        } else {
                            // Si es un valor directo
                            set(messages, `${namespace}.${key}`, value);
                        }
                    });
                });
                
                return {
                    locale,
                    messages,
                }
            } catch (error) {
                console.warn('Fallback to legacy messages file:', error)
                // Fallback al archivo legacy
                return {
                    locale,
                    messages: (await import(`../../messages/${locale}.json`)).default,
                }
            }
        }
    } else {
        // Para otros idiomas, usar el archivo legacy
        return {
            locale,
            messages: (await import(`../../messages/${locale}.json`)).default,
        }
    }
})
