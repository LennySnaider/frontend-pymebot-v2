import { CONCEPTS_PREFIX_PATH, MODULES_PREFIX_PATH } from '@/constants/route.constant'
import {
    NAV_ITEM_TYPE_TITLE,
    NAV_ITEM_TYPE_ITEM,
    NAV_ITEM_TYPE_COLLAPSE,
} from '@/constants/navigation.constant'
import { SUPER_ADMIN, TENANT_ADMIN, AGENT } from '@/constants/roles.constant'
import type { NavigationTree } from '@/@types/navigation'

const navigationConfig: NavigationTree[] = [
    {
        key: 'home',
        path: '/home',
        title: 'Home',
        translateKey: 'nav.dashboard.dashboard',
        icon: 'dashboard',
        type:  NAV_ITEM_TYPE_ITEM,
        authority: [TENANT_ADMIN, AGENT, SUPER_ADMIN],
        subMenu: [],
    },
    
    /** menu */
    {
        key: 'modules.marketing',
        path: '',
        title: 'Marketing',
        translateKey: 'nav.modulesMarketing.marketing',
        icon: 'dashboardMarketing',
        type: NAV_ITEM_TYPE_COLLAPSE,
        authority: [TENANT_ADMIN, AGENT],
        meta: {
            description: {
                translateKey: 'nav.modulesMarketing.marketingDesc',
                label: 'Herramientas de marketing',
            },
        },
        subMenu: [
            {
                key: 'modules.leads.leadsScrum',
                path: `${MODULES_PREFIX_PATH}/leads/leads-scrum`,
                title: 'Leads Scrum',
                translateKey: 'nav.modulesCRM.leadsScrum',
                icon: 'projectScrumBoard',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, AGENT],
                meta: {
                    description: {
                        translateKey:
                            'nav.modulesLeads.leadsScrumDesc',
                        label: 'Scrum of all leads',
                    },
                },
                subMenu: [],
            },
            {
                key: 'modules.marketing.chat',
                path: `${MODULES_PREFIX_PATH}/marketing/chat`,
                title: 'Chat',
                translateKey: 'nav.modulesMarketing.chat',
                icon: 'chat',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, AGENT],
                meta: {
                    description: {
                        translateKey: 'nav.modulesMarketing.chatDesc',
                        label: 'Chat con clientes',
                    },
                },
                subMenu: [],
            },
           
            {
                key: 'modules.marketing.chatbot.demo',
                path: `${MODULES_PREFIX_PATH}/chatbot/demo`,
                title: 'Voice Bot Demo',
                translateKey: 'nav.modulesMarketing.chatbotDemo',
                icon: 'robot',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, AGENT, SUPER_ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.modulesMarketing.chatbotDemoDesc',
                        label: 'Demostración del Voice Bot',
                    },
                },
                subMenu: [],
            },
            {
                key: 'modules.marketing.email',
                path: `${MODULES_PREFIX_PATH}/marketing/mail`,
                title: 'Correo',
                translateKey: 'nav.modulesMarketing.email',
                icon: 'mail',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, AGENT],
                meta: {
                    description: {
                        translateKey: 'nav.modulesMarketing.emailDesc',
                        label: 'Campañas de correo electrónico',
                    },
                },
                subMenu: [],
            },
        ],
    },
    {
        key: 'modules.appointments',
        path: '',
        title: 'Citas',
        translateKey: 'nav.modulesAppointments.appointments',
        icon: 'calendar',
        type: NAV_ITEM_TYPE_COLLAPSE,
        authority: [TENANT_ADMIN, AGENT],
        meta: {
            description: {
                translateKey: 'nav.modulesAppointments.appointmentsDesc',
                label: 'Gestión de citas',
            },
        },
        subMenu: [
            {
                key: 'modules.appointments.calendar',
                path: `${MODULES_PREFIX_PATH}/appointments/calendar-view`,
                title: 'Calendario',
                translateKey: 'nav.modulesAppointments.calendar',
                icon: 'calendar',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, AGENT],
                subMenu: [],
            },
            {
                key: 'modules.appointments.businessHours',
                path: `/modules/account/settings?category=business-hours`,
                title: 'Horarios de Negocio',
                translateKey: 'nav.modulesAppointments.businessHours',
                icon: 'clockCircle',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.modulesAppointments.businessHoursDesc',
                        label: 'Configuración de horarios y citas',
                    },
                },
                subMenu: [],
            }
        ],
    },
    {
                key: 'modules.crm',
                path: '',
                title: 'crm',
                translateKey: 'nav.modulesCRM.crm',
                icon: 'uiGraphChart',
                type: NAV_ITEM_TYPE_COLLAPSE,
                authority: [TENANT_ADMIN, AGENT],
                meta: {
                    description: {
                        translateKey: 'nav.modulesCRM.crmDesc',
                        label: 'CRM management',
                    },
                },
                subMenu: [
                    
                   
                    {
                        key: 'modules.crm.customerList',
                        path: `${MODULES_PREFIX_PATH}/customers/customer-list`,
                        title: 'Customer List',
                        translateKey: 'nav.modulesCRM.customerList',
                        icon: 'customerList',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [TENANT_ADMIN, AGENT],
                        meta: {
                            description: {
                                translateKey:
                                    'nav.modulesCRM.customerList',
                                label: 'List of all customers',
                            },
                        },
                        subMenu: [],
                    },
                    {
                        key: 'modules.orders.orderList',
                        path: `${MODULES_PREFIX_PATH}/orders/order-list`,
                        title: 'Order List',
                        translateKey: 'nav.modulesOrders.orders',
                        icon: 'orderList',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [TENANT_ADMIN, AGENT],
                        meta: {
                            description: {
                                translateKey:
                                    'nav.modulesOrders.orderListDesc',
                                label: 'View all customer orders',
                            },
                        },
                        subMenu: [],
                    },

                ],
    },
    
            {
        key: 'modules.products',
        path: '',
        title: 'Productos',
        translateKey: 'nav.modulesProducts.products',
        icon: 'dashboardEcommerce',
        type: NAV_ITEM_TYPE_COLLAPSE,
        authority: [TENANT_ADMIN, AGENT],
        meta: {
            description: {
                translateKey: 'nav.modulesProducts.productsDesc',
                label: 'Gestión de productos',
            },
        },
        subMenu: [
            {
                key: 'modules.products.propertyList',
                path: `${MODULES_PREFIX_PATH}/properties/property-list`,
                title: 'Propiedades',
                translateKey: 'nav.modulesProperties.properties',
                icon: 'properties',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, AGENT],
                meta: {
                    description: {
                        translateKey: 'nav.modulesProperties.propertyListDesc',
                        label: 'Listado de propiedades',
                    },
                },
                subMenu: [],
            },
        ],
    },
            
    
            {
    key: 'modules.utilities', // Clave principal para Utilidades
    path: '', // Vacío porque es un menú colapsable
    title: 'Utilities', // Título por defecto en inglés
    translateKey: 'nav.modulesUtilities.utilities', // Clave para traducción del título principal
    icon: 'projectTask', // Icono sugerido (puedes cambiarlo por uno que tengas, ej: 'build', 'settingsInputComponent')
    type: NAV_ITEM_TYPE_COLLAPSE, // Tipo colapsable
    authority: [TENANT_ADMIN, AGENT], // Permisos
    meta: {
        description: {
            translateKey: 'nav.modulesUtilities.utilitiesDesc', // Clave para traducción de la descripción
            label: 'Utility tools and features', // Descripción por defecto en inglés
        },
    },
    subMenu: [
        // Submenú de Tareas (movido desde 'projects')
        {
            key: 'modules.utilities.projectTasks', // Actualizamos la clave para reflejar que está bajo Utilities
            path: `${MODULES_PREFIX_PATH}/projects/tasks`, // La ruta puede seguir siendo la misma si la lógica de la app lo permite
            title: 'Tasks',
            translateKey: 'nav.modulesProjects.projectTasks', // Mantenemos la clave de traducción existente si aplica
            icon: 'projectTask',
            type: NAV_ITEM_TYPE_ITEM, // Tipo item (enlace directo)
            authority: [TENANT_ADMIN, AGENT],
            meta: {
                description: {
                    translateKey: 'nav.modulesProjects.projectTasksDesc', // Mantenemos la clave de traducción existente si aplica
                    label: 'Manage project tasks',
                },
            },
            subMenu: [], // Sin submenús anidados
        },
        // Submenú de Gestor de Archivos
        {
            key: 'modules.utilities.fileManager', // Actualizamos la clave para reflejar que está bajo Utilities
            path: `${MODULES_PREFIX_PATH}/file-manager`, // La ruta puede seguir siendo la misma
            title: 'File Manager',
            translateKey: 'nav.fileManager', // Mantenemos la clave de traducción existente si aplica
            icon: 'fileManager',
            type: NAV_ITEM_TYPE_ITEM, // Tipo item
            authority: [TENANT_ADMIN, AGENT],
            meta: {
                description: {
                    translateKey: 'nav.fileManagerDesc', // Mantenemos la clave de traducción existente si aplica
                    label: 'Manage your files',
                },
            },
            subMenu: [], // Sin submenús anidados
        },

    ],
},
            {
                key: 'modules.account',
                path: '',
                title: 'Account',
                translateKey: 'nav.modulesAccount.account',
                icon: 'accountSettings',
                type: NAV_ITEM_TYPE_COLLAPSE,
                authority: [TENANT_ADMIN, AGENT],
                meta: {
                    description: {
                        translateKey: 'nav.modulesAccount.accountDesc',
                        label: 'Account settings and info',
                    },
                },
                subMenu: [
                    {
                        key: 'modules.account.settings',
                        path: `${MODULES_PREFIX_PATH}/account/settings`,
                        title: 'Settings',
                        translateKey: 'nav.modulesAccount.settings',
                        icon: 'accountSettings',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [TENANT_ADMIN, AGENT],
                        meta: {
                            description: {
                                translateKey:
                                    'nav.modulesAccount.settingsDesc',
                                label: 'Configure your settings',
                            },
                        },
                        subMenu: [],
                    },
                    {
                        key: 'modules.account.rolesPermissions',
                        path: `${MODULES_PREFIX_PATH}/account/roles-permissions`,
                        title: 'Roles & Permissions',
                        translateKey: 'nav.modulesAccount.rolesPermissions',
                        icon: 'accountRoleAndPermission',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [TENANT_ADMIN, AGENT],
                        meta: {
                            description: {
                                translateKey:
                                    'nav.modulesAccount.rolesPermissionsDesc',
                                label: 'Manage roles & permissions',
                            },
                        },
                        subMenu: [],
                    },
                ],
            },
            
            
            
            {
        key: 'superadmin.tools',
        path: '',
        title: 'Superadmin Tools',
        translateKey: 'nav.superadmin.tools',
        icon: 'accountRoleAndPermission',
        type: NAV_ITEM_TYPE_COLLAPSE,
        authority: [SUPER_ADMIN],
        meta: {
            description: {
                translateKey: 'nav.superadmin.toolsDesc',
                label: 'Herramientas exclusivas para superadministradores',
            },
        },
        subMenu: [
            {
                key: 'superadmin.tools.dashboard',
                path: `/superadmin/dashboard`,
                title: 'Dashboard Analytics',
                translateKey: 'nav.superadmin.dashboard',
                icon: 'dashboardCharts',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [SUPER_ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.superadmin.dashboardDesc',
                        label: 'Métricas y análisis del sistema',
                    },
                },
                subMenu: [],
            },
            {
                key: 'superadmin.tools.systemVariables',
                path: `/superadmin/system-variables`,
                title: 'Variables del Sistema',
                translateKey: 'nav.superadmin.systemVariables',
                icon: 'codeBlock',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [SUPER_ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.superadmin.systemVariablesDesc',
                        label: 'Gestión de variables del sistema',
                    },
                },
                subMenu: [],
            },
            {
                key: 'superadmin.tools.chatbotBuilder',
                path: `/superadmin/chatbot-builder`,
                title: 'Constructor Visual de Chatbots',
                translateKey: 'nav.superadmin.chatbotBuilder',
                icon: 'chatBot',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [SUPER_ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.superadmin.chatbotBuilderDesc',
                        label: 'Constructor visual de flujos de chatbot',
                    },
                },
                subMenu: [],
            },
            {
                key: 'superadmin.tools.iaConfig',
                path: `/superadmin/ia-config`,
                title: 'Configuración de IA',
                translateKey: 'nav.superadmin.iaConfig',
                icon: 'robot',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [SUPER_ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.superadmin.iaConfigDesc',
                        label: 'Configuración de APIs para modelos de IA',
                    },
                },
                subMenu: [],
            },
            {
                key: 'superadmin.tools.variableBuilder',
                path: `/superadmin/variable-builder`,
                title: 'Constructor de Variables',
                translateKey: 'nav.superadmin.variableBuilder',
                icon: 'variableConfig',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [SUPER_ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.superadmin.variableBuilderDesc',
                        label: 'Constructor y gestor de variables del sistema',
                    },
                },
                subMenu: [],
            },
            {
                key: 'superadmin.tools.notificationBuilder',
                path: `/superadmin/notification-builder`,
                title: 'Constructor de Notificaciones',
                translateKey: 'nav.superadmin.notificationBuilder',
                icon: 'notificationSettings',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [SUPER_ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.superadmin.notificationBuilderDesc',
                        label: 'Configuración y gestión de notificaciones',
                    },
                },
                subMenu: [],
            },
            {
                key: 'superadmin.tools.moduleEditor',
                path: `/superadmin/module-editor`,
                title: 'Editor de Módulos',
                translateKey: 'nav.superadmin.moduleEditor',
                icon: 'settings',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [SUPER_ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.superadmin.moduleEditorDesc',
                        label: 'Editor avanzado de módulos del sistema',
                    },
                },
                subMenu: [],
            },
            {
                key: 'superadmin.tools.verticalsManager',
                path: `/superadmin/verticals-manager`,
                title: 'Verticales de Negocio',
                translateKey: 'nav.superadmin.verticalsManager',
                icon: 'branch',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [SUPER_ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.superadmin.verticalsManagerDesc',
                        label: 'Gestión de verticales de negocio',
                    },
                },
                subMenu: [],
            },
            {
                key: 'superadmin.tools.subscriptionPlans',
                path: `/superadmin/subscription-plans`,
                title: 'Planes de Suscripción',
                translateKey: 'nav.superadmin.subscriptionPlans',
                icon: 'puzzle',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [SUPER_ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.superadmin.subscriptionPlansDesc',
                        label: 'Gestión de planes de suscripción',
                    },
                },
                subMenu: [],
            },
            {
                key: 'superadmin.tools.jsonSchemaForms',
                path: `/superadmin/admin-tools/json-schema-forms`,
                title: 'Esquemas JSON',
                translateKey: 'nav.superadmin.jsonSchemaForms',
                icon: 'fileJson',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [SUPER_ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.superadmin.jsonSchemaFormsDesc',
                        label: 'Gestión de esquemas JSON para formularios dinámicos',
                    },
                },
                subMenu: [],
            },
            {
                key: 'superadmin.tools.salesFunnelDebug',
                path: `/debug/sales-funnel-integration`,
                title: 'Debug Sales Funnel',
                translateKey: 'nav.superadmin.salesFunnelDebug',
                icon: 'bug',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [SUPER_ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.superadmin.salesFunnelDebugDesc',
                        label: 'Debug de integración Sales Funnel con Chatbot',
                    },
                },
                subMenu: [],
            },
        ],
    },
    
]

export default navigationConfig