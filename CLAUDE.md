# Proyecto AgentProp - Plataforma PymeBot

## Descripción General

AgentProp forma parte de PymeBot, una plataforma SaaS integral que automatiza diversas tareas mediante sistemas complejos segmentados por industria. PymeBot incluye funcionalidades avanzadas como gestión automatizada de leads, actualización de etapas del funnel, envío de correos, concertación de citas, información sobre productos o servicios, y programación de recordatorios y acciones basadas en tiempo.

PymeBot agrupa industrias por similitud de funcionalidades bajo diferentes submarcas comerciales:

- **AgentProp**: Industria inmobiliaria.
- **AgentMedic**: Servicios médicos (Dentista, Doctor, Medicina Estética, Centro Terapéutico).
- **AgentFit**: Gimnasio, CrossFit, Fitness, Entrenador Personal. Incluye módulos adicionales de Reviews y Rewards para mejorar la experiencia y fidelización del cliente.
- **AgentEstetic**: Belleza y estética (Peluquería, Salón de Uñas, Salón de Depilación, Salón de Belleza, Barbería, Cejas y Pestañas, Masajes, Spa, Tatuajes, Piercing, Salón de Bronceado, Estética).

## Componentes Principales

### 1. Chatbot de WhatsApp con IA integrada

#### Frontend

- Interfaz interactiva de chat para comunicación directa con usuarios finales.
- Desarrollado utilizando React o una librería de UI similar para asegurar una experiencia fluida y receptiva.
- Comunicación directa con el backend mediante una API para gestionar envío y recepción de mensajes.

#### Backend

- Desarrollado en Node.js utilizando la librería `@bot-whatsapp/bot`.
- Manejo integral de lógica para:

    - Procesamiento inteligente de mensajes entrantes mediante integración con IA.
    - Consultas automáticas sobre servicios, productos, horarios disponibles.
    - Agendamiento automático de citas con confirmación inmediata.
    - Interacciones naturales y respuestas personalizadas que simulan conversaciones humanas.

- Integración robusta con la API de WhatsApp Business para asegurar la comunicación efectiva.
- Almacenamiento estructurado de información en Supabase (usuarios, propiedades, conversaciones, citas).
- Uso potencial de Supabase u otras herramientas similares para gestionar grandes volúmenes de interacción de manera eficiente.

### 2. Panel de Administración (Dashboard)

#### Frontend

- Interfaz web accesible y segura para agentes y administradores.
- Construida con Next.js, basada en la plantilla ECME para garantizar coherencia visual y funcional.
- Uso de componentes UI reutilizables, facilitando el mantenimiento y la escalabilidad.
- Gestión del estado mediante React Context para una comunicación efectiva entre componentes.
- Rutas protegidas y autenticación robusta mediante NextAuth.js.
- Incorporación de librerías gráficas para visualización dinámica de datos operativos y analíticos.

#### Backend

- Servidor backend con Next.js, gestionando lógica del servidor y APIs.
- Comunicación eficaz con Supabase para la gestión integral de:

    - Usuarios
    - Propiedades
    - Configuraciones
    - Permisos

- Desarrollo de API RESTful robusta para interacción constante con el frontend.
- Implementación avanzada de autenticación y autorización con NextAuth.js, asegurando seguridad y privacidad de los datos.

### 3. Área Especial SUPERADMIN

El SUPERADMIN dispone de un área exclusiva con módulos avanzados que solo él puede acceder y administrar:

- **Constructor visual de agentes/chatbots**: Herramienta visual para la creación y configuración dinámica de chatbots.
- **Constructor de variables del sistema**: Gestión centralizada de variables globales y específicas por módulos o verticales.
- **Constructor de módulos del sistema**: Permite definir y activar módulos específicos disponibles según el nivel de suscripción contratado.
- **Constructor de planes de suscripción**: Herramienta para crear y gestionar diferentes niveles de servicio y características asociadas.
- **Constructor de plantillas de notificaciones**: Editor para crear y gestionar plantillas personalizables para diversas notificaciones del sistema.
- **Constructor de nodos de chatbot**: Permite diseñar nodos personalizados para interacciones específicas dentro del chatbot.
- **Constructor de prompt blocks**: Herramienta para configurar bloques de prompts que mejoran la interacción del chatbot con los usuarios.

