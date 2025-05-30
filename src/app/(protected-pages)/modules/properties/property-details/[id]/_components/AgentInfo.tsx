/**
 * frontend/src/app/(protected-pages)/modules/properties/property-details/[id]/_components/AgentInfo.tsx
 * Componente para mostrar información del agente asociado a una propiedad
 * 
 * @version 1.0.0
 * @updated 2025-06-27
 */

'use client'

import { useState, useEffect } from 'react'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { TbEye, TbPrinter, TbDownload, TbUser } from 'react-icons/tb'
import { generatePropertyDataSheet, printPropertyDataSheet } from '@/utils/generatePropertyDataSheet'
import { Property } from '@/app/(protected-pages)/modules/properties/property-list/types'

interface AgentInfoProps {
    agentId?: string;
    property?: Property;
}

// Tipo para la información del agente
interface AgentData {
    id: string;
    name: string;
    position: string;
    email?: string;
    phone?: string;
    avatar?: string;
}

const AgentInfo = ({ agentId, property }: AgentInfoProps) => {
    const [agent, setAgent] = useState<AgentData | null>(null);
    const [loading, setLoading] = useState(true);

    // Cargar información del agente
    useEffect(() => {
        const fetchAgent = async () => {
            setLoading(true);
            try {
                if (!agentId) {
                    setAgent(null);
                    setLoading(false);
                    return;
                }

                // Consultar agente real desde la base de datos
                try {
                    // Importar y usar el servicio real de agentes
                    import('@/services/AgentService').then(({ getAgentById }) => {
                        getAgentById(agentId).then((agentData) => {
                            if (agentData) {
                                setAgent({
                                    id: agentData.id,
                                    name: agentData.full_name || agentData.email,
                                    position: "Agent", // Valor por defecto
                                    email: agentData.email,
                                    phone: agentData.phone,
                                    avatar: agentData.avatar_url
                                });
                            } else {
                                setAgent(null);
                            }
                            setLoading(false);
                        }).catch((error) => {
                            console.error('Error al cargar agente:', error);
                            setAgent(null);
                            setLoading(false);
                        });
                    });
                } catch (error) {
                    console.error('Error al importar AgentService:', error);
                    setAgent(null);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error general al cargar agente:', error);
                setAgent(null);
                setLoading(false);
            }
        };

        fetchAgent();
    }, [agentId]);

    // Manejadores para imprimir y descargar PDF
    const handlePrint = async () => {
        if (!property) {
            console.error("No hay información de propiedad disponible para imprimir");
            return;
        }

        try {
            // Asignar información del agente a la propiedad para incluirla en la ficha
            const propertyWithAgentInfo = {
                ...property,
                agentName: agent?.name,
                agentEmail: agent?.email,
                agentPhone: agent?.phone
            };
            
            await printPropertyDataSheet(propertyWithAgentInfo);
        } catch (error) {
            console.error("Error al imprimir la ficha técnica:", error);
        }
    };

    const handleDownloadPDF = async () => {
        if (!property) {
            console.error("No hay información de propiedad disponible para descargar");
            return;
        }

        try {
            // Asignar información del agente a la propiedad para incluirla en la ficha
            const propertyWithAgentInfo = {
                ...property,
                agentName: agent?.name,
                agentEmail: agent?.email,
                agentPhone: agent?.phone
            };
            
            await generatePropertyDataSheet(propertyWithAgentInfo);
        } catch (error) {
            console.error("Error al generar el PDF:", error);
        }
    };

    if (loading) {
        return (
            <AdaptiveCard>
                <div className="animate-pulse">
                    <h5 className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></h5>
                    <div className="flex items-center mb-4">
                        <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="ml-3 flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-2/3"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                    </div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </AdaptiveCard>
        );
    }

    if (!agent) {
        return (
            <AdaptiveCard>
                <h5 className="mb-3">Agente</h5>
                <div className="flex flex-col items-center justify-center p-4 text-center">
                    <TbUser className="text-5xl text-gray-400 mb-2" />
                    <p className="text-gray-500">
                        No hay información disponible sobre el agente
                    </p>
                </div>
            </AdaptiveCard>
        );
    }

    return (
        <AdaptiveCard>
            <h5 className="mb-3">Agente</h5>
            <div className="flex items-center mb-4">
                <Avatar 
                    name={agent.name} 
                    src={agent.avatar} 
                    size="lg" 
                />
                <div className="ml-3">
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-gray-500 text-sm">
                        {agent.position}
                    </div>
                </div>
            </div>
            <div className="mb-4">
                <Button
                    variant="solid"
                    icon={<TbEye />}
                    className="w-full"
                >
                    Ver perfil
                </Button>
            </div>
            <div>
                <Button
                    variant="outline"
                    icon={<TbPrinter />}
                    className="w-full mb-2"
                    onClick={handlePrint}
                >
                    Imprimir
                </Button>
                <Button
                    variant="outline"
                    icon={<TbDownload />}
                    className="w-full"
                    onClick={handleDownloadPDF}
                >
                    Descargar PDF
                </Button>
            </div>
        </AdaptiveCard>
    );
};

export default AgentInfo;