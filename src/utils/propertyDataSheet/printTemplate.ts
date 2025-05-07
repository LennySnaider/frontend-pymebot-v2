/**
 * utils/propertyDataSheet/printTemplate.ts
 * Plantilla HTML para la impresión directa de fichas técnicas
 * 
 * @version 5.2.0
 * @updated 2025-04-10
 */

import { formatCurrency, getOperationTypeColor, getOperationTypeName, getPropertyTypeName, getStatusName, formatLocation, hasApproximateLocation } from './formatters';
import { getPropertyImages } from './imageUtils';
import { generateMapTemplate } from './mapTemplate';
import { PDF_MARGIN_MM } from './constants';
import { Property } from '@/app/(protected-pages)/modules/properties/property-list/types';

/**
 * Genera el HTML completo para imprimir la ficha técnica
 */
export const generatePrintHTML = (property: Property): string => {
  const { mainImageUrl, imageUrl1, imageUrl2, imageUrl3 } = getPropertyImages(property);
  const isApproximate = hasApproximateLocation(property);
  
  // Obtener el color primario del tema (si estamos en el navegador)
  const primaryColor = typeof window !== 'undefined' 
    ? getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2563eb'
    : '#2563eb';
  
  // Generar el HTML del mapa
  const mapHTML = generateMapTemplate(
    property.location?.city || '', 
    property.location?.state || '', 
    isApproximate,
    primaryColor
  );
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ficha Técnica - ${property.name || 'Propiedad'}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          color: #1e293b;
          background-color: white;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .property-sheet {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          position: relative;
          min-height: 100vh;
          padding-bottom: 30px; /* Espacio para el footer */
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .title {
          color: ${primaryColor};
          font-size: 18px;
          margin: 0;
          line-height: 1.2;
        }
        .badge {
          background-color: ${getOperationTypeColor(property.operationType || '')};
          color: white;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
        }
        .property-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .property-name {
          color: #1e293b;
          font-size: 16px;
          line-height: 1.3;
          margin: 0;
          max-width: 65%;
          font-weight: 600;
        }
        .property-id {
          color: #64748b;
          font-size: 11px;
          font-weight: normal;
          display: block;
          margin-top: 3px;
        }
        .property-price {
          margin: 0;
          font-size: 17px;
          font-weight: bold;
          color: #111827;
          text-align: right;
        }
        .price-period {
          font-size: 11px;
          font-weight: normal;
          color: #6b7280;
          display: block;
          margin-top: 3px;
        }
        .gallery {
          margin-bottom: 12px;
        }
        /* Estilos para imágenes con aspect ratio 16:9 */
        .main-image {
          width: 100%;
          position: relative;
          padding-top: 56.25%; /* Aspect ratio 16:9 */
          margin-bottom: 5px;
          background-color: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
        }
        .main-image img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .thumbnails {
          display: flex;
          gap: 5px;
        }
        .thumbnail {
          flex: 1;
          position: relative;
          padding-top: 18.75%; /* aspect ratio 16:9 para 3 miniaturas */
          background-color: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
        }
        .thumbnail img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .content {
          display: flex;
          gap: 15px;
        }
        .left-column {
          flex: 1.5;
          display: flex;
          flex-direction: column;
        }
        .right-column {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .section {
          margin-bottom: 12px;
        }
        .section-title {
          color: #334155;
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
        }
        hr {
          border: 0;
          height: 1px;
          background-color: #e2e8f0;
          margin: 2px 0 5px 0;
        }
        .section-content {
          font-size: 12px;
          line-height: 1.4;
        }
        .section-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .features-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 5px;
        }
        .feature-box {
          min-width: 50px;
          text-align: center;
          padding: 4px;
          background-color: #f8fafc;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        .feature-label {
          font-size: 10px;
          color: #475569;
        }
        .feature-value {
          font-weight: bold;
          font-size: 12px;
        }
        .additional-features {
          font-size: 10px;
          line-height: 1.4;
          color: #475569;
          word-wrap: break-word;
        }
        .additional-features span {
          margin-left: 8px;
        }
        .additional-features span:first-child {
          margin-left: 0;
        }
        .description-section {
          flex-grow: 1;
          overflow: hidden;
        }
        .description-title {
          color: #334155;
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
        }
        .description-text {
          margin: 0;
          font-size: 11px;
          line-height: 1.4;
          color: #374151;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .contact-box {
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 10px;
          background-color: #f8fafc;
          margin-bottom: 12px;
        }
        .contact-title {
          color: #334155;
          margin: 0 0 5px 0;
          font-size: 14px;
          font-weight: 600;
        }
        .contact-info {
          font-size: 11px;
          line-height: 1.4;
        }
        .contact-info p {
          margin: 3px 0;
          word-break: break-word;
        }
        .contact-info p strong {
          display: inline-block;
          min-width: 40px;
        }
        .contact-footer {
          margin: 5px 0 0 0;
          font-size: 9px;
          text-align: right;
          color: #64748b;
        }
        .map-box {
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 10px;
          background-color: #f8fafc;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        .map-title {
          color: #334155;
          margin: 0 0 5px 0;
          font-size: 14px;
          font-weight: 600;
        }
        .map-container {
          width: 100%;
          position: relative;
          padding-top: 56.25%; /* Aspect ratio 16:9 */
          border-radius: 4px;
          overflow: hidden;
          flex-grow: 1;
        }
        .map-container > div {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          border-top: 1px solid #e2e8f0;
          padding-top: 5px;
          padding-bottom: 5px;
          background-color: white;
        }
        .footer-text {
          color: #64748b;
          margin: 0;
          font-size: 8px;
          text-align: center;
          line-height: 1.3;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: ${PDF_MARGIN_MM}mm;
            scale: 1;
          }
          
          body {
            margin: 0;
            padding: 0;
            background-color: #FFF !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .property-sheet {
            width: 100%;
            margin: 0;
            box-shadow: none;
            border: none;
          }
          
          /* Asegurar que el contenido se ajuste a una sola página */
          .main-image {
            padding-top: 45%; /* Reducir un poco el aspect ratio para ahorrar espacio */
          }
          
          .thumbnail {
            padding-top: 15%; /* Reducir un poco el aspect ratio para ahorrar espacio */
          }
          
          .map-container {
            padding-top: 45%; /* Reducir un poco el aspect ratio para ahorrar espacio */
          }
          
          .description-text {
            max-height: 90px;
            overflow: hidden;
          }
          
          .footer {
            position: fixed;
            bottom: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="property-sheet">
        <div class="header">
          <div><h1 class="title">FICHA TÉCNICA</h1></div>
          ${property.operationType ? `<div class="badge" style="background-color: ${getOperationTypeColor(property.operationType)}">${getOperationTypeName(property.operationType)}</div>` : ''}
        </div>
        
        <div class="property-header">
          <h2 class="property-name">${property.name || 'Propiedad sin nombre'} <span class="property-id">ID: ${property.propertyCode || property.id || 'N/A'}</span></h2>
          <p class="property-price">${formatCurrency(property.price || 0, property.currency)} <span class="price-period">${property.operationType === 'rent' ? 'por mes' : ''} ${property.currency || ''}</span></p>
        </div>
        
        <div class="gallery">
          <div class="main-image"><img src="${mainImageUrl}" alt="Vista principal" /></div>
          <div class="thumbnails">
            <div class="thumbnail"><img src="${imageUrl1}" alt="Imagen 1" /></div>
            <div class="thumbnail"><img src="${imageUrl2}" alt="Imagen 2" /></div>
            <div class="thumbnail"><img src="${imageUrl3}" alt="Imagen 3" /></div>
          </div>
        </div>
        
        <div class="content">
          <div class="left-column">
            <div class="section">
              <h3 class="section-title">Información Básica</h3> <hr />
              <div class="section-content">
                <div class="section-row"><span><strong>Tipo:</strong> ${getPropertyTypeName(property.propertyType || '')}</span> <span><strong>Estado:</strong> ${getStatusName(property.status || '')}</span></div>
                <div><strong>Ubicación:</strong> ${formatLocation(property)}</div>
              </div>
            </div>
            
            <div class="section">
               <h3 class="section-title">Características</h3> <hr />
              <div class="features-grid">
                 ${property.features?.bedrooms ? `<div class="feature-box"><div class="feature-label">Hab.</div><div class="feature-value">${property.features.bedrooms}</div></div>` : ''}
                 ${property.features?.bathrooms ? `<div class="feature-box"><div class="feature-label">Baños</div><div class="feature-value">${property.features.bathrooms}</div></div>` : ''}
                 ${property.features?.area ? `<div class="feature-box"><div class="feature-label">Área</div><div class="feature-value">${property.features.area} m²</div></div>` : ''}
                 ${property.features?.parkingSpots ? `<div class="feature-box"><div class="feature-label">Est.</div><div class="feature-value">${property.features.parkingSpots}</div></div>` : ''}
              </div>
               <div class="additional-features">
                 ${property.features?.hasPool ? `<span><span style="font-size: 8px;">●</span> Piscina</span>` : ''}
                 ${property.features?.hasGarden ? `<span><span style="font-size: 8px;">●</span> Jardín</span>` : ''}
                 ${property.features?.hasGarage ? `<span><span style="font-size: 8px;">●</span> Garage</span>` : ''}
                 ${property.features?.securitySystem ? `<span><span style="font-size: 8px;">●</span> Seguridad</span>` : ''}
                 ${property.features?.yearBuilt ? `<span><span style="font-size: 8px;">●</span> Año: ${property.features.yearBuilt}</span>` : ''}
              </div>
            </div>
            
            <div class="description-section">
               <h4 class="description-title">Descripción</h4>
               <p class="description-text">${property.description || 'Descripción no disponible.'}</p>
            </div>
          </div>
          
          <div class="right-column">
             <div class="contact-box">
              <h3 class="contact-title">Información de Contacto</h3>
              <div class="contact-info">
                ${property.agentName ? `<p><strong>Agente:</strong> ${property.agentName}</p>` : ''}
                ${property.agentEmail ? `<p><strong>Email:</strong> ${property.agentEmail}</p>` : ''}
                ${property.agentPhone ? `<p><strong>Tel:</strong> ${property.agentPhone}</p>` : ''}
              </div>
              <p class="contact-footer">www.pymebot.ai</p>
            </div>
            
            <div class="map-box">
              <h3 class="map-title">Ubicación</h3>
              <div class="map-container">${mapHTML}</div>
            </div>
          </div>
        </div>
         
        <div class="footer">
          <p class="footer-text">Esta ficha técnica es para fines informativos. La información puede estar sujeta a cambios. © ${new Date().getFullYear()} PymeBot.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
