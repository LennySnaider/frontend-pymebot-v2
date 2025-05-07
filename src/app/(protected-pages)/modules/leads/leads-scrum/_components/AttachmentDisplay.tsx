/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/AttachmentDisplay.tsx
 * Componente para mostrar archivos adjuntos en el diálogo de detalles de lead.
 * Incluye la previsualización y opciones para eliminar/descargar.
 *
 * @version 1.0.0
 * @updated 2025-05-01
 */

'use client'

import {
    TbFileText,
    TbDownload,
    TbTrash,
    TbPhoto,
    TbFile,
} from 'react-icons/tb'
import Button from '@/components/ui/Button'

interface Attachment {
    id: string
    name: string
    src?: string
    size: string
    type: string
}

interface AttachmentDisplayProps {
    attachment: Attachment
    onDelete: (id: string) => void
}

const AttachmentDisplay = ({
    attachment,
    onDelete,
}: AttachmentDisplayProps) => {
    // Determinar el tipo de icono basado en el tipo de archivo
    const getFileIcon = () => {
        const fileType = attachment.type.toLowerCase()

        if (
            fileType.includes('image') ||
            attachment.name.endsWith('.jpg') ||
            attachment.name.endsWith('.png') ||
            attachment.name.endsWith('.jpeg')
        ) {
            return <TbPhoto className="text-2xl" />
        } else if (
            fileType.includes('pdf') ||
            attachment.name.endsWith('.pdf')
        ) {
            return <TbFileText className="text-2xl" />
        } else {
            return <TbFile className="text-2xl" />
        }
    }

    // Simular una descarga
    const handleDownload = () => {
        // Esta es una simulación. En una implementación real, se descargaría el archivo.
        console.log(`Descargando archivo: ${attachment.name}`)

        // Si hay una URL, podríamos iniciar una descarga real
        if (attachment.src) {
            const link = document.createElement('a')
            link.href = attachment.src
            link.download = attachment.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center">
                {getFileIcon()}
                <div className="ml-3">
                    <div className="font-medium">{attachment.name}</div>
                    <div className="text-xs text-gray-500">
                        {attachment.size}
                    </div>
                </div>
            </div>
            <div className="flex space-x-2">
                <Button
                    variant="plain"
                    size="sm"
                    icon={<TbDownload />}
                    onClick={handleDownload}
                />
                <Button
                    variant="plain"
                    size="sm"
                    icon={<TbTrash />}
                    onClick={() => onDelete(attachment.id)}
                />
            </div>
        </div>
    )
}

export default AttachmentDisplay
