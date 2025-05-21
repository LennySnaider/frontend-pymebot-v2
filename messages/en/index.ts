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
import agents from './agents.json';
import roles from './roles.json';
import { set } from 'lodash';

// Create an object for messages with nested structure
const messages: Record<string, unknown> = {};

// Process navigation keys to convert them into a nested structure
if (navigation.nav) {
    Object.entries(navigation.nav).forEach(([section, sectionValue]) => {
        if (typeof sectionValue === 'object' && sectionValue !== null) {
            // If it's an object (section with subkeys)
            Object.entries(sectionValue as Record<string, unknown>).forEach(([key, value]) => {
                set(messages, `nav.${section}.${key}`, value);
            });
        } else {
            // If it's a direct value
            set(messages, `nav.${section}`, sectionValue);
        }
    });
}

// Process appointments keys
if (appointments.appointments) {
    Object.entries(appointments.appointments).forEach(([key, value]) => {
        set(messages, `appointments.${key}`, value);
    });
}

// Process customers keys
if (customers.customers) {
    Object.entries(customers.customers).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
            // If it's an object (section with subkeys)
            Object.entries(value as Record<string, unknown>).forEach(([subKey, subValue]) => {
                set(messages, `customers.${key}.${subKey}`, subValue);
            });
        } else {
            // If it's a direct value
            set(messages, `customers.${key}`, value);
        }
    });
}

// Process properties keys
if (properties.properties) {
    Object.entries(properties.properties).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
            // If it's an object (section with subkeys)
            Object.entries(value as Record<string, unknown>).forEach(([subKey, subValue]) => {
                set(messages, `properties.${key}.${subKey}`, subValue);
            });
        } else {
            // If it's a direct value
            set(messages, `properties.${key}`, value);
        }
    });
}

// Add the other modules (excluding `properties` already processed)
Object.assign(messages, {
  core,
  appointment,   // Add appointment as a namespace
  dashboard,
  ui,
  system,        // Using system namespace directly
  // Merge systemForms with system to ensure access via systemVariables
  systemVariables: {
    ...system.systemVariables,
    ...systemForms.systemVariables
  },
  tasks,         // Add tasks as a namespace
  salesFunnel,   // Add salesFunnel as a namespace
  scrumboard,    // Add scrumboard as a namespace
  common,        // Add common as a namespace
  notificationBuilder,  // Add notificationBuilder as a namespace
  superadmin,     // Add superadmin as a namespace
  moduleEditor,    // Add moduleEditor as a namespace
  agents,         // Add agents as a namespace
  roles          // Add roles as a namespace
});

// Note: We don't need to manually add system.business anymore as it's included in system.json directly

export default messages;