## Funcionalidades Específicas

Cada vertical de PymeBot cuenta con funcionalidades específicas diseñadas para cubrir sus necesidades operativas:

- **CRM (Gestión de Clientes y Prospección)**: Base de datos centralizada para gestionar relaciones con clientes y prospectos.
- **Sales Funnel**: Automatización del embudo de ventas con seguimiento detallado de cada etapa.
- **Gestión de Citas**: Sistema avanzado para la programación, seguimiento y recordatorios automáticos de citas.
- **Gestión de Servicios y Productos**: Catálogo dinámico para gestión de productos y servicios disponibles.
- **Inventario**: Control efectivo de stock y disponibilidad en tiempo real.
- **Correo**: Automatización y seguimiento de campañas de email marketing personalizadas.
- **Ventas**: Gestión integral de ventas con seguimiento de órdenes y pagos.
- **Reviews**: Recolección y gestión de reseñas y opiniones para mejorar la reputación online.
- **Rewards**: Sistema de recompensas para fidelizar clientes mediante programas de puntos y beneficios exclusivos.
- **Utilidades**: Gestión eficiente de tareas operativas y almacenamiento organizado de archivos digitales.

## Arquitectura General

AgentProp está estructurado en una arquitectura modular con componentes claramente diferenciados para frontend y backend, asegurando separación de responsabilidades, escalabilidad y fácil mantenimiento.

- **Nivel Chatbot:** Interacción directa con usuarios a través de WhatsApp, gestionando consultas en tiempo real con respuestas inteligentes y automatización operativa.
- **Nivel Administrativo:** Herramientas avanzadas para la gestión interna y operativa de la plataforma, ofreciendo herramientas analíticas y administrativas robustas para los agentes.
- **Nivel SUPERADMIN:** Acceso exclusivo a herramientas avanzadas de configuración y gestión del sistema.

## Beneficios Clave

- Automatización efectiva de procesos específicos por industria.
- Comunicación instantánea e inteligente con clientes potenciales.
- Gestión centralizada y segura de datos específicos por vertical.
- Escalabilidad garantizada mediante una arquitectura modular.
- Seguridad avanzada a través de autenticación y autorización robustas.

## Consideraciones Técnicas

- La integración del chatbot con WhatsApp utiliza el estándar oficial de la API de WhatsApp Business.
- El manejo del estado y los datos se optimiza mediante tecnologías avanzadas como Supabase, asegurando rendimiento y escalabilidad.
- El frontend del panel administrativo sigue patrones establecidos en la plantilla ECME, aprovechando las mejores prácticas en Next.js y React.
- Los archivos nuevos que codees no deben de pasar de 600 lineas de codigo maximo.
- No crees migraciones y archivos scripts, usa MCP de supabase si es necesario
- Si debes de modificar la base de datos o crear una nueva tabla usa el MCP de supabase, debes de pedirme autorizacion y despues actualizar los respectivos types
- Importante, el sales funnel esta muy avanzado, pero no esta al 100% funcional por algunos bugs, NO hay que rehacerlo hay solo que ver lo que falla y arreglarlo.

Esta documentación ofrece una visión clara y organizada del proyecto AgentProp y del sistema PymeBot, facilitando su desarrollo, mantenimiento y escalabilidad futura.

- @docs/01-ecme-manual.md
- @docs/Internacionalizacion.md
- @docs/plan-maestro-unificado.md

# Configuración de timeout para comandos

- Incrementar timeout de build a 15 minutos
- Usar ./build-with-timeout.sh o ./incremental-build-improved.sh para compilar
- Evitar usar swcMinify en Next.js 15.1.6
- Mantener NODE_OPTIONS="--max-old-space-size=16384" para compilaciones