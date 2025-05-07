/**
 * frontend/src/utils/cn.ts
 * Utilidad para combinar clases de CSS condicionales.
 * Basada en la librería clsx/classnames, pero implementada de forma ligera.
 * 
 * @version 1.0.0
 * @updated 2025-04-30
 */

/**
 * Combina múltiples clases CSS con soporte para condicionales
 * @param args Clases CSS, objetos con clases condicionales o arrays
 * @returns String con las clases combinadas
 * @example
 * // Uso básico
 * cn('btn', 'btn-primary') // => 'btn btn-primary'
 * 
 * // Con condicionales
 * cn('btn', { 'btn-primary': isPrimary, 'btn-secondary': !isPrimary })
 * 
 * // Con arrays
 * cn('btn', ['btn-lg', isActive && 'active'])
 */
export function cn(...args: any[]): string {
    const classes = [];
    
    for (const arg of args) {
        if (!arg) continue;
        
        const argType = typeof arg;
        
        if (argType === 'string' || argType === 'number') {
            classes.push(arg);
        } else if (Array.isArray(arg)) {
            const inner = cn(...arg);
            if (inner) {
                classes.push(inner);
            }
        } else if (argType === 'object') {
            for (const key in arg) {
                if (Object.prototype.hasOwnProperty.call(arg, key) && arg[key]) {
                    classes.push(key);
                }
            }
        }
    }
    
    return classes.join(' ');
}

export default cn;
