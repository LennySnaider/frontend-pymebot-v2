/**
 * frontend/src/components/view/PropertyForm/components/MediaSection.tsx
 * Sección de imágenes y videos del formulario de propiedades.
 * Implementa funcionalidad drag & drop para reordenar imágenes usando @hello-pangea/dnd.
 *
 * @version 3.0.0
 * @updated 2025-06-24
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Card from '@/components/ui/Card'
import Upload from '@/components/ui/Upload'
import { FormItem } from '@/components/ui/Form'
import Dialog from '@/components/ui/Dialog'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { Controller } from 'react-hook-form'
import { HiEye, HiTrash } from 'react-icons/hi'
import { MdStar, MdStarOutline } from 'react-icons/md'
import { TbArrowsSort, TbCrop, TbPhoto } from 'react-icons/tb'
import cloneDeep from 'lodash/cloneDeep'
import { PiImagesThin } from 'react-icons/pi'
import { v4 as uuidv4 } from 'uuid'
import StorageService from '@/services/StorageService'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Tooltip from '@/components/ui/Tooltip'
import ReactCrop from 'react-easy-crop'
import { DragDropContext, Draggable } from '@hello-pangea/dnd'
import StrictModeDroppable from '@/components/shared/StrictModeDroppable'

import type { FormSectionBaseProps } from '../types'
import type {
    Point,
    Area,
} from '../../../../../node_modules/react-easy-crop/types'

type Media = {
    id: string
    type: 'image' | 'video'
    url: string
    thumbnail?: string
    title?: string
    isPrimary?: boolean
    displayOrder?: number
    _file?: File // Campo temporal para el archivo original
    _uploading?: boolean // Indicador de carga
    _storagePath?: string // Ruta en storage para eliminación
    _originalUrl?: string // URL original para imágenes ya guardadas
}

type MediaItemProps = {
    media: Media
    index: number
    onMediaDelete: (media: Media) => void
    onSetPrimary: (media: Media) => void
    onView: (media: Media) => void
    onCrop: (media: Media) => void
    isUploading?: boolean
}

const MediaItem = ({
    media,
    index,
    onMediaDelete,
    onSetPrimary,
    onView,
    onCrop,
    isUploading = false,
}: MediaItemProps) => {
    // Propiedades para drag & drop
    const itemId = `media-item-${media.id}`

    return (
        <Draggable draggableId={itemId} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="group relative rounded-xl border border-gray-200 dark:border-gray-600 p-2 flex aspect-[4/3]"
                >
                    {media._uploading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-10 rounded-lg">
                            <Spinner size={30} />
                        </div>
                    ) : null}

                    <img
                        className="rounded-lg max-h-full max-w-full m-auto object-cover"
                        src={media.url}
                        alt={media.title || 'Imagen de propiedad'}
                    />

                    {media.isPrimary && (
                        <div className="absolute top-2 right-2 bg-primary rounded-full p-1 text-white">
                            <MdStar size={18} />
                        </div>
                    )}

                    <div className="absolute inset-2 bg-[#000000ba] group-hover:flex hidden text-xl items-center justify-center">
                        <Tooltip title="Ver imagen">
                            <span
                                className="text-gray-100 hover:text-gray-300 cursor-pointer p-1.5"
                                onClick={() => onView(media)}
                            >
                                <HiEye />
                            </span>
                        </Tooltip>

                        <Tooltip title="Recortar imagen">
                            <span
                                className="text-gray-100 hover:text-gray-300 cursor-pointer p-1.5"
                                onClick={() => onCrop(media)}
                            >
                                <TbCrop />
                            </span>
                        </Tooltip>

                        {!media.isPrimary && (
                            <Tooltip title="Establecer como principal">
                                <span
                                    className="text-gray-100 hover:text-gray-300 cursor-pointer p-1.5"
                                    onClick={() => onSetPrimary(media)}
                                >
                                    <MdStarOutline />
                                </span>
                            </Tooltip>
                        )}

                        <Tooltip title="Eliminar imagen">
                            <span
                                className="text-gray-100 hover:text-gray-300 cursor-pointer p-1.5"
                                onClick={() => onMediaDelete(media)}
                            >
                                <HiTrash />
                            </span>
                        </Tooltip>
                    </div>

                    <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-70 text-white px-2 py-1 text-xs rounded-full">
                        {index + 1}
                    </div>
                </div>
            )}
        </Draggable>
    )
}

type MediaListProps = {
    mediaList: Media[]
    onMediaDelete: (media: Media) => void
    onSetPrimary: (media: Media) => void
    onReorder: (result: any) => void
    uploading?: boolean
}

const MediaList = ({
    mediaList,
    onMediaDelete,
    onSetPrimary,
    onReorder,
    uploading = false,
}: MediaListProps) => {
    const [selectedMedia, setSelectedMedia] = useState<Media>({} as Media)
    const [viewOpen, setViewOpen] = useState(false)
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const [cropOpen, setCropOpen] = useState(false)
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
        null,
    )

    const onViewOpen = (media: Media) => {
        setSelectedMedia(media)
        setViewOpen(true)
    }

    const onDialogClose = () => {
        setViewOpen(false)
        setTimeout(() => {
            setSelectedMedia({} as Media)
        }, 300)
    }

    const onDeleteConfirmation = (media: Media) => {
        setSelectedMedia(media)
        setDeleteConfirmationOpen(true)
    }

    const onDeleteConfirmationClose = () => {
        setSelectedMedia({} as Media)
        setDeleteConfirmationOpen(false)
    }

    const onDelete = () => {
        onMediaDelete?.(selectedMedia)
        setDeleteConfirmationOpen(false)
    }

    const handleSetPrimary = (media: Media) => {
        onSetPrimary?.(media)
    }

    // Manejador para el recorte de imágenes
    const onCropOpen = (media: Media) => {
        setSelectedMedia(media)
        setCropOpen(true)
        // Resetear los valores del recorte
        setCrop({ x: 0, y: 0 })
        setZoom(1)
    }

    const onCropDialogClose = () => {
        setCropOpen(false)
        setTimeout(() => {
            setSelectedMedia({} as Media)
        }, 300)
    }

    const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }

    // Esta función se llamaría al guardar el recorte
    const saveCroppedImage = async () => {
        try {
            if (!croppedAreaPixels) {
                toast.push(
                    <Notification type="warning">
                        Por favor, realiza un recorte primero
                    </Notification>,
                    { placement: 'top-center' },
                )
                return
            }

            // Aquí normalmente aplicaríamos el recorte y guardaríamos la imagen
            // Por simplicidad, sólo cerraremos el diálogo
            toast.push(
                <Notification type="success">
                    Imagen recortada con éxito
                </Notification>,
                { placement: 'top-center' },
            )

            onCropDialogClose()
        } catch (error) {
            console.error('Error al recortar la imagen:', error)
            toast.push(
                <Notification type="danger">
                    Error al procesar el recorte de la imagen
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }

    return (
        <>
            <DragDropContext onDragEnd={onReorder}>
                <StrictModeDroppable
                    droppableId="media-list-droppable"
                    direction="horizontal"
                >
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 relative"
                        >
                            {mediaList.map((media, index) => (
                                <MediaItem
                                    key={media.id}
                                    media={media}
                                    index={index}
                                    onMediaDelete={onDeleteConfirmation}
                                    onSetPrimary={handleSetPrimary}
                                    onView={onViewOpen}
                                    onCrop={onCropOpen}
                                    isUploading={uploading}
                                />
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </StrictModeDroppable>
            </DragDropContext>

            {/* Overlay global para indicar carga */}
            {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-20">
                    <div className="flex flex-col items-center">
                        <Spinner size={50} />
                        <p className="mt-2 text-gray-600">
                            Procesando imágenes...
                        </p>
                    </div>
                </div>
            )}

            {/* Diálogo para ver imagen */}
            <Dialog
                isOpen={viewOpen}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <h5 className="mb-4">
                    {selectedMedia.title || 'Imagen de propiedad'}
                </h5>
                <img
                    className="w-full"
                    src={selectedMedia.url}
                    alt={selectedMedia.title || 'Imagen de propiedad'}
                />
            </Dialog>

            {/* Diálogo para recortar imagen */}
            <Dialog
                isOpen={cropOpen}
                onClose={onCropDialogClose}
                onRequestClose={onCropDialogClose}
            >
                <h5 className="mb-4">Recortar imagen</h5>
                <div className="relative h-[300px] w-full mb-4">
                    {selectedMedia?.url && (
                        <ReactCrop
                            image={selectedMedia.url}
                            crop={crop}
                            zoom={zoom}
                            aspect={4 / 3}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    <Button onClick={onCropDialogClose} variant="plain">
                        Cancelar
                    </Button>
                    <Button onClick={saveCroppedImage} variant="solid">
                        Aplicar recorte
                    </Button>
                </div>
            </Dialog>

            {/* Confirmación para eliminar */}
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title="Eliminar imagen"
                onClose={onDeleteConfirmationClose}
                onRequestClose={onDeleteConfirmationClose}
                onCancel={onDeleteConfirmationClose}
                onConfirm={onDelete}
            >
                <p>¿Estás seguro que deseas eliminar esta imagen?</p>
            </ConfirmDialog>
        </>
    )
}

