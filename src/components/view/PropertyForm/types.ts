/**
 * frontend/src/components/view/PropertyForm/types.ts
 * Tipos y esquema Zod para el formulario de propiedades inmobiliarias.
 * Actualizado para usar Zod como fuente de verdad y eliminar duplicación.
 *
 * @version 1.4.0
 * @updated 2025-10-15
 */

import { z } from 'zod'
import type { Control, FieldErrors } from 'react-hook-form'

// --- Tipos Enumerales ---
export const propertyStatusSchema = z.enum(['available', 'sold', 'rented', 'pending', 'reserved'])
export const propertyTypeSchema = z.enum(['house', 'apartment', 'land', 'commercial', 'office', 'industrial'])
export const operationTypeSchema = z.enum(['sale', 'rent'])

export type PropertyStatus = z.infer<typeof propertyStatusSchema>
export type PropertyType = z.infer<typeof propertyTypeSchema>
export type OperationType = z.infer<typeof operationTypeSchema>

// --- Tipos para Media (incluyendo recorte) ---
export type Point = {
    x: number
    y: number
}

// Verificación isomorphic para File que funciona tanto en cliente como servidor
const fileSchema = z.any()
  .refine(
    (file) => {
      // En servidor, permitimos cualquier valor ya que no podemos verificar File
      if (typeof window === 'undefined') return true;
      // En cliente, verificamos que sea instancia de File
      return file instanceof File;
    },
    { message: 'Debe ser un archivo válido' }
  );

export const mediaSchema = z.object({
    id: z.string(),
    type: z.enum(['image', 'video']),
    url: z.string(),
    file: fileSchema.optional(), // Funciona en cliente y servidor
    thumbnail: z.string().optional(),
    title: z.string().optional(),
    isPrimary: z.boolean().optional(),
    displayOrder: z.number().optional(),
    cropZoom: z.number().optional(),
    cropPosition: z.object({
        x: z.number(),
        y: z.number(),
    }).optional(),
    _uploading: z.boolean().optional(), // Solo en cliente
    _error: z.string().optional(), // Solo en cliente
})

export type Media = z.infer<typeof mediaSchema>

// --- Esquema Principal ---
export const propertyFormSchema = z.object({
    name: z.string().min(1, { message: 'Nombre de la propiedad requerido' }),
    propertyCode: z.string().min(1, { message: 'Código de propiedad requerido' }),
    description: z.string().min(1, { message: 'Descripción de la propiedad requerida' }),
    status: propertyStatusSchema,
    propertyType: propertyTypeSchema,
    operationType: operationTypeSchema,
    price: z.union([z.string(), z.number()], {
        errorMap: () => ({ message: 'Precio requerido' }),
    }),
    currency: z.string().min(1, { message: 'Moneda requerida' }),
    features: z.object({
        bedrooms: z.number(),
        bathrooms: z.number(),
        area: z.number(),
        parkingSpots: z.number(),
        yearBuilt: z.number().nullable().optional(),
        hasPool: z.boolean(),
        hasGarden: z.boolean(),
        hasGarage: z.boolean(),
        hasSecurity: z.boolean(),
    }),
    location: z.object({
        address: z.string().min(1, { message: 'Dirección requerida' }),
        city: z.string().min(1, { message: 'Ciudad requerida' }),
        state: z.string().min(1, { message: 'Estado requerido' }),
        zipCode: z.string().nullable().optional(),
        country: z.string(),
        colony: z.string().nullable().optional(),
        showApproximateLocation: z.boolean().optional(),
        coordinates: z.object({
            lat: z.number(),
            lng: z.number(),
        }),
    }),
    media: z.array(mediaSchema).min(1, { message: 'Al menos una imagen es requerida' }),
    agentId: z.string(),
    id: z.string().optional(),
})

export type PropertyFormSchema = z.infer<typeof propertyFormSchema>

// --- Props Base para Componentes de Sección ---
export type FormSectionBaseProps = {
    control: Control<PropertyFormSchema>
    errors: FieldErrors<PropertyFormSchema>
}