'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/utils/hooks/useTranslation';
import { FaEnvelope, FaCog, FaRegClock, FaComments, FaUsers, FaMoneyBillAlt } from 'react-icons/fa';

interface SystemVariableCategoryProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const SystemVariableCategoryCard: React.FC<SystemVariableCategoryProps> = ({ 
  title, 
  description, 
  href, 
  icon 
}) => {
  return (
    <Link href={href}>
      <Card className="p-5 h-full transition-all duration-300 hover:shadow-md hover:border-blue-200 cursor-pointer">
        <div className="flex items-start">
          <div className="mr-4 p-3 rounded-full bg-blue-50 text-blue-600">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">{title}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
};

const SystemVariablesIndexPage: React.FC = () => {
  const t = useTranslation();

  const categories = [
    {
      title: 'Configuración de Email',
      description: 'Configura los ajustes para enviar emails, incluyendo API keys y direcciones.',
      href: '/superadmin/system-variables/email-settings',
      icon: <FaEnvelope size={24} />,
    },
    {
      title: 'Horarios de Negocio',
      description: 'Configura los horarios por defecto de atención del negocio.',
      href: '/superadmin/system-variables/business-hours',
      icon: <FaRegClock size={24} />,
    },
    {
      title: 'Configuración del Chatbot',
      description: 'Gestiona las variables globales utilizadas por los chatbots.',
      href: '/superadmin/system-variables/chatbot-settings',
      icon: <FaComments size={24} />,
    },
    {
      title: 'Configuración de Usuarios',
      description: 'Variables para la configuración de usuarios y autenticación.',
      href: '/superadmin/system-variables/user-settings',
      icon: <FaUsers size={24} />,
    },
    {
      title: 'Configuración de Pagos',
      description: 'Configura los ajustes para integración con pasarelas de pago.',
      href: '/superadmin/system-variables/payment-settings',
      icon: <FaMoneyBillAlt size={24} />,
    },
    {
      title: 'Configuración General',
      description: 'Otras variables de configuración del sistema.',
      href: '/superadmin/system-variables/general-settings',
      icon: <FaCog size={24} />,
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Variables del Sistema</h1>
        <p className="text-gray-600 mt-2">
          Administra las variables globales del sistema utilizadas por diferentes módulos y funcionalidades.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category, index) => (
          <SystemVariableCategoryCard
            key={index}
            title={category.title}
            description={category.description}
            href={category.href}
            icon={category.icon}
          />
        ))}
      </div>
    </div>
  );
};

export default SystemVariablesIndexPage;