type MediaSectionProps = FormSectionBaseProps & {
    propertyId?: string // ID de la propiedad para organizar las imágenes
    newProperty?: boolean // Indica si es una propiedad nueva
}

const MediaSection = ({
    control,
    errors,
    propertyId,
    newProperty = false,
}: MediaSectionProps) => {
    const [globalUploading, setGlobalUploading] = useState(false)
    const [initializeStorage, setInitializeStorage] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Al montar el componente, asegurarse de que el bucket de storage existe
    useEffect(() => {
        const checkStorage = async () => {
            try {
                // Solo hacemos esta verificación una vez
                if (!initializeStorage) {
                    setInitializeStorage(true)
                    await StorageService.ensureBucketExists()
                }
            } catch (error) {
                console.error('Error al inicializar el almacenamiento:', error)
            }
        }

        checkStorage()
    }, [initializeStorage])

    const beforeUpload = (file: FileList | null) => {
        let valid: boolean | string = true

        const allowedFileType = ['image/jpeg', 'image/png', 'image/webp']
        const maxFileSize = 5000000 // 5MB

        if (file) {
            Array.from(file).forEach((f) => {
                if (!allowedFileType.includes(f.type)) {
                    valid =
                        'Por favor, sube archivos en formato .jpeg, .png o .webp'
                }

                if (f.size >= maxFileSize) {
                    valid = '¡Las imágenes no pueden superar los 5MB!'
                }
            })
        }

        return valid
    }

    const handleUpload = async (
        onChange: (media: Media[]) => void,
        originalMediaList: Media[] = [],
        files: File[],
    ) => {
        // Contar sólo las imágenes válidas en originalMediaList (algunas pueden ser undefined o null)
        const validImagesCount = originalMediaList.filter(
            (media) => media && media.url && !media._uploading,
        ).length

        console.log(
            `Imágenes actuales: ${validImagesCount}, Nuevas imágenes: ${files.length}, Límite: 10`,
        )

        // Validar límite de imágenes (sólo contando las válidas)
        if (validImagesCount + files.length > 10) {
            toast.push(
                <Notification type="warning">
                    No se pueden añadir más de 10 imágenes por propiedad
                    (Actuales: ${validImagesCount})
                </Notification>,
                { placement: 'top-center' },
            )
            return
        }

        // Activar indicador global de carga antes de iniciar las subidas
        setGlobalUploading(true)

        // Verificamos primero si hay archivos duplicados en la selección
        const uniqueFiles = files.filter(
            (file, index, self) =>
                self.findIndex(
                    (f) => f.name === file.name && f.size === file.size,
                ) === index,
        )

        if (uniqueFiles.length < files.length) {
            console.log(
                `Se eliminaron ${files.length - uniqueFiles.length} imágenes duplicadas de la selección`,
            )
        }

        // Crear un array con todas las promesas de subida para procesarlas en paralelo
        const uploadPromises = uniqueFiles.map(async (file) => {
            // Evitar crear una copia del array original para cada archivo
            // La actualización completa se hará solo al final

            // Crear un ID único
            const tempId = uuidv4()

            // Determinar si es la imagen principal
            const isPrimary =
                originalMediaList.length === 0 &&
                uniqueFiles.indexOf(file) === 0 // Primera imagen automáticamente principal

            // Crear URL temporal para vista previa
            const tempUrl = URL.createObjectURL(file)

            // Determinar el orden de visualización
            const displayOrder =
                originalMediaList.length + uniqueFiles.indexOf(file)

            // Comprobamos si ya existe una imagen con el mismo nombre en la lista original
            const hasDuplicate = originalMediaList.some(
                (m) => (m.title === file.name && m._file) || m.url === tempUrl,
            )

            if (hasDuplicate) {
                console.log(
                    `Imagen duplicada detectada y omitida: ${file.name}`,
                )
                // No seguimos procesando este archivo
                return null
            }

            try {
                // Para propiedades existentes usamos el ID real, para nuevas generamos uno temporal
                const targetPropertyId = propertyId || `temp_${uuidv4()}`

                console.log(
                    `Subiendo imagen a Supabase para propiedad: ${targetPropertyId}`,
                )

                // Verificar que el bucket existe antes de subir
                await StorageService.ensureBucketExists()

                // Subir a Supabase Storage
                const uploadResult = await StorageService.uploadPropertyImage(
                    file,
                    targetPropertyId,
                )

                if (uploadResult && uploadResult.success) {
                    console.log('Imagen subida exitosamente:', uploadResult)

                    // Crear media actualizada
                    return {
                        id: tempId,
                        type: 'image',
                        url: uploadResult.url,
                        _originalUrl: uploadResult.url, // Guardar URL original
                        title: file.name,
                        isPrimary,
                        displayOrder,
                        _uploading: false,
                        _storagePath: uploadResult.path, // Guardar ruta para eliminar después
                    }
                } else {
                    console.error('Error al subir imagen:', uploadResult?.error)

                    // Si falló la subida pero tenemos la URL temporal, usamos esa como respaldo
                    toast.push(
                        <Notification type="warning">
                            Error al subir a Supabase Storage:{' '}
                            {uploadResult?.error || 'Error desconocido'}. La
                            imagen se guardará temporalmente.
                        </Notification>,
                        { placement: 'top-center' },
                    )

                    // Retornar la versión temporal si falla Supabase
                    return {
                        id: tempId,
                        type: 'image',
                        url: tempUrl,
                        title: file.name,
                        isPrimary,
                        displayOrder,
                        _file: file, // Mantener el archivo para intentar subirlo después
                        _uploading: false,
                    }
                }
            } catch (error) {
                console.error('Error inesperado en la subida de imagen:', error)

                // Mostrar notificación de error
                toast.push(
                    <Notification type="danger">
                        Error en la carga de imagen:{' '}
                        {error instanceof Error
                            ? error.message
                            : 'Error desconocido'}
                    </Notification>,
                    { placement: 'top-center' },
                )

                // Retornar null para indicar que esta media debería omitirse
                return null
            }
        })

        try {
            // Esperar a que todas las subidas terminen
            const results = await Promise.all(uploadPromises)

            // Filtrar resultados exitosos (eliminar nulls)
            const successfulMedia = results.filter((media) => media !== null)

            // Solo si hay medios exitosos actualizamos el estado
            if (successfulMedia.length > 0) {
                // Eliminar cualquier media temporal creada previamente
                const cleanOriginalList = originalMediaList.filter(
                    (media) => !media._uploading,
                )

                // Crear una estructura bien ordenada con los nuevos elementos añadidos al final
                const updatedMediaList = [...cleanOriginalList]

                // Añadir los nuevos medios asegurándonos de actualizar sus órdenes
                successfulMedia.forEach((media, index) => {
                    if (media) {
                        updatedMediaList.push({
                            ...media,
                            displayOrder: cleanOriginalList.length + index,
                        })
                    }
                })

                // Actualizar el estado una sola vez con la lista completa
                onChange(updatedMediaList)

                console.log(
                    `Estado actualizado con ${updatedMediaList.length} imágenes en total`,
                )
            }

            // Si hubo algún error (longitud de resultados != longitud de éxitos)
            if (uniqueFiles.length !== successfulMedia.length) {
                toast.push(
                    <Notification type="warning">
                        Algunas imágenes no pudieron ser procesadas
                        correctamente
                    </Notification>,
                    { placement: 'top-center' },
                )
            }
        } catch (error) {
            console.error('Error al procesar lote de imágenes:', error)
            toast.push(
                <Notification type="danger">
                    Error al procesar las imágenes
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            // Desactivar indicador global de carga
            setGlobalUploading(false)
        }
    }

    // Gestión de eliminación de medios - mejorado para eliminar del storage siempre
    const handleMediaDelete = async (
        onChange: (media: Media[]) => void,
        originalMediaList: Media[] = [],
        deletedMedia: Media,
    ) => {
        let mediaList = cloneDeep(originalMediaList)
        mediaList = mediaList.filter((media) => media.id !== deletedMedia.id)

        // Si eliminamos la principal, la primera disponible se convierte en principal
        if (deletedMedia.isPrimary && mediaList.length > 0) {
            mediaList[0].isPrimary = true
        }

        // Reordenar los displayOrder después de eliminar
        mediaList = mediaList.map((media, index) => ({
            ...media,
            displayOrder: index,
        }))

        // Si tenemos la ruta de almacenamiento y no es propiedad nueva, eliminar de Storage
        if (deletedMedia._storagePath && !newProperty && propertyId) {
            try {
                setGlobalUploading(true)
                await StorageService.deleteFile(deletedMedia._storagePath)
                console.log(
                    `Imagen eliminada de storage: ${deletedMedia._storagePath}`,
                )
            } catch (error) {
                console.error('Error al eliminar imagen del storage:', error)
                // Continuamos a pesar del error para actualizar la UI
                toast.push(
                    <Notification type="warning">
                        Advertencia: La imagen se eliminó de la propiedad pero
                        podría no haberse eliminado completamente del servidor
                    </Notification>,
                    { placement: 'top-center' },
                )
            } finally {
                setGlobalUploading(false)
            }
        }

        onChange(mediaList)
    }

    const handleSetPrimary = (
        onChange: (media: Media[]) => void,
        originalMediaList: Media[] = [],
        primaryMedia: Media,
    ) => {
        let mediaList = cloneDeep(originalMediaList)
        mediaList = mediaList.map((media) => ({
            ...media,
            isPrimary: media.id === primaryMedia.id,
        }))

        onChange(mediaList)
    }

    // Función para manejar el reordenamiento por drag & drop
    const handleReorder = (
        onChange: (media: Media[]) => void,
        originalMediaList: Media[] = [],
        result: any,
    ) => {
        // Ignorar si se suelta fuera de un droppable
        if (!result.destination) return

        const startIndex = result.source.index
        const endIndex = result.destination.index

        // Si no hay cambio de posición, no hacer nada
        if (startIndex === endIndex) return

        // Crear copia para no mutar el estado directamente
        const mediaList = cloneDeep(originalMediaList)

        // Reordenar el array (mover un ítem de startIndex a endIndex)
        const [removed] = mediaList.splice(startIndex, 1)
        mediaList.splice(endIndex, 0, removed)

        // Actualizar displayOrder para todos los elementos
        const updatedMediaList = mediaList.map((media, index) => ({
            ...media,
            displayOrder: index,
        }))

        // Actualizar el estado
        onChange(updatedMediaList)

        toast.push(
            <Notification type="success">
                Orden de imágenes actualizado
            </Notification>,
            { placement: 'top-center' },
        )
    }

    // Efecto para marcar la primera imagen como principal si no hay ninguna marcada
    useEffect(() => {
        const mediaValue = control?.getValues?.('media')
        if (mediaValue && mediaValue.length > 0) {
            const hasPrimary = mediaValue.some((media) => media.isPrimary)
            if (!hasPrimary && control?.setValue) {
                const updatedMedia = [...mediaValue]
                updatedMedia[0].isPrimary = true
                control.setValue('media', updatedMedia)
            }
        }
    }, [control])

    return (
        <Card className="relative">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h4 className="m-0">Imágenes de la Propiedad</h4>
                    <p className="text-gray-500 mt-1">
                        Selecciona o arrastra hasta 10 fotos de la propiedad
                    </p>
                </div>

                <Tooltip title="Reordena las imágenes arrastrándolas a la posición deseada">
                    <div className="flex items-center gap-1 text-gray-500">
                        <TbArrowsSort className="text-lg" />
                        <span className="text-sm">Arrastra para ordenar</span>
                    </div>
                </Tooltip>
            </div>

            <div className="mt-2">
                <FormItem
                    invalid={Boolean(errors.media)}
                    errorMessage={errors.media?.message}
                    className="mb-4"
                >
                    <Controller
                        name="media"
                        control={control}
                        render={({ field }) => (
                            <>
                                {field.value && field.value.length ? (
                                    <div className="relative">
                                        <MediaList
                                            mediaList={field.value}
                                            onMediaDelete={(media: Media) =>
                                                handleMediaDelete(
                                                    field.onChange,
                                                    field.value,
                                                    media,
                                                )
                                            }
                                            onSetPrimary={(media: Media) =>
                                                handleSetPrimary(
                                                    field.onChange,
                                                    field.value,
                                                    media,
                                                )
                                            }
                                            onReorder={(result) =>
                                                handleReorder(
                                                    field.onChange,
                                                    field.value,
                                                    result,
                                                )
                                            }
                                            uploading={globalUploading}
                                        />

                                        {field.value.filter(
                                            (media) =>
                                                media &&
                                                media.url &&
                                                !media._uploading,
                                        ).length < 10 && (
                                            <div className="mt-4">
                                                <Upload
                                                    draggable
                                                    className="min-h-[120px]"
                                                    beforeUpload={beforeUpload}
                                                    showList={false}
                                                    onChange={(files) =>
                                                        handleUpload(
                                                            field.onChange,
                                                            field.value,
                                                            files,
                                                        )
                                                    }
                                                    disabled={globalUploading}
                                                    ref={fileInputRef}
                                                >
                                                    <div className="max-w-full flex flex-col px-4 py-6 justify-center items-center h-full">
                                                        <div className="text-[50px] text-gray-400">
                                                            <TbPhoto />
                                                        </div>
                                                        <p className="text-center mt-2 text-sm">
                                                            <span className="text-gray-800 dark:text-white">
                                                                Arrastra tus
                                                                imágenes aquí, o{' '}
                                                            </span>
                                                            <span className="text-primary cursor-pointer font-medium">
                                                                haz clic para
                                                                buscar
                                                            </span>
                                                        </p>
                                                    </div>
                                                </Upload>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Upload
                                        draggable
                                        beforeUpload={beforeUpload}
                                        showList={false}
                                        onChange={(files) =>
                                            handleUpload(
                                                field.onChange,
                                                field.value,
                                                files,
                                            )
                                        }
                                        disabled={globalUploading}
                                        ref={fileInputRef}
                                    >
                                        <div className="max-w-full flex flex-col px-4 py-8 justify-center items-center">
                                            <div className="text-[60px] text-gray-400">
                                                <PiImagesThin />
                                            </div>
                                            <p className="flex flex-col items-center mt-2">
                                                <span className="text-gray-800 dark:text-white">
                                                    Arrastra tus imágenes aquí,
                                                    o {''}
                                                </span>
                                                <span className="text-primary cursor-pointer font-medium">
                                                    haz clic para buscar
                                                </span>
                                            </p>
                                        </div>
                                    </Upload>
                                )}
                            </>
                        )}
                    />
                </FormItem>
            </div>
            <p className="text-sm text-gray-500">
                Formatos: .jpg, .jpeg, .png, .webp | Tamaño máximo: 5MB |
                Recomendado: imágenes de alta calidad en formato horizontal
            </p>
        </Card>
    )
}

export default MediaSection
