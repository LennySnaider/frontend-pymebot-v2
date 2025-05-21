# Guía para Manejo de Params en API Routes de NextJS 15

## ⚠️ Problema identificado

En NextJS 15, los parámetros dinámicos de rutas (`[param]`) deben ser **esperados** antes de utilizarlos. 
No seguir esta pauta genera errores como:

```
Error: Route "/api/leads/update/[id]" used `params.id`. `params` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
```

## ✅ Solución correcta

### 1. Definir parámetros como Promise

```typescript
// ❌ INCORRECTO
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  ...
}

// ✅ CORRECTO
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  ...
}
```

### 2. Siempre esperar (await) params antes de acceder a sus propiedades

```typescript
// ❌ INCORRECTO
const leadId = params?.id ? String(params.id) : '';

// ✅ CORRECTO
const resolvedParams = await params;
const leadId = resolvedParams?.id ? String(resolvedParams.id) : '';
```

## 🛠️ Proceso para corregir rutas

Para cada API route con parámetros dinámicos:

1. Cambia la definición del tipo de params por `Promise<{ ... }>`
2. Agrega `const resolvedParams = await params;` antes de usar cualquier propiedad
3. Reemplaza `params.xxx` por `resolvedParams.xxx` en todo el código

## 📋 Ejemplos de implementación

### Ejemplo de GET con params

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolver parámetros primero
    const resolvedParams = await params;
    
    // Ahora extraer ID de forma segura
    const agentId = resolvedParams?.id ? String(resolvedParams.id) : '';
    
    // Resto del código...
  } catch (error) {
    // Manejo de errores...
  }
}
```

### Ejemplo de PUT con params y validación

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string, [key: string]: string | string[] }> }
) {
  try {
    // Resolver parámetros primero
    const resolvedParams = await params;
    
    // Extraer y validar ID
    const leadId = resolvedParams?.id ? String(resolvedParams.id) : '';
    
    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'ID no proporcionado' },
        { status: 400 }
      );
    }
    
    // Procesar body de la petición
    const body = await request.json();
    
    // Resto del código...
  } catch (error) {
    // Manejo de errores...
  }
}
```

## 🔍 Verificación

Después de aplicar estos cambios:

1. No deberían aparecer errores de compilación relacionados con `params`
2. Las rutas API deberían funcionar correctamente con parámetros dinámicos
3. El sistema de tipos TypeScript ayudará a identificar posibles errores

## 📌 Nota importante

Este cambio es obligatorio en NextJS 15 y posterior. Asegúrate de aplicarlo a todas las rutas API que usen parámetros dinámicos, especialmente después de actualizaciones del framework.

---

*Documento creado: Mayo 2025*