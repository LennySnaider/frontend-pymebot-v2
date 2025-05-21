'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { Area } from 'react-easy-crop/types'

interface AvatarCropperProps {
    imageUrl: string
    isOpen: boolean
    onClose: () => void
    onCrop: (croppedImage: string) => void
    aspectRatio?: number
}

export default function AvatarCropper({
    imageUrl,
    isOpen,
    onClose,
    onCrop,
    aspectRatio = 1 // Avatar circular - aspect ratio 1:1
}: AvatarCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image()
            image.addEventListener('load', () => resolve(image))
            image.addEventListener('error', error => reject(error))
            image.src = url
        })

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area
    ): Promise<string> => {
        const image = await createImage(imageSrc)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            throw new Error('No 2d context')
        }

        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        )

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    throw new Error('Canvas is empty')
                }
                const reader = new FileReader()
                reader.readAsDataURL(blob)
                reader.onloadend = () => {
                    resolve(reader.result as string)
                }
            }, 'image/jpeg')
        })
    }

    const handleCrop = async () => {
        if (croppedAreaPixels) {
            try {
                const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels)
                onCrop(croppedImage)
                onClose()
            } catch (e) {
                console.error(e)
            }
        }
    }

    const handleReset = () => {
        setCrop({ x: 0, y: 0 })
        setZoom(1)
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            width={600}
        >
            <div className="flex flex-col h-[600px]">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h5 className="text-lg font-semibold">Ajustar imagen de perfil</h5>
                </div>
                
                <div className="relative flex-1">
                    <Cropper
                        image={imageUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                    />
                </div>

                <div className="px-6 py-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Zoom
                        </label>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <Button variant="default" onClick={handleReset}>
                            Resetear
                        </Button>
                        <Button variant="default" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button variant="solid" onClick={handleCrop}>
                            Aplicar
                        </Button>
                    </div>
                </div>
            </div>
        </Dialog>
    )
}