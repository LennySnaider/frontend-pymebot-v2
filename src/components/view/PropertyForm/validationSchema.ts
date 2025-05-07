// /**
//  * frontend/src/components/view/PropertyForm/validationSchema.ts
//  * Esquema de validación para el formulario de propiedades.
//  * Actualizado para permitir valores decimales en el campo de baños.
//  * 
//  * @version 1.1.0
//  * @updated 2025-06-23
//  */

// import { z } from 'zod'
// import type { PropertyFormSchema } from './types'
// import type { ZodType } from 'zod'

// // Esquema de validación con Zod para los datos del formulario
// export const validationSchema: ZodType<PropertyFormSchema> = z.object({
//     name: z.string().min(1, { message: 'Nombre de la propiedad requerido' }),
//     propertyCode: z
//         .string()
//         .min(1, { message: 'Código de propiedad requerido' }),
//     description: z
//         .string()
//         .min(1, { message: 'Descripción de la propiedad requerida' }),
//     status: z.enum(['available', 'sold', 'rented', 'pending', 'reserved']), // Estado de la propiedad
//     propertyType: z.enum([
//         'house',
//         'apartment',
//         'land',
//         'commercial',
//         'office',
//         'industrial',
//     ]), // Tipo de propiedad
//     operationType: z.enum(['sale', 'rent']), // Tipo de operación (venta o renta)
//     price: z.union([z.string(), z.number()], {
//         // Precio puede ser string o número inicialmente
//         errorMap: () => ({ message: 'Precio requerido' }),
//     }),
//     currency: z.string().min(1, { message: 'Moneda requerida' }),
//     features: z.object({
//         bedrooms: z.number().int().nonnegative(),
//         // Permitir valores decimales para baños (0, 0.5, 1, 1.5, 2, 2.5, etc.)
//         bathrooms: z.number().nonnegative().multipleOf(0.5),
//         area: z.number().nonnegative(),
//         parkingSpots: z.number().int().nonnegative(),
//         yearBuilt: z.number().int().min(1900).max(2100).optional(),
//         hasPool: z.boolean(),
//         hasGarden: z.boolean(),
//         hasGarage: z.boolean(),
//         hasSecurity: z.boolean(),
//     }),
//     location: z.object({
//         address: z.string().min(1, { message: 'Dirección requerida' }),
//         city: z.string().min(1, { message: 'Ciudad requerida' }),
//         state: z.string().min(1, { message: 'Estado requerido' }),
//         zipCode: z.string().transform((val) => val === '' ? null : val),
//         country: z.string(),
//         colony: z.string().optional(),
//         // Añadir showApproximateLocation como un booleano
//         showApproximateLocation: z
//             .union([z.boolean(), z.string()])
//             .transform((val) => {
//                 // Convertir SIEMPRE a un booleano nativo
//                 if (typeof val === 'string') {
//                     return val === 'true';
//                 }
//                 // Si es undefined o null, asumimos false
//                 if (val === undefined || val === null) {
//                     return false;
//                 }
//                 // Asegurar que sea un booleano
//                 return Boolean(val);
//             }),
//         coordinates: z.object({
//             lat: z.number(),
//             lng: z.number(),
//         }),
//     }),
//     media: z.array(
//         z.object({
//             id: z.string(),
//             type: z.enum(['image', 'video']),
//             url: z.string(),
//             thumbnail: z.string().optional(),
//             title: z.string().optional(),
//             isPrimary: z.boolean().optional(),
//         })
//     ),
//     agentId: z.string(),
//     // Campo adicional show_approximate_location a nivel raíz para compatibilidad
//     show_approximate_location: z
//         .union([z.boolean(), z.string()])
//         .transform((val) => {
//             // Convertir SIEMPRE a un booleano nativo
//             if (typeof val === 'string') {
//                 return val === 'true';
//             }
//             // Si es undefined o null, asumimos false
//             if (val === undefined || val === null) {
//                 return false;
//             }
//             // Asegurar que sea un booleano
//             return Boolean(val);
//         }),
// })

// export default validationSchema


