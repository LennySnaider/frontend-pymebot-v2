/**
 * Utilidad para formatear valores monetarios según la moneda especificada.
 * 
 * @param value - El valor a formatear
 * @param currency - El código de moneda (por defecto 'MXN')
 * @param locale - El código de localización (por defecto 'es-MX')
 * @returns El valor formateado como string
 */
export const formatCurrency = (
    value: number | string | null | undefined,
    currency: string = 'MXN',
    locale: string = 'es-MX'
): string => {
    // Si el valor es nulo, indefinido o vacío, devolver un guión
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    // Convertir a número si es un string
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;

    // Si no es un número válido después de la conversión, devolver un guión
    if (isNaN(numericValue)) {
        return '-';
    }

    // Utilizar Intl.NumberFormat para formatear según la moneda y localización
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numericValue);
};