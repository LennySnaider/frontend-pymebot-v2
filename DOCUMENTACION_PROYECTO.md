# Documentación del Proyecto PymeBot v2 Frontend

## Índice

1. [Visión General](#visión-general)
2. [Estado del Proyecto](#estado-del-proyecto)
3. [Arquitectura](#arquitectura)
4. [Módulos Principales](#módulos-principales)
5. [Tareas del Chatbot](#tareas-del-chatbot)
6. [Tareas de Variables](#tareas-de-variables)
7. [Tareas de Voz](#tareas-de-voz)
8. [Integración SalesFunnel](#integración-salesfunnel)
9. [Guías de Desarrollo](#guías-de-desarrollo)

## Visión General

PymeBot v2 es una plataforma SaaS integral que automatiza diversas tareas mediante sistemas complejos segmentados por industria. La plataforma incluye funcionalidades avanzadas como:

- Gestión automatizada de leads
- Actualización de etapas del funnel
- Envío de correos automatizados
- Concertación de citas
- Información sobre productos o servicios
- Programación de recordatorios y acciones basadas en tiempo

### Verticales Soportadas

- **AgentProp**: Industria inmobiliaria
- **AgentMedic**: Servicios médicos (Dentista, Doctor, Medicina Estética, Centro Terapéutico)
- **AgentFit**: Gimnasio, CrossFit, Fitness, Entrenador Personal
- **AgentEstetic**: Belleza y estética (Peluquería, Salón de Uñas, etc.)

## Estado del Proyecto

### Progreso General
- **Fase 1**: 100% completada - Arquitectura modular y sistema core ✅
- **Fase 2**: 80% completada - SalesFunnel y Horarios de Negocio
- **Fase 3**: En progreso - Integración Chatbot Avanzada

### Logros Recientes
- Arquitectura modular 100% implementada ✅
- Sistema de carga dinámica de componentes por vertical ✅
- CRUD completo de verticales para superadmin ✅
- Gestión de tipos de negocios por vertical ✅
- Sistema completo de permisos con componentes UI ✅
- Editor de módulos completamente implementado ✅
- Dashboard de superadmin funcional ✅
- Sincronización en tiempo real de leads ✅

## Arquitectura

### Frontend
- **Framework**: Next.js 15 con React 19 (experimental)
- **UI**: Tailwind CSS + Componentes personalizados
- **Estado**: Zustand + Context API
- **Autenticación**: NextAuth.js
- **Base de datos**: Supabase (PostgreSQL)
- **Constructor visual**: ReactFlow

### Backend
- **API**: Next.js API Routes
- **Integración WhatsApp**: BuilderBot + Baileys
- **IA**: MiniMax/OpenAI
- **Multi-tenancy**: Row Level Security (RLS) en Supabase

### Estructura de Carpetas
```
src/
├── app/                    # App Router de Next.js
│   ├── (auth-pages)/      # Páginas de autenticación
│   ├── (protected-pages)/ # Páginas protegidas
│   │   ├── modules/       # Módulos de la aplicación
│   │   ├── superadmin/    # Panel de superadmin
│   │   └── vertical-*/    # Páginas específicas por vertical
│   └── api/               # API Routes
├── components/            # Componentes reutilizables
├── services/             # Servicios y lógica de negocio
├── stores/               # Stores de Zustand
├── hooks/                # Custom hooks
└── utils/                # Utilidades
```

## Módulos Principales

### 1. Chatbot Builder
- Constructor visual de flujos de conversación
- Nodos drag & drop con conexiones visuales
- Integración con variables del sistema
- Exportación/importación de plantillas
- Persistencia en Supabase + localStorage

### 2. Sales Funnel
- Gestión visual de etapas de venta
- Drag & drop de leads entre etapas
- Sincronización en tiempo real
- Integración con chat y citas

### 3. Sistema de Citas
- Calendario visual interactivo
- Configuración de horarios de negocio
- Gestión de excepciones y días festivos
- Integración con chatbot para reservas automáticas

### 4. Gestión de Leads
- Base de datos centralizada
- Seguimiento de interacciones
- Historial de conversaciones
- Métricas y análisis

## Tareas del Chatbot

### Fase 1: Constructor Visual ✅ COMPLETADO
- [x] Flujo visual horizontal
- [x] Persistencia en localStorage + Supabase
- [x] Manejo coherente de IDs
- [x] Importación/exportación de plantillas
- [x] Nodos básicos implementados

### Fase 2: Integración con Backend (EN PROGRESO)
- [x] Conversión de plantillas visuales a BuilderBot
- [x] Pruebas de flujos básicos
- [ ] Integración completa con WhatsApp
- [ ] Sistema de variables dinámicas

### Fase 3: Funcionalidades Avanzadas
- [ ] Nodos de negocio (citas, productos, servicios)
- [ ] Integración con IA para respuestas
- [ ] Analytics y métricas de conversación
- [ ] A/B testing de flujos

## Tareas de Variables

### Sistema de Variables ✅ COMPLETADO
- [x] Variables globales del sistema
- [x] Variables por tenant
- [x] Variables de sesión
- [x] Editor visual de variables
- [x] Validación de tipos

### Pendiente
- [ ] Variables computadas
- [ ] Variables condicionales
- [ ] Importación/exportación masiva

## Tareas de Voz

### Fase 1: Infraestructura Básica ✅
- [x] Integración con proveedores TTS/STT
- [x] Nodos de voz en el builder
- [x] Configuración por idioma

### Fase 2: Funcionalidades Avanzadas
- [ ] Detección automática de idioma
- [ ] Voces personalizadas por vertical
- [ ] Mejora de calidad de audio
- [ ] Manejo de ruido ambiente

## Integración SalesFunnel

### Completado ✅
- [x] Sincronización bidireccional chat-funnel
- [x] Actualización automática de etapas
- [x] Movimiento de leads por acciones del bot
- [x] Historial de cambios

### En Progreso
- [ ] Reglas de negocio complejas
- [ ] Automatizaciones basadas en tiempo
- [ ] Notificaciones push
- [ ] Integración con CRM externos

## Guías de Desarrollo

### Convenciones de Código
- **TypeScript**: Usar tipos explícitos
- **Componentes**: Functional components con hooks
- **Estilos**: Tailwind CSS + CSS modules cuando sea necesario
- **Estado**: Zustand para estado global, useState para local
- **Formularios**: React Hook Form + Zod para validación

### Testing
- **Unit tests**: Jest + React Testing Library
- **E2E tests**: Playwright
- **Coverage mínimo**: 80%

### Deployment
- **Desarrollo**: `npm run dev`
- **Build**: `npm run build` o `./build-with-more-memory.sh`
- **Producción**: Vercel/Railway
- **Variables de entorno**: Ver `.env.example`

### Debugging
- Componentes de debug disponibles en desarrollo
- Logs estructurados con niveles
- React DevTools + Redux DevTools
- Supabase Studio para inspección de DB

## Recursos Adicionales

- [README.md](./README.md) - Instrucciones de instalación
- [CLAUDE.md](./CLAUDE.md) - Guía para el asistente IA
- [CHANGELOG.md](./CHANGELOG.md) - Historial de cambios
- [TAREAS_PENDIENTES.md](./TAREAS_PENDIENTES.md) - Lista de tareas prioritarias

---

*Última actualización: 24 de Mayo de 2025*