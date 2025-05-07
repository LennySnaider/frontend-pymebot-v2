/**
 * utils/propertyDataSheet/index.ts
 * Punto de entrada principal para las funciones de generación de fichas técnicas de propiedades
 * Con enfoque simplificado para mejorar la compatibilidad y asegurar márgenes
 * 
 * @version 5.1.0
 * @updated 2025-04-07
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generatePropertyHTML } from './pdfTemplate';
import { generatePrintHTML } from './printTemplate';
import { Property } from '@/app/(protected-pages)/modules/properties/property-list/types';

/**
 * Obtiene el color primario del tema actual con soporte para opacidad
 * @param opacity - Valor de opacidad entre 0 y 1 (0 = transparente, 1 = opaco)
 * @returns Color con opacidad aplicada
 */
const getPrimaryColorWithOpacity = (opacity: number = 0.9): string => {
  // Obtener el color primario del tema
  const primaryColor = typeof window !== 'undefined' 
    ? getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2a85ff'
    : '#2a85ff';
    
  // Función para convertir HEX a RGB
  const hexToRgb = (hex: string): {r: number, g: number, b: number} | null => {
    // Remover # si existe
    const sanitizedHex = hex.startsWith('#') ? hex.substring(1) : hex;
    
    // Expandir hex corto (3 dígitos) a hex completo (6 dígitos)
    const fullHex = sanitizedHex.length === 3 
      ? sanitizedHex.split('').map(c => c + c).join('') 
      : sanitizedHex;
    
    // Analizar el valor hex
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result 
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } 
      : null;
  };
  
  // Verificar si el color ya está en formato RGB o RGBA
  if (primaryColor.startsWith('rgb')) {
    // Extraer valores RGB y aplicar opacidad
    const rgbMatch = primaryColor.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      const [r, g, b] = rgbMatch.map(Number);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }
  
  // Si es formato hex, convertir a rgba
  const rgb = hexToRgb(primaryColor);
  if (rgb) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  }
  
  // Si no se pudo procesar, devolver valor por defecto con opacidad
  return `rgba(42, 133, 255, ${opacity})`; // #2a85ff
};

/**
 * Crea y muestra un mensaje de carga temático para operaciones de documentos
 * @param message - Mensaje principal a mostrar
 * @param submessage - Mensaje secundario (opcional)
 * @returns Elemento HTML del mensaje de carga
 */
const createLoadingMessage = (message: string, submessage?: string): HTMLDivElement => {
  const loadingElement = document.createElement('div');
  
  // Estilos base
  loadingElement.style.position = 'fixed';
  loadingElement.style.top = '50%';
  loadingElement.style.left = '50%';
  loadingElement.style.transform = 'translate(-50%, -50%)';
  loadingElement.style.backgroundColor = getPrimaryColorWithOpacity(0.9);
  loadingElement.style.color = 'white';
  loadingElement.style.padding = '15px 20px';
  loadingElement.style.borderRadius = '8px';
  loadingElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  loadingElement.style.zIndex = '10000';
  loadingElement.style.fontSize = '16px';
  loadingElement.style.fontWeight = 'bold';
  
  // Contenido del mensaje
  if (submessage) {
    loadingElement.innerHTML = `${message}<br><span style="font-size: 12px; font-weight: normal;">${submessage}</span>`;
  } else {
    loadingElement.textContent = message;
  }
  
  // Añadir al DOM
  document.body.appendChild(loadingElement);
  
  return loadingElement;
};

/**
 * Genera la ficha técnica de una propiedad en formato PDF
 * Versión simplificada para mejor compatibilidad
 */
