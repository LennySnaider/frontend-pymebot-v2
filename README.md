# PymeBot v2 - Plataforma de Automatización para Negocios

## Descripción

PymeBot es una plataforma SaaS integral que automatiza diversas tareas mediante sistemas complejos segmentados por industria. La plataforma incluye funcionalidades avanzadas como gestión automatizada de leads, actualización de etapas del funnel, envío de correos, concertación de citas, información sobre productos o servicios, y programación de recordatorios y acciones basadas en tiempo.

## Verticales

PymeBot agrupa industrias por similitud de funcionalidades bajo diferentes submarcas comerciales:

* **AgentProp**: Industria inmobiliaria.
* **AgentMedic**: Servicios médicos (Dentista, Doctor, Medicina Estética, Centro Terapéutico).
* **AgentFit**: Gimnasio, CrossFit, Fitness, Entrenador Personal. 
* **AgentEstetic**: Belleza y estética (Peluquería, Salón de Uñas, Salón de Depilación, Salón de Belleza, etc.).

## Componentes Principales

### 1. Chatbot de WhatsApp con IA integrada

#### Frontend
* Interfaz interactiva de chat para comunicación directa con usuarios finales.
* Desarrollado utilizando React o una librería de UI similar para asegurar una experiencia fluida y receptiva.
* Comunicación directa con el backend mediante una API para gestionar envío y recepción de mensajes.

#### Backend
* Desarrollado en Node.js utilizando la librería `@bot-whatsapp/bot`.
* Manejo integral de lógica para:
  * Procesamiento inteligente de mensajes entrantes mediante integración con IA.
  * Consultas automáticas sobre servicios, productos, horarios disponibles.
  * Agendamiento automático de citas con confirmación inmediata.
  * Interacciones naturales y respuestas personalizadas que simulan conversaciones humanas.
* Integración robusta con la API de WhatsApp Business para asegurar la comunicación efectiva.
* Almacenamiento estructurado de información en Supabase (usuarios, propiedades, conversaciones, citas).

### 2. Panel de Administración (Dashboard)

#### Frontend
* Interfaz web accesible y segura para agentes y administradores.
* Construida con Next.js, basada en la plantilla ECME para garantizar coherencia visual y funcional.
* Uso de componentes UI reutilizables, facilitando el mantenimiento y la escalabilidad.
* Gestión del estado mediante React Context para una comunicación efectiva entre componentes.

#### Backend
* Servidor backend con Next.js, gestionando lógica del servidor y APIs.
* Comunicación eficaz con Supabase para la gestión integral de:
  * Usuarios
  * Propiedades
  * Configuraciones
  * Permisos
* Desarrollo de API RESTful robusta para interacción constante con el frontend.

### 3. Área Especial SUPERADMIN

El SUPERADMIN dispone de un área exclusiva con módulos avanzados que solo él puede acceder y administrar:

* **Constructor visual de chatbots**: Herramienta visual para crear y configurar flujos de chatbot sin necesidad de codificación.
* **Constructor de variables del sistema**: Gestión centralizada de variables globales y específicas.
* **Constructor de módulos del sistema**: Define y activa módulos específicos según el nivel de suscripción.
* **Constructor de planes de suscripción**: Herramienta para crear y gestionar diferentes niveles de servicio.
* **Constructor de plantillas de notificaciones**: Editor para crear plantillas personalizables para notificaciones.

## Nuevas Características (v2.1.0)

### Integración de Chatbot con Citas y SalesFunnel

La nueva actualización incluye una integración completa entre el constructor de chatbots, el sistema de citas y el funnel de ventas, permitiendo:

- **Calificación automática de leads**: Evaluación y clasificación de leads basada en respuestas.
- **Verificación de disponibilidad**: Consulta de horarios disponibles para citas desde el chatbot.
- **Agendamiento automático**: Creación de citas con actualización automática del estado del lead.
- **Generación de QR**: Códigos QR para verificación de asistencia a citas.

### Nuevos Nodos para el Constructor de Chatbot

- **CheckAvailabilityNode**: Verifica disponibilidad de citas en fechas y horarios específicos.
- **BookAppointmentNode**: Reserva citas y actualiza el estado del lead automáticamente.
- **LeadQualificationNode**: Califica y actualiza el estado de los leads según sus respuestas.

## Instalación

1. Clona este repositorio:
```bash
git clone https://github.com/tuorganizacion/pymebot-v2.git
cd pymebot-v2
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env.local
```
Edita el archivo `.env.local` con tus configuraciones.

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Arquitectura

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API routes
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Next Auth
- **Integraciones**: WhatsApp Business API, OpenAI

## Documentación

Para más información sobre cada componente, consulte los siguientes documentos:

- [CHANGELOG.md](./CHANGELOG.md) - Historial de cambios
- [TASKS_CHATBOT.md](./TASKS_CHATBOT.md) - Tareas del Constructor de Chatbot
- [TASKS_VARIABLES.md](./TASKS_VARIABLES.md) - Tareas del Constructor de Variables
- [TASKS_VOICE.md](./TASKS_VOICE.md) - Tareas del Sistema de Voz

## Licencia

Este proyecto es propiedad privada. Todos los derechos reservados.

