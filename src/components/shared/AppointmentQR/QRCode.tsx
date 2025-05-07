'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Spinner } from '@/components/ui/Spinner';

interface QRCodeProps {
  appointmentId: string;
  size?: number;
  className?: string;
  onError?: (error: Error) => void;
}

const QRCode: React.FC<QRCodeProps> = ({
  appointmentId,
  size = 200,
  className = '',
  onError,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (!appointmentId) return;

    const generateQRImageUrl = (): string => {
      // Crea la URL para la API que generará el QR
      return `/api/appointments/qr/${appointmentId}/image`;
    };

    try {
      const url = generateQRImageUrl();
      setImageUrl(url);
      setLoading(false);
    } catch (err: any) {
      setError(err);
      setLoading(false);
      onError && onError(err);
    }
  }, [appointmentId, onError]);

  // Mostrar spinner mientras carga
  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <Spinner size={size / 4} />
      </div>
    );
  }

  // Mostrar error si algo falla
  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg text-red-600 ${className}`}
        style={{ width: size, height: size }}
      >
        <p className="text-xs text-center p-2">Error al generar QR</p>
      </div>
    );
  }

  // Mostrar el código QR
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Image
        src={imageUrl}
        alt="Código QR de cita"
        width={size}
        height={size}
        className="rounded-lg"
        priority
        unoptimized
      />
    </div>
  );
};

export default QRCode;