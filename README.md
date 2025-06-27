# PymeBot V2 Frontend - Arquitectura Híbrida

## 🚀 Descripción

Frontend de PymeBot V2 - Plataforma SaaS integral para automatización de chatbots segmentada por industria. Desarrollado con **Next.js 15** y **React 19**, incluye un constructor visual de chatbots con **ReactFlow** y **arquitectura híbrida** preparada para escalabilidad modular.

## 🏗️ Arquitectura Híbrida Implementada

### ✨ **Nueva Arquitectura Transparente**

El proyecto implementa una **arquitectura híbrida transparente** que permite:

- ✅ **Sistema Lineal Actual**: Funcionalidad 100% preservada
- 🔄 **Routing Condicional**: Evaluación automática de templates  
- 🏗️ **Infraestructura Modular**: Preparada para módulos V1
- 📊 **Análisis de Modernización**: Scoring automático de templates
- 🎯 **Migration Middleware**: Distribución gradual de tráfico

### Stack Tecnológico

- **Framework**: Next.js 15 con React 19 (experimental features)
- **TypeScript**: Configuración flexible (`strict: false`)
- **Estilos**: Tailwind CSS
- **UI Components**: ReactFlow para constructor visual
- **Base de Datos**: Supabase (PostgreSQL + Auth)
- **Internacionalización**: next-intl
- **Autenticación**: NextAuth.js

## 🎨 Características Principales

### Constructor Visual de Chatbots
- **Drag & Drop**: Interfaz ReactFlow para diseño visual
- **Nodos Especializados**: Messages, AI, Buttons, Lists, Conditions
- **Nodos de Negocio**: Appointments, Products, Services, Lead Qualification
- **Conversión Automática**: Templates visuales → BuilderBot flows

### Sistema Multi-Tenant
- **Aislamiento de Datos**: RLS policies en Supabase
- **Variables por Nivel**: Sistema, Tenant, Sesión
- **Templates Compartidos**: Reutilización entre tenants

### Sales Funnel Integrado
- **Progresión Automática**: Nuevos → Prospectando → Calificación → Oportunidad → Confirmado
- **Actualización Tiempo Real**: Sincronización automática con conversaciones
- **CRM Integrado**: Gestión completa de leads

## 📁 Estructura del Proyecto

```
src/
├── app/                                    # App Router (Next.js 15)
│   ├── (protected-pages)/                  # Rutas protegidas
│   │   ├── superadmin/                     # Área SUPERADMIN
│   │   │   └── chatbot-builder/            # Constructor visual
│   │   │       └── editor/                 # Editor ReactFlow
│   │   │           └── _components/        # Componentes del editor
│   │   │               └── nodes/          # Nodos del chatbot
│   │   ├── vertical-[code]/                # Rutas por vertical
│   │   └── modules/                        # Módulos por industria
│   └── api/                                # API Routes
│       ├── chatbot/                        # APIs del chatbot
│       └── auth/                           # Autenticación
├── components/                             # Componentes reutilizables
│   ├── ui/                                 # UI primitivos
│   ├── core/                               # Componentes de negocio
│   └── view/                               # Vistas específicas
├── services/                               # Servicios y APIs
│   ├── ChatService/                        # Servicio de chat
│   ├── SalesFunnelService.ts              # Gestión de sales funnel
│   └── templateService.ts                  # Gestión de templates
└── utils/                                  # Utilidades
    ├── leadSync/                           # Sincronización de leads
    └── nodeExecutors/                      # Ejecutores de nodos
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase configurada

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/LennySnaider/frontend-pymebot-v2.git
cd frontend-pymebot-v2

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

### Variables de Entorno Requeridas

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu_nextauth_secret
```

### Comandos de Desarrollo

```bash
# Desarrollo local
npm run dev

# Build optimizado
npm run build

# Build con más memoria (si hay errores)
./build-with-more-memory.sh

# Build ignorando TypeScript (emergencia)
./force-no-types-build.sh

# Lint y formato
npm run lint
npm run prettier:fix
```

## 🎯 Scripts de Build Especializados

El proyecto incluye scripts optimizados para diferentes escenarios:

- `build-with-more-memory.sh`: Build con 16GB de memoria asignada
- `force-no-types-build.sh`: Build saltando verificación de tipos
- `clean-and-build.sh`: Build limpio desde cero
- `skiptype-build.sh`: Build rápido sin type checking

## 🏢 Verticales Soportadas

- **AgentProp**: Inmobiliaria
- **AgentMedic**: Servicios médicos  
- **AgentFit**: Fitness y gimnasios
- **AgentEstetic**: Belleza y estética

Cada vertical incluye módulos específicos: CRM, Sales Funnel, Appointments, Products, Services, Reviews, Rewards.

## 🔧 Tipos de Nodos del Constructor

### Nodos Base
- `startNode`: Inicio del flujo
- `messageNode`: Mensaje simple
- `endNode`: Fin del flujo

### Nodos Interactivos  
- `buttonsNode`: Botones de respuesta
- `listNode`: Lista de opciones
- `inputNode`: Captura de datos

### Nodos de IA
- `aiNode`: Respuesta con IA
- `aiVoiceAgentNode`: Agente de voz IA

### Nodos de Negocio
- `checkAvailabilityNode`: Verificar disponibilidad
- `bookAppointmentNode`: Agendar cita
- `cancelAppointmentNode`: Cancelar cita
- `rescheduleAppointmentNode`: Reagendar cita

### Nodos de Catálogo
- `categoriesNode`: Mostrar categorías
- `productsNode`: Mostrar productos  
- `servicesNode`: Mostrar servicios

### Nodos de Gestión
- `leadQualificationNode`: Calificación de leads
- `conditionNode`: Lógica condicional
- `actionNode`: Acciones personalizadas

## 🔄 Sistema de Variables

### Niveles de Variables

1. **Sistema**: Globales (SUPERADMIN)
2. **Tenant**: Por tenant/cliente
3. **Sesión**: Runtime de conversación

### Uso en Templates

```javascript
// En nodos del chatbot
{
  "message": "Hola {{nombre}}, bienvenido a {{company_name}}"
}

// Reemplazo automático
"Hola Juan, bienvenido a Mi Empresa"
```

## 🧪 Testing de Chatbots

### Flujo de Testing

1. Crear template en editor visual
2. Activar template (`is_active: true`)
3. Test con API:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "hola",
    "userId": "test-user",
    "tenantId": "your-tenant-id"
  }'
```

## 🚧 Soluciones a Issues Comunes

1. **Error de memoria en build**: Usar `./build-with-more-memory.sh`
2. **Errores de TypeScript**: Usar `./force-no-types-build.sh`
3. **useRef is not defined**: Verificar imports al inicio del archivo
4. **Template no convierte**: Verificar estructura en `templateConverter.ts`

## 🤝 Contribución

### Reglas de Desarrollo

- ❌ **NUNCA** hardcodear variables de entorno
- ✅ **SIEMPRE** buscar módulos existentes primero  
- ✅ **SIEMPRE** seguir patrones existentes
- ✅ **SIEMPRE** verificar multi-tenant isolation
- ✅ **SIEMPRE** preservar funcionalidad del sistema de leads

### Workflow

1. Crear feature branch
2. Implementar siguiendo patrones existentes
3. Testing con diferentes templates
4. Build exitoso antes de PR

## 📄 Licencia

Proyecto privado - PymeBot V2 Platform

---

**⚠️ Nota Importante**: Este proyecto tiene implementada una **arquitectura híbrida** con el sistema de leads funcionando al 100%. La funcionalidad crítica del sales funnel está preservada - **¡NO TOCAR!**

