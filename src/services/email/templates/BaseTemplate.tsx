'use client';

import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';

interface BaseTemplateProps {
  previewText: string;
  heading: string;
  children: React.ReactNode;
  footerText?: string;
  logoUrl?: string;
  logoAlt?: string;
}

export const BaseTemplate: React.FC<BaseTemplateProps> = ({
  previewText,
  heading,
  children,
  footerText = '© 2025 PymeBot. Todos los derechos reservados.',
  logoUrl = 'https://pymebot.ai/logo.png',
  logoAlt = 'PymeBot Logo',
}) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Img
            src={logoUrl}
            alt={logoAlt}
            width="120"
            height="40"
            style={styles.logo}
          />
          <Heading style={styles.heading}>{heading}</Heading>
          
          <Section style={styles.contentSection}>
            {children}
          </Section>
          
          <Hr style={styles.hr} />
          
          <Section style={styles.footer}>
            <Text style={styles.footerText}>{footerText}</Text>
            <Text style={styles.footerLinks}>
              <Link href="https://pymebot.ai/terminos" style={styles.link}>
                Términos de Servicio
              </Link>
              {' • '}
              <Link href="https://pymebot.ai/privacidad" style={styles.link}>
                Política de Privacidad
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: 
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  },
  container: {
    margin: '0 auto',
    padding: '20px 0',
    maxWidth: '600px',
  },
  logo: {
    margin: '0 auto 20px',
    display: 'block',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '30px 0',
    color: '#333',
  },
  contentSection: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  hr: {
    borderColor: '#e6ebf1',
    margin: '30px 0',
  },
  footer: {
    textAlign: 'center' as const,
    color: '#8898aa',
    fontSize: '12px',
  },
  footerText: {
    margin: '12px 0',
  },
  footerLinks: {
    margin: '12px 0',
  },
  link: {
    color: '#556cd6',
    textDecoration: 'none',
  },
};

export default BaseTemplate;