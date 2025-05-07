'use client';

/**
 * frontend/src/components/examples/SafeChartExample.tsx
 * Ejemplo de uso de SafeChart para visualización de datos.
 * Demuestra cómo resolver problemas de hidratación con gráficos que dependen del DOM o window.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React, { useState, useEffect } from 'react';
import { SafeChart } from '@/components/shared/safe-components';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

/**
 * Componente de ejemplo que muestra cómo usar SafeChart para visualizaciones de datos
 * que podrían causar errores de hidratación por depender del DOM o window.
 */
const SafeChartExample: React.FC = () => {
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Simular carga de datos asíncrona
  useEffect(() => {
    const generateData = () => {
      // Datos que varían en cada renderizado - esto causaría errores de hidratación
      // sin el componente SafeChart
      const newData: ChartDataItem[] = [
        { name: 'Medicina', value: Math.floor(Math.random() * 100) + 20, color: '#8884d8' },
        { name: 'Salón', value: Math.floor(Math.random() * 100) + 20, color: '#82ca9d' },
        { name: 'Restaurant', value: Math.floor(Math.random() * 100) + 20, color: '#ffc658' },
        { name: 'Consultorios', value: Math.floor(Math.random() * 100) + 20, color: '#ff8042' },
        { name: 'Retail', value: Math.floor(Math.random() * 100) + 20, color: '#0088fe' }
      ];
      
      setData(newData);
      setLoading(false);
    };
    
    // Simular un retraso de carga
    const timer = setTimeout(generateData, 600);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Componente de gráfico que queremos renderizar
  const ChartComponent = ({ data }: { data: ChartDataItem[] }) => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        {data.map((item, index) => (
          <Bar key={index} dataKey="value" name={item.name} fill={item.color} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
  
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Uso por Vertical</h3>
      
      {/* Usar SafeChart para evitar errores de hidratación */}
      <SafeChart
        ChartComponent={ChartComponent}
        chartProps={{ data }}
        placeholderHeight="300px"
        simulatedLines={true}
        // Esperar a que los datos estén cargados
        chartDelay={loading ? 100 : 0}
      />
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Datos actualizados al {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default SafeChartExample;
