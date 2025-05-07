/**
 * utils/propertyDataSheet/pdfTemplate.ts
 * Plantilla HTML para la generación de fichas técnicas en PDF
 * Versión completamente reescrita con un enfoque más simple y directo
 * 
 * @version 5.2.0
 * @updated 2025-04-10
 */

import { formatCurrency, getOperationTypeColor, getOperationTypeName, getPropertyTypeName, getStatusName, formatLocation, hasApproximateLocation } from './formatters';
import { getPropertyImages } from './imageUtils';
import { generateMapTemplate } from './mapTemplate';
import { Property } from '@/app/(protected-pages)/modules/properties/property-list/types';

/**
 * Genera el HTML para la ficha técnica de una propiedad
 */
export const generatePropertyHTML = (property: Property): string => {
  const { mainImageUrl, imageUrl1, imageUrl2, imageUrl3 } = getPropertyImages(property);
  const isApproximate = hasApproximateLocation(property);
  
  // Obtener el color primario del tema (si estamos en el navegador)
  const primaryColor = typeof window !== 'undefined' 
    ? getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2563eb'
    : '#2563eb';
  
  // Generar el HTML del mapa de forma síncrona
  const mapHTML = generateMapTemplate(
    property.location?.city || '', 
    property.location?.state || '', 
    isApproximate,
    primaryColor
  );
  
  return `
    <div style="margin: 0; padding: 0; width: 100%; max-width: 735px; margin: 0 auto; position: relative; min-height: 100vh; padding-bottom: 30px; box-sizing: border-box;">
      <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div><h1 style="color: ${primaryColor}; margin: 0; font-size: 20px; line-height: 1.2;">FICHA TÉCNICA</h1></div>
        ${property.operationType ? `<div style="background-color: ${getOperationTypeColor(property.operationType)}; color: white; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px;">${getOperationTypeName(property.operationType)}</div>` : ''}
      </div>
      
      <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
        <h2 style="color: #1e293b; margin: 0; font-size: 18px; line-height: 1.3; max-width: 65%; font-weight: 600;">
          ${property.name || 'Propiedad sin nombre'}
          <span style="color: #64748b; font-size: 12px; font-weight: normal; display: block; margin-top: 4px;">ID: ${property.propertyCode || property.id || 'N/A'}</span>
        </h2>
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #111827; text-align: right;">
          ${formatCurrency(property.price || 0, property.currency)}
          <span style="font-size: 12px; font-weight: normal; color: #6b7280; display: block; margin-top: 4px;">${property.operationType === 'rent' ? 'por mes' : ''} ${property.currency || ''}</span>
        </p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <!-- Imagen principal con aspect ratio 16:9 -->
        <div style="margin-bottom: 8px; width: 100%; position: relative; padding-top: 56.25%; background-color: #f1f5f9; border-radius: 6px; overflow: hidden;">
          <img src="${mainImageUrl}" alt="Vista principal" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; display: block;" crossorigin="anonymous" />
        </div>
        
        <!-- Miniaturas con aspect ratio 16:9 en contenedor con altura fija -->
        <div style="display: flex; gap: 8px;">
          <div style="flex: 1; position: relative; padding-top: 18.75%; background-color: #f1f5f9; border-radius: 4px; overflow: hidden;">
            <img src="${imageUrl1}" alt="Imagen 1" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; display: block;" crossorigin="anonymous" />
          </div>
          <div style="flex: 1; position: relative; padding-top: 18.75%; background-color: #f1f5f9; border-radius: 4px; overflow: hidden;">
            <img src="${imageUrl2}" alt="Imagen 2" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; display: block;" crossorigin="anonymous" />
          </div>
          <div style="flex: 1; position: relative; padding-top: 18.75%; background-color: #f1f5f9; border-radius: 4px; overflow: hidden;">
            <img src="${imageUrl3}" alt="Imagen 3" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; display: block;" crossorigin="anonymous" />
          </div>
        </div>
      </div>
      
      <div style="display: flex; gap: 20px;">
        <div style="flex: 1.5; display: flex; flex-direction: column; min-width: 0;">
          <div style="margin-bottom: 16px;">
            <h3 style="color: #334155; margin: 0 0 6px 0; font-size: 16px; font-weight: 600;">Información Básica</h3>
            <hr style="border: 0; height: 1px; background-color: #e2e8f0; margin: 3px 0 8px 0;">
            <div style="font-size: 13px; line-height: 1.5;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span><strong>Tipo:</strong> ${getPropertyTypeName(property.propertyType || '')}</span> 
                <span><strong>Estado:</strong> ${getStatusName(property.status || '')}</span>
              </div>
              <div style="word-break: break-word;"><strong>Ubicación:</strong> ${formatLocation(property)}</div>
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <h3 style="color: #334155; margin: 0 0 6px 0; font-size: 16px; font-weight: 600;">Características</h3>
            <hr style="border: 0; height: 1px; background-color: #e2e8f0; margin: 3px 0 8px 0;">
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
              ${property.features?.bedrooms ? `<div style="min-width: 60px; text-align: center; padding: 6px; background-color: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;"><div style="font-size: 11px; color: #475569;">Hab.</div><div style="font-weight: bold; font-size: 14px;">${property.features.bedrooms}</div></div>` : ''}
              ${property.features?.bathrooms ? `<div style="min-width: 60px; text-align: center; padding: 6px; background-color: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;"><div style="font-size: 11px; color: #475569;">Baños</div><div style="font-weight: bold; font-size: 14px;">${property.features.bathrooms}</div></div>` : ''}
              ${property.features?.area ? `<div style="min-width: 60px; text-align: center; padding: 6px; background-color: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;"><div style="font-size: 11px; color: #475569;">Área</div><div style="font-weight: bold; font-size: 14px;">${property.features.area} m²</div></div>` : ''}
              ${property.features?.parkingSpots ? `<div style="min-width: 60px; text-align: center; padding: 6px; background-color: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;"><div style="font-size: 11px; color: #475569;">Est.</div><div style="font-weight: bold; font-size: 14px;">${property.features.parkingSpots}</div></div>` : ''}
            </div>
            <div style="font-size: 12px; line-height: 1.5; color: #475569; word-wrap: break-word;">
              ${property.features?.hasPool ? `<span><span style="font-size: 10px;">●</span> Piscina </span>` : ''}
              ${property.features?.hasGarden ? `<span style="margin-left: 10px;"><span style="font-size: 10px;">●</span> Jardín </span>` : ''}
              ${property.features?.hasGarage ? `<span style="margin-left: 10px;"><span style="font-size: 10px;">●</span> Garage </span>` : ''}
              ${property.features?.hasSecurity || property.features?.securitySystem ? `<span style="margin-left: 10px;"><span style="font-size: 10px;">●</span> Seguridad </span>` : ''}
              ${property.features?.yearBuilt ? `<span style="margin-left: 10px;"><span style="font-size: 10px;">●</span> Año: ${property.features.yearBuilt}</span>` : ''}
            </div>
          </div>
          
          <div style="flex-grow: 1; overflow: hidden;">
            <h3 style="color: #334155; margin: 0 0 6px 0; font-size: 16px; font-weight: 600;">Descripción</h3>
            <hr style="border: 0; height: 1px; background-color: #e2e8f0; margin: 3px 0 8px 0;">
            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #374151;">
              ${property.description || 'Descripción no disponible.'}
            </p>
          </div>
        </div>
        
        <div style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background-color: #f8fafc; margin-bottom: 16px; flex-shrink: 0;">
            <h3 style="color: #334155; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Información de Contacto</h3>
            <div style="font-size: 13px; line-height: 1.5;">
              ${property.agentName ? `<p style="margin: 4px 0;"><strong>Agente:</strong> ${property.agentName}</p>` : ''}
              ${property.agentEmail ? `<p style="margin: 4px 0; word-break: break-all;"><strong>Email:</strong> ${property.agentEmail}</p>` : ''}
              ${property.agentPhone ? `<p style="margin: 4px 0;"><strong>Tel:</strong> ${property.agentPhone}</p>` : ''}
            </div>
            <p style="margin: 8px 0 0 0; font-size: 10px; text-align: right; color: #64748b;">www.pymebot.ai</p>
          </div>
          
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background-color: #f8fafc; flex-grow: 1; display: flex; flex-direction: column;">
            <h3 style="color: #334155; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Ubicación</h3>
            
            <!-- Mapa con aspect ratio 16:9 -->
            <div style="width: 100%; position: relative; padding-top: 56.25%; border-radius: 4px; overflow: hidden; flex-grow: 1;">
              ${mapHTML}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer sticky que siempre está al fondo de la página -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; border-top: 1px solid #e2e8f0; padding-top: 8px; padding-bottom: 8px; background-color: white;">
        <p style="color: #64748b; margin: 0; font-size: 9px; text-align: center; line-height: 1.3;">
          Esta ficha técnica es para fines informativos. La información puede estar sujeta a cambios. © ${new Date().getFullYear()} PymeBot.
        </p>
      </div>
    </div>
  `;
};
