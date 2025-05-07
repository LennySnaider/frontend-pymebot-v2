/**
 * utils/propertyDataSheet/mapTemplate.ts
 * Plantilla para el componente de mapa en fichas técnicas de propiedades
 * Versión simplificada con mapa estático e imagen de marcador real
 * 
 * @version 5.2.0
 * @updated 2025-04-10
 */

/**
 * Genera el HTML para el mapa de ubicación - versión completamente estática
 * No requiere llamadas a APIs externas
 * 
 * @param cityName - Nombre de la ciudad
 * @param stateName - Nombre del estado
 * @param isApproximate - Si la ubicación es aproximada
 * @param accentColor - Color de acento para el pin y bordes (por defecto rojo)
 */
export const generateMapTemplate = (
  cityName: string, 
  stateName: string, 
  isApproximate: boolean,
  accentColor: string = '#E11D48'
): string => {
  const mapLocationText = `${cityName || ''}${stateName ? `, ${stateName}` : ''}`;
  const mapTitleText = isApproximate ? 'Ubicación Aproximada' : 'Ubicación';
  
  // Mapa estático mejorado con estilos visuales y color de acento personalizable
  return `
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: #DBEAFE; border-radius: 8px; overflow: hidden; border: 1px solid ${accentColor}40; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <!-- Fondo del mapa con degradado suave y cuadrícula -->
      <div style="position: absolute; width: 100%; height: 100%; background: linear-gradient(to bottom, #DBEAFE, #EFF6FF); opacity: 1;"></div>
      <div style="position: absolute; width: 100%; height: 100%; opacity: 0.3; background-image: linear-gradient(0deg, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px); background-size: 25px 25px;"></div>
      
      <!-- Simulación de calles -->
      <div style="position: absolute; top: 45%; left: -10%; width: 120%; height: 10px; background-color: rgba(255,255,255,0.8); transform: rotate(-3deg);"></div>
      <div style="position: absolute; top: 30%; left: -10%; width: 120%; height: 7px; background-color: rgba(255,255,255,0.6); transform: rotate(2deg);"></div>
      <div style="position: absolute; top: 65%; left: -10%; width: 70%; height: 8px; background-color: rgba(255,255,255,0.7);"></div>
      <div style="position: absolute; left: 70%; top: 20%; height: 75%; width: 8px; background-color: rgba(255,255,255,0.7);"></div>
      <div style="position: absolute; left: 30%; top: 0%; height: 60%; width: 9px; background-color: rgba(255,255,255,0.6);"></div>
      
      <!-- Áreas/bloques simulando manzanas -->
      <div style="position: absolute; top: 20%; left: 15%; width: 20%; height: 20%; background-color: rgba(255,255,255,0.3); border-radius: 4px;"></div>
      <div style="position: absolute; top: 50%; left: 60%; width: 15%; height: 15%; background-color: rgba(255,255,255,0.25); border-radius: 4px;"></div>
      <div style="position: absolute; top: 65%; left: 20%; width: 18%; height: 10%; background-color: rgba(255,255,255,0.2); border-radius: 4px;"></div>
      
      <!-- Marcador de mapa (pin) con color de acento -->
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -100%);">
        <svg width="40" height="53" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
          <path fill="${accentColor}" d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" style="filter:url(#shadow)"/>
          <circle cx="192" cy="192" r="56" fill="#ffffff"/>
        </svg>
      </div>
      
      <!-- Sombra del pin -->
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, 0); width: 20px; height: 6px; background-color: rgba(0,0,0,0.2); border-radius: 50%;"></div>
      
      <!-- Caja de información de ubicación con borde del color de acento -->
      <div style="position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); width: 85%; background-color: white; padding: 10px; border-radius: 6px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.15); border: 1px solid ${accentColor}20;">
        <span style="font-size: 13px; font-weight: 600; color: ${accentColor}; display: block; margin-bottom: 2px;">${mapTitleText}</span>
        <span style="font-size: 11px; color: #334155; display: block;">${mapLocationText || 'No especificada'}</span>
      </div>
    </div>
  `;
};
