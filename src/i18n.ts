import { getRequestConfig } from 'next-intl/server';

// Define los idiomas soportados
const locales = ['en', 'es'];

export default getRequestConfig(async ({ locale }) => {
  // Validar que el parámetro `locale` sea válido - usar fallback sin notFound()
  if (!locales.includes(locale)) {
    console.warn(`Invalid locale provided: ${locale}. Falling back to default 'en'`);
    locale = 'en';
  }

  try {
    // Intentar cargar los mensajes desde los archivos modulares
    const messages = await import(`../messages/${locale}/index`);
    
    return {
      messages: messages.default || messages
    };
  } catch (error) {
    console.error(`Failed to load modular messages for locale ${locale}:`, error);
    
    // Intentar cargar los archivos planos como respaldo
    try {
      const fallbackMessages = await import(`../messages/${locale}.json`);
      console.warn(`Using legacy flat messages file for locale ${locale}`);
      
      return { 
        messages: fallbackMessages.default || fallbackMessages
      };
    } catch (fallbackError) {
      console.error(`Failed to load legacy messages for locale ${locale}:`, fallbackError);
      
      // Intentar cargar el inglés como respaldo final
      try {
        console.warn('Attempting to load English messages as final fallback');
        const englishMessages = await import(`../messages/en/index`);
        
        return {
          messages: englishMessages.default || englishMessages
        };
      } catch (englishError) {
        console.error('Failed to load even English fallback messages:', englishError);
        
        // Retornamos un objeto de mensajes mínimo con las traducciones necesarias
        return {
          messages: {
            system: {
              business: {
                title: "Business Information",
                defaultName: "Realtor Inc",
                noDescription: "No description provided",
                basicInfoTitle: "Basic Information",
                typeLabel: "Business Type",
                notSpecified: "Not specified",
                timezoneLabel: "Timezone",
                websiteLabel: "Website",
                primaryColorLabel: "Primary Color",
                contactInfoTitle: "Contact Information",
                contactEmailLabel: "Contact Email",
                phoneLabel: "Phone",
                addressLabel: "Address"
              }
            },
            core: {
              edit: "Edit",
              save: "Save",
              cancel: "Cancel",
              error: "Error",
              success: "Success"
            },
            nav: {
              configuracion: {
                configuracion: "Configuration",
                empresa: "Business Information"
              },
              dashboard: {
                dashboard: "Dashboard"
              },
              conceptsAccount: {
                account: "Account",
                settings: "Settings",
                rolesPermissions: "Roles & Permissions"
              },
              fileManager: "File Manager",
              conceptsProjects: {
                projectTasks: "Tasks"
              },
              conceptsUtilities: {
                utilities: "Utilities"
              },
              conceptsProperties: {
                properties: "Properties"
              },
              conceptsProducts: {
                products: "Products"
              },
              conceptsOrders: {
                orders: "Orders"
              }
            }
          }
        };
      }
    }
  }
});