export const generatePropertyDataSheet = async (property: Property): Promise<void> => {
  let loadingMessageElement: HTMLDivElement | null = null;
  let contentDiv: HTMLDivElement | null = null;

  try {
    // 1. Mostrar mensaje de carga
    loadingMessageElement = createLoadingMessage('Generando PDF...', 'Por favor espere un momento...');

    // 2. Crear elemento DOM temporal
    contentDiv = document.createElement('div');
    contentDiv.style.position = 'fixed';
    contentDiv.style.left = '-9999px';
    contentDiv.style.width = '794px'; // Aproximadamente A4 en pixeles
    contentDiv.style.padding = '0';
    contentDiv.style.backgroundColor = 'white';
    contentDiv.style.fontFamily = 'Arial, sans-serif';
    contentDiv.style.boxSizing = 'border-box';
    contentDiv.style.zIndex = '-9999';
    document.body.appendChild(contentDiv);

    // 3. Generar HTML completo
    contentDiv.innerHTML = generatePropertyHTML(property);

    // 4. Esperar a que todo se cargue
    await new Promise(resolve => setTimeout(resolve, 800));

    // 5. Usar html2canvas con opciones mejoradas
    const canvas = await html2canvas(contentDiv, {
      scale: 2, // Mayor escala para mejor calidad
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      imageTimeout: 30000, // Mayor tiempo de espera para imágenes
      onclone: (clonedDoc) => {
        // Asegurar que las imágenes tengan crossorigin="anonymous"
        const images = clonedDoc.getElementsByTagName('img');
        for (let i = 0; i < images.length; i++) {
          images[i].setAttribute('crossorigin', 'anonymous');
        }
      }
    });

    // 6. Crear PDF con formato A4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // 7. Agregar imagen al PDF con márgenes uniformes y mejorados
    const margin = 20; // Aumentamos el margen a 20mm para mejor legibilidad
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pdfWidth - (margin * 2);
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // 7.1 Verificar si la altura de la imagen supera el espacio disponible y recortar si es necesario
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const contentHeight = pdfHeight - (margin * 2);
    
    // Si la imagen es demasiado alta, recortamos
    if (imgHeight > contentHeight) {
      const scale = contentHeight / imgHeight;
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.95),
        'JPEG',
        margin,
        margin,
        imgWidth * scale,
        imgHeight * scale
      );
    } else {
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.95),
        'JPEG',
        margin,
        margin,
        imgWidth,
        imgHeight
      );
    }

    // 8. Configurar metadatos del PDF
    pdf.setProperties({
      title: `Ficha - ${property.name || 'Propiedad'} (${property.propertyCode || property.id})`,
      creator: 'PymeBot',
      author: property.agentName || 'PymeBot',
      subject: `Ficha Técnica Inmobiliaria - ${property.propertyCode || property.id}`,
      keywords: `inmobiliaria, propiedad, ${property.propertyType || ''}, ${property.operationType || ''}`
    });

    // 9. Guardar PDF
    pdf.save(`Ficha_${property.propertyCode || 'Propiedad'}_${Date.now()}.pdf`);

  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert(`Error al generar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  } finally {
    // 10. Limpiar elementos creados
    if (loadingMessageElement && document.body.contains(loadingMessageElement)) {
      document.body.removeChild(loadingMessageElement);
    }
    if (contentDiv && document.body.contains(contentDiv)) {
      document.body.removeChild(contentDiv);
    }
  }
};

/**
 * Imprime la ficha técnica de la propiedad directamente
 */
export const printPropertyDataSheet = async (property: Property): Promise<void> => {
  let loadingMessageElement: HTMLDivElement | null = null;
  let printFrame: HTMLIFrameElement | null = null;

  try {
    // Mostrar mensaje de carga
    loadingMessageElement = createLoadingMessage('Preparando impresión...', 'Por favor espere...');

    // Crear iframe para impresión
    printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);

    // Generar HTML para el iframe
    const iframeContent = generatePrintHTML(property);

    const iframeDoc = printFrame.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(iframeContent);
      iframeDoc.close();

      // Esperar un tiempo prudente para que carguen los recursos y se renderice correctamente
      setTimeout(() => {
        try {
          // Quitar mensaje de carga
          if (loadingMessageElement && document.body.contains(loadingMessageElement)) {
            document.body.removeChild(loadingMessageElement);
            loadingMessageElement = null;
          }
          
          // Imprimir
          if (printFrame?.contentWindow) {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
            
            // Esperar un tiempo antes de limpiar el iframe
            setTimeout(() => {
              if (printFrame && document.body.contains(printFrame)) {
                document.body.removeChild(printFrame);
              }
            }, 2000);
          }
        } catch (err) {
          console.error('Error durante la impresión:', err);
          if (loadingMessageElement && document.body.contains(loadingMessageElement)) {
            document.body.removeChild(loadingMessageElement);
          }
          if (printFrame && document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
          alert('Hubo un problema al imprimir. Intente nuevamente o use la opción "Guardar como PDF".');
        }
      }, 1500);
    } else {
      throw new Error('No se pudo acceder al documento del iframe');
    }
  } catch (error) {
    console.error('Error al preparar la impresión:', error);
    alert(`Error al preparar la impresión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    if (loadingMessageElement && document.body.contains(loadingMessageElement)) {
      document.body.removeChild(loadingMessageElement);
    }
    if (printFrame && document.body.contains(printFrame)) {
      document.body.removeChild(printFrame);
    }
  }
};
