'use client';

import React from 'react';
import {
  Button,
  Link,
  Section,
  Text,
  Img,
} from '@react-email/components';
import BaseTemplate from './BaseTemplate';

interface AppointmentQRTemplateProps {
  recipientName: string;
  appointmentDate: string;
  appointmentTime: string;
  qrCodeUrl: string;
  appointmentLocation?: string;
  appointmentDetails?: string;
  validationUrl?: string;
  tenantName?: string;
}

export const AppointmentQRTemplate: React.FC<AppointmentQRTemplateProps> = ({
  recipientName,
  appointmentDate,
  appointmentTime,
  qrCodeUrl,
  appointmentLocation,
  appointmentDetails,
  validationUrl,
  tenantName = 'PymeBot',
}) => {
  const previewText = `Confirmación de cita para ${appointmentDate} a las ${appointmentTime}`;
  
  return (
    <BaseTemplate
      previewText={previewText}
      heading={`Confirmación de Cita - ${tenantName}`}
    >
      <Text style={styles.paragraph}>
        Hola <strong>{recipientName}</strong>,
      </Text>
      <Text style={styles.paragraph}>
        Tu cita ha sido confirmada para el <strong>{appointmentDate}</strong> a las <strong>{appointmentTime}</strong>.
        {appointmentLocation && ` La cita será en ${appointmentLocation}.`}
      </Text>
      
      {appointmentDetails && (
        <Text style={styles.paragraph}>
          <strong>Detalles adicionales:</strong><br />
          {appointmentDetails}
        </Text>
      )}
      
      <Section style={styles.qrContainer}>
        <Text style={styles.qrHeading}>
          Tu código QR de acceso:
        </Text>
        <Img 
          src={qrCodeUrl} 
          alt="Código QR de confirmación" 
          width="200" 
          height="200" 
          style={styles.qrCode}
        />
        <Text style={styles.qrInstructions}>
          Presenta este código QR al llegar a tu cita para un registro rápido.
        </Text>
      </Section>
      
      {validationUrl && (
        <Section style={styles.buttonContainer}>
          <Button
            href={validationUrl}
            style={styles.button}
          >
            Verificar Cita
          </Button>
        </Section>
      )}
      
      <Text style={styles.paragraph}>
        Si necesitas cambiar o cancelar tu cita, responde a este correo o contacta directamente con nosotros.
      </Text>
      
      <Text style={styles.paragraph}>
        ¡Esperamos verte pronto!
      </Text>
      
      <Text style={styles.signature}>
        El equipo de {tenantName}
      </Text>
    </BaseTemplate>
  );
};

const styles = {
  paragraph: {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#3c4043',
    marginBottom: '16px',
  },
  qrContainer: {
    textAlign: 'center' as const,
    margin: '30px 0',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  qrHeading: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 15px',
    color: '#202124',
  },
  qrCode: {
    margin: '0 auto',
    display: 'block',
    borderRadius: '8px',
    border: '1px solid #e6ebf1',
  },
  qrInstructions: {
    fontSize: '14px',
    color: '#5f6368',
    margin: '15px 0 0',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '30px 0',
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    padding: '12px 24px',
  },
  signature: {
    fontSize: '16px',
    color: '#3c4043',
    marginTop: '26px',
    fontStyle: 'italic',
  },
};

export default AppointmentQRTemplate;