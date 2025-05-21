'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function SalesFunnelIntegrationDebugPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar etapas
      const { data: stagesData } = await supabase
        .from('sales_funnel_stages')
        .select('*')
        .order('order_num');
      setStages(stagesData || []);

      // Cargar templates
      const { data: templatesData } = await supabase
        .from('chatbot_templates')
        .select('*')
        .eq('is_active', true);
      setTemplates(templatesData || []);

      // Cargar leads recientes
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);
      setLeads(leadsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runIntegrationTest = async () => {
    setTestResult({ status: 'running', message: 'Iniciando test...' });
    
    try {
      // Test 1: Verificar que hay templates con salesStageId
      const templatesWithStages = templates.filter(t => {
        const flows = JSON.parse(t.flow_data || '[]');
        return flows.some((f: any) => f.salesStageId);
      });

      if (templatesWithStages.length === 0) {
        setTestResult({
          status: 'warning',
          message: 'No hay templates con etapas configuradas',
          details: 'Configura salesStageId en los nodos del chatbot builder'
        });
        return;
      }

      // Test 2: Simular envío de mensaje
      const testLeadId = `test_${Date.now()}`;
      const response = await fetch('/api/chatbot/integrated-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hola, test de integración',
          user_id: 'test-user',
          tenant_id: templatesWithStages[0].tenant_id,
          template_id: templatesWithStages[0].id,
          lead_id: testLeadId
        })
      });

      const result = await response.json();

      if (result.success) {
        setTestResult({
          status: 'success',
          message: 'Test completado exitosamente',
          details: `Respuesta: ${result.response}`,
          stageUpdate: result.debug?.stageUpdate
        });
      } else {
        setTestResult({
          status: 'error',
          message: 'Error en el test',
          details: result.error
        });
      }

    } catch (error) {
      setTestResult({
        status: 'error',
        message: 'Error al ejecutar test',
        details: error.message
      });
    }
  };

  const getStageColor = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    return stage?.color || '#gray';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <RefreshCw className="h-5 w-5 animate-spin" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug: Integración Sales Funnel</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Etapas del Sales Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {stages.map(stage => (
              <div key={stage.id} className="flex items-center mb-2">
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: stage.color }}
                />
                <span>{stage.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Templates Activos</CardTitle>
          </CardHeader>
          <CardContent>
            {templates.map(template => {
              const flows = JSON.parse(template.flow_data || '[]');
              const nodesWithStage = flows.filter((f: any) => f.salesStageId).length;
              return (
                <div key={template.id} className="mb-2">
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-gray-500">
                    {nodesWithStage} nodos con etapa
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {leads.map(lead => (
              <div key={lead.id} className="mb-2">
                <div className="font-medium">{lead.name || `Lead ${lead.id}`}</div>
                <Badge
                  style={{
                    backgroundColor: getStageColor(lead.sales_stage_id),
                    color: 'white'
                  }}
                >
                  {stages.find(s => s.id === lead.sales_stage_id)?.name || 'Sin etapa'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test de Integración</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runIntegrationTest}
            disabled={testResult?.status === 'running'}
            className="mb-4"
          >
            {testResult?.status === 'running' ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Ejecutando test...
              </>
            ) : (
              'Ejecutar Test'
            )}
          </Button>

          {testResult && (
            <div className="border rounded p-4">
              <div className="flex items-center mb-2">
                {getStatusIcon(testResult.status)}
                <span className="ml-2 font-medium">{testResult.message}</span>
              </div>
              {testResult.details && (
                <div className="text-sm text-gray-600">{testResult.details}</div>
              )}
              {testResult.stageUpdate && (
                <div className="mt-2 text-sm">
                  <div>Actualización de etapa:</div>
                  <div className="font-mono bg-gray-100 p-2 rounded">
                    {testResult.stageUpdate.oldStage} → {testResult.stageUpdate.newStage}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Button
          variant="outline"
          onClick={loadData}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Recargar Datos
        </Button>
      </div>
    </div>
  );
}