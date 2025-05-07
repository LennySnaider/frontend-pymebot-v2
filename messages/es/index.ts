import core from './core.json';
import customers from './customers.json';
import appointments from './appointments.json';
import appointment from './appointment.json';
import properties from './properties.json';
import dashboard from './dashboard.json';
import navigation from './navigation.json';
import ui from './ui.json';
import system from './system.json';
import systemForms from './system-forms.json';
import tasks from './tasks.json';
import salesFunnel from './salesFunnel.json';
import scrumboard from './scrumboard.json';
import common from './common.json';
import notificationBuilder from './notificationBuilder.json';
import superadmin from './superadmin.json';
import moduleEditor from './module-editor.json';
import { set } from 'lodash';

// Crear un objeto para los mensajes con estructura anidada
const messages: Record<string, unknown> = {};

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

// Procesar las claves de appointments
if (appointments.appointments) {
    Object.entries(appointments.appointments).forEach(([key, value]) => {
        set(messages, `appointments.${key}`, value);
    });
}

// Procesar las claves de customers
if (customers.customers) {
    Object.entries(customers.customers).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
            // Si es un objeto (sección con subclaves)
            Object.entries(value as Record<string, unknown>).forEach(([subKey, subValue]) => {
                set(messages, `customers.${key}.${subKey}`, subValue);
            });
        } else {
            // Si es un valor directo
            set(messages, `customers.${key}`, value);
        }
    });
}

// Procesar las claves de properties
if (properties.properties) {
    Object.entries(properties.properties).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
            // Si es un objeto (sección con subclaves)
            Object.entries(value as Record<string, unknown>).forEach(([subKey, subValue]) => {
                set(messages, `properties.${key}.${subKey}`, subValue);
            });
        } else {
            // Si es un valor directo
            set(messages, `properties.${key}`, value);
        }
    });
}

// Añadir los demás módulos (excluyendo `properties` ya procesado)
Object.assign(messages, {
  core,
  appointment,    // Namespace para appointment.json
  dashboard,
  ui,
  system,         // Namespace para system.json
  // Fusionar systemForms con system para asegurar acceso via systemVariables
  systemVariables: {
    ...system.systemVariables,
    ...systemForms.systemVariables
  },
  tasks,          // Namespace para tasks.json
  salesFunnel,    // Namespace para salesFunnel.json
  scrumboard,     // Namespace para scrumboard.json
  common,         // Namespace para common.json
  notificationBuilder,  // Namespace para notificationBuilder.json
  superadmin,      // Namespace para superadmin.json
  moduleEditor     // Namespace para module-editor.json
});

export default messages;
