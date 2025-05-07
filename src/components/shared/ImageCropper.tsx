/**
 * frontend/src/components/shared/ImageCropper.tsx
 * Componente para recortar y ajustar imágenes utilizando react-easy-crop.
 * Permite ajustar la posición y zoom mediante un control de recorte interactivo.
 * Diseñado para mantener el aspect ratio de 4/3 del slider.
 * 
 * Mejoras:
 * - Mejor visualización del área de recorte
 * - Indicadores visuales de límites
 * - Prevención de desbordamiento de imagen
 * - Ajuste automático para el aspect ratio correcto
 * 
 * @version 1.2.0
 * @updated 2025-04-04
 */

'use client'

import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { TbAdjustmentsAlt } from 'react-icons/tb'
import Slider from '@/components/ui/Slider'

// Definimos tipos para el recortador
type Point = { x: number; y: number }
type Area = {
  x: number
  y: number
  width: number
  height: number
}

interface ImageCropperProps {
  imageUrl: string
  title?: string
  isPrimary?: boolean
  aspectRatio?: number
  onCropComplete: (cropData: { zoom: number, position: Point, croppedAreaPixels: Area }) => void
  initialZoom?: number
  initialPosition?: Point
}

const ImageCropper = ({
  imageUrl,
  title = 'Ajustar imagen',
  isPrimary = false,
  aspectRatio = 4/3, // Proporción predeterminada 4:3 (ancho/alto) para coincidir con el slider
  onCropComplete,
  initialZoom = 1,
  initialPosition = { x: 0, y: 0 }
}: ImageCropperProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [crop, setCrop] = useState<Point>(initialPosition)
  const [zoom, setZoom] = useState(initialZoom)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  
  // Valores temporales para el estado del diálogo
  const [tempCrop, setTempCrop] = useState<Point>(initialPosition)
  const [tempZoom, setTempZoom] = useState(initialZoom)
  const [tempCroppedAreaPixels, setTempCroppedAreaPixels] = useState<Area | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleOpenDialog = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    // Inicializar valores temporales con los actuales
    setTempCrop(crop)
    setTempZoom(zoom)
    setImageLoaded(false) // Reiniciar estado de carga de imagen
    setIsDialogOpen(true)
  }

  const handleCloseDialog = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    setIsDialogOpen(false)
  }

  const handleCropChange = (newCrop: Point) => {
    setTempCrop(newCrop)
  }

  const handleZoomChange = (newZoom: number) => {
    setTempZoom(newZoom)
  }

  const handleCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      // Este callback se activa cada vez que se completa un recorte (al mover o hacer zoom)
      setTempCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    // Actualizar los valores reales con los temporales
    setCrop(tempCrop)
    setZoom(tempZoom)
    setCroppedAreaPixels(tempCroppedAreaPixels)
    
    // Notificar al componente padre
    if (tempCroppedAreaPixels) {
      onCropComplete({
        zoom: tempZoom,
        position: tempCrop,
        croppedAreaPixels: tempCroppedAreaPixels
      })
    }
    
    // Cerrar el diálogo
    handleCloseDialog()
  }

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    // Restablecer a los valores predeterminados
    setTempCrop({ x: 0, y: 0 })
    setTempZoom(1)
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  return (
    <>
      {/* Botón para abrir el diálogo de ajuste */}
      <button
        onClick={handleOpenDialog}
        className="absolute right-10 top-2 z-20 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
        title="Ajustar imagen"
      >
        <TbAdjustmentsAlt className="text-lg" />
      </button>

      {/* Diálogo del recortador */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onRequestClose={handleCloseDialog}
        title={title}
        contentClassName="p-0 overflow-hidden max-w-5xl"
        bodyClassName="p-0"
      >
        <div className="flex flex-col">
          {/* Contenedor para el recortador */}
          <div className="relative w-full h-[400px] bg-gray-800">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                <span className="text-white text-lg">Cargando imagen...</span>
              </div>
            )}
            <Cropper
              image={imageUrl}
              crop={tempCrop}
              zoom={tempZoom}
              aspect={aspectRatio}
              onCropChange={handleCropChange}
              onCropComplete={handleCropComplete}
              onZoomChange={handleZoomChange}
              onMediaLoaded={handleImageLoad}
              showGrid={true}
              cropShape="rect"
              objectFit="horizontal-cover"
              restrictPosition={true} // Evitar que se salga de los límites
              zoomWithScroll={true}
              minZoom={1}
              maxZoom={3}
              classes={{
                containerClassName: "w-full h-full",
                cropAreaClassName: "!rounded-none border-2 border-white border-opacity-70"
              }}
            />
          </div>
          
          {/* Controles */}
          <div className="p-4 bg-white dark:bg-gray-800">
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Zoom</p>
              <Slider
                className="w-full"
                min={1}
                max={3}
                step={0.1}
                defaultValue={tempZoom}
                value={tempZoom}
                onChange={handleZoomChange}
              />
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Mueve la imagen para ajustar cómo se verá en la vista de detalles. El recorte tiene proporción 4:3 para coincidir con el slider.
              {isPrimary && " Esta imagen se mostrará como banner principal."}
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="plain" 
                onClick={handleReset}
              >
                Restablecer
              </Button>
              <Button 
                variant="plain" 
                onClick={(e) => handleCloseDialog(e)}
              >
                Cancelar
              </Button>
              <Button 
                variant="solid" 
                onClick={handleApply}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}

export default ImageCropper