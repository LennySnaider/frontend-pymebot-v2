/**
 * frontend/src/utils/cssStyles.ts
 * Utilidades para gestionar estilos CSS y clases de manera programática
 * @version 1.0.0
 * @updated 2025-06-05
 */

/**
 * Combina múltiples nombres de clases en una sola cadena, eliminando clases undefined o false
 * @param classes - Lista de clases a combinar
 * @returns String con las clases combinadas
 */
export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Convierte un objeto de estilos a un string de estilos inline
 * @param styles - Objeto con los estilos
 * @returns String con los estilos en formato CSS
 */
export function styleToString(styles: Record<string, string | number>): string {
  return Object.keys(styles).reduce((acc, key) => {
    const kebabCaseKey = key.replace(/([A-Z])/g, match => `-${match.toLowerCase()}`);
    return `${acc}${kebabCaseKey}:${styles[key]};`;
  }, '');
}

/**
 * Crea un string de estilos para sombras con diferentes intensidades
 * @param color - Color base para la sombra (formato hex, rgb, etc)
 * @param intensity - Intensidad de 1 a 5
 * @returns Objeto con estilos CSS
 */
export function createShadow(color: string, intensity: number = 3) {
  const intensityMap = {
    1: '0 2px 8px 0',
    2: '0 4px 12px 0',
    3: '0 8px 16px 0',
    4: '0 12px 24px 0',
    5: '0 16px 32px 0',
  };
  
  const shadowIntensity = intensityMap[intensity as keyof typeof intensityMap] || intensityMap[3];
  
  return {
    boxShadow: `${shadowIntensity} ${color}`,
  };
}

/**
 * Crea estilos para transiciones CSS
 * @param props - Propiedades a las que aplicar la transición
 * @param duration - Duración en ms
 * @param easing - Función de easing (por defecto ease-in-out)
 * @returns Objeto con estilos CSS
 */
export function createTransition(
  props: string | string[] = ['all'], 
  duration: number = 300, 
  easing: string = 'ease-in-out'
) {
  const properties = Array.isArray(props) ? props.join(', ') : props;
  
  return {
    transition: `${properties} ${duration}ms ${easing}`,
  };
}

/**
 * Crea un objeto de estilos para gradientes
 * @param direction - Dirección del gradiente (to right, to bottom, etc)
 * @param colors - Array de colores para el gradiente
 * @returns Objeto con estilos CSS
 */
export function createGradient(direction: string = 'to right', colors: string[]) {
  return {
    background: `linear-gradient(${direction}, ${colors.join(', ')})`,
  };
}

/**
 * Devuelve estilos CSS para manejo de texto truncado
 * @param line - Número de líneas a mostrar antes de truncar
 * @returns Objeto con estilos CSS
 */
export function textTruncate(line: number = 1) {
  return {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: line,
    WebkitBoxOrient: 'vertical',
  };
}

export default {
  classNames,
  styleToString,
  createShadow,
  createTransition,
  createGradient,
  textTruncate
};