/**
 * frontend/src/components/view/PropertyForm/validationSchema.ts
 * Esquema de validación para el formulario de propiedades.
 * Revertido transform para showApproximateLocation anidado.
 *
 * @version 1.3.0
 * @updated 2025-04-05
 */

import { z } from 'zod';
import type { PropertyFormSchema } from './types'; // Asegúrate que la ruta sea correcta
import type { ZodType } from 'zod';

// Esquema de validación con Zod para los datos del formulario
export const validationSchema: ZodType<PropertyFormSchema> = z.object({
    // --- Campos Generales ---
    id: z.string().optional(),
    name: z.string().min(1, { message: 'Nombre de la propiedad requerido' }),
    propertyCode: z
        .string()
        .min(1, { message: 'Código de propiedad requerido' }),
    description: z
        .string()
        .min(1, { message: 'Descripción de la propiedad requerida' }),
    status: z.enum(['available', 'sold', 'rented', 'pending', 'reserved']),
    propertyType: z.enum([
        'house',
        'apartment',
        'land',
        'commercial',
        'office',
        'industrial',
    ]),
    operationType: z.enum(['sale', 'rent']),

    // --- Precios ---
    price: z.union([z.string(), z.number()])
        .refine(val => val !== '', { message: 'Precio requerido' })
        .transform(val => Number(val)),
    currency: z.string().min(1, { message: 'Moneda requerida' }),

    // --- Características ---
    features: z.object({
        bedrooms: z.number().int().nonnegative(),
        bathrooms: z.number().nonnegative().multipleOf(0.5, { message: 'Debe ser entero o terminar en .5' }),
        area: z.number().nonnegative(),
        parkingSpots: z.number().int().nonnegative(),
        yearBuilt: z.number().int().min(1900).max(new Date().getFullYear() + 5).optional().nullable(),
        hasPool: z.boolean().default(false),
        hasGarden: z.boolean().default(false),
        hasGarage: z.boolean().default(false),
        hasSecurity: z.boolean().default(false),
    }),

    // --- Ubicación ---
    location: z.object({
        address: z.string().min(1, { message: 'Dirección requerida' }),
        city: z.string().min(1, { message: 'Ciudad requerida' }),
        state: z.string().min(1, { message: 'Estado requerido' }),
        zipCode: z.string().min(5, { message: 'CP debe tener 5 dígitos' }).max(5).optional().nullable(),
        country: z.string().default('México'),
        colony: z.string().optional().nullable(),

        // --- REVERTIDO a la versión con .union y .transform ---
        showApproximateLocation: z
            .union([z.boolean(), z.string()]) // Aceptar boolean o string como entrada
            .optional() // Hacerlo opcional por si no viene
            .transform((val) => {
                // Convertir SIEMPRE a un booleano nativo para la salida
                console.log(`Transformando showApproximateLocation, input: ${val} (tipo: ${typeof val})`); // Log de depuración
                if (typeof val === 'string') {
                    const result = val.toLowerCase() === 'true';
                    console.log(`Transformado de string a boolean: ${result}`);
                    return result;
                }
                // Si es undefined o null (porque era opcional), asumimos false por defecto
                if (val === undefined || val === null) {
                     console.log(`Transformado de undefined/null a boolean: false`);
                    return false;
                }
                // Si ya es booleano, devolverlo tal cual
                console.log(`Valor ya es boolean: ${Boolean(val)}`);
                return Boolean(val); // Asegurar que siempre sea boolean
            }),
        // --- FIN REVERSIÓN ---

        coordinates: z.object({
            lat: z.number(),
            lng: z.number(),
        }),
    }).optional().nullable(),

    // --- Media ---
    media: z.array(
        z.object({
            id: z.string(),
            type: z.enum(['image', 'video']),
            url: z.string(),
            thumbnail: z.string().optional(),
            title: z.string().optional(),
            isPrimary: z.boolean().optional(),
            cropZoom: z.number().optional(),
            cropPosition: z.object({ x: z.number(), y: z.number() }).optional(),
            displayOrder: z.number().optional(),
        })
    ).min(0),

    // --- Agente ---
    agentId: z.string().min(1, { message: 'Agente requerido' }),

    // --- Campo id opcional ---

}); // Fin del z.object principal

export default validationSchema;

