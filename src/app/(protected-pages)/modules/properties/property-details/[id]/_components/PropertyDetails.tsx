/**
 * frontend/src/app/(protected-pages)/modules/properties/property-details/[id]/_components/PropertyDetails.tsx
 * Componente mejorado para mostrar los detalles de una propiedad con mejor presentación visual, mapa funcional y overlay en galería de imágenes.
 * - Altura de imagen optimizada
 * - Dialog para visualización de imágenes
 * - Mapa funcional (integrado con react-leaflet)
 * - Overlay con transparencia en galería de imágenes
 * - Soporte para subida de documentos
 *
 * @version 3.3.0
 * @updated 2025-04-03
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Segment from '@/components/ui/Segment'
import Dialog from '@/components/ui/Dialog'
import { NumericFormat } from 'react-number-format'
import DoubleSidedImage from '@/components/shared/DoubleSidedImage'
import {
    generatePropertyDataSheet,
    printPropertyDataSheet,
} from '@/utils/generatePropertyDataSheet'
import {
    TbArrowLeft,
    TbPencil,
    TbHome,
    TbBuilding,
    TbBuildingStore,
    TbBuildingSkyscraper,
    TbBuildingWarehouse,
    TbBed,
    TbBath,
    TbRuler2,
    TbCar,
    TbMap,
    TbCalendar,
    TbSwimming,
    TbTree,
    TbGardenCart,
    TbShield,
    TbShare,
    TbHeart,
    TbHeartFilled,
    TbPrinter,
    TbDownload,
    TbEye,
    // TbUpload, // No necesario en vista de detalles
    TbX,
    TbChevronLeft,
    TbChevronRight,
} from 'react-icons/tb'
import { HiOutlineOfficeBuilding } from 'react-icons/hi'
import {
    Property,
    PropertyType,
} from '@/app/(protected-pages)/modules/properties/property-list/types'
import getProperty from '@/server/actions/properties/getProperty'

// Estilos CSS globales para ocultar la barra de desplazamiento en el carrusel
import './styles.css'

// Importaciones necesarias para el mapa funcional con react-leaflet
// Utilizamos un enfoque de carga dinámica para evitar errores de hidratación
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import UpdatedFunctionalMap from './UpdatedFunctionalMap'
import AgentInfo from './AgentInfo'

// Cargar componentes de react-leaflet de forma dinámica sin SSR
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false },
)
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false },
)
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false },
)
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
    ssr: false,
})

type PropertyDetailsProps = {
    id: string
}

// Función para obtener el ícono según el tipo de propiedad
const getPropertyIcon = (type: PropertyType) => {
    switch (type) {
        case 'house':
            return <TbHome className="text-2xl" />
        case 'apartment':
            return <TbBuilding className="text-2xl" />
        case 'commercial':
            return <TbBuildingStore className="text-2xl" />
        case 'office':
            return <HiOutlineOfficeBuilding className="text-2xl" />
        case 'industrial':
            return <TbBuildingWarehouse className="text-2xl" />
        case 'land':
            return <TbBuildingSkyscraper className="text-2xl" />
        default:
            return <TbHome className="text-2xl" />
    }
}

// Función para obtener el nombre del tipo de propiedad en español
const getPropertyTypeName = (type: PropertyType) => {
    switch (type) {
        case 'house':
            return 'Casa'
        case 'apartment':
            return 'Apartamento'
        case 'commercial':
            return 'Local Comercial'
        case 'office':
            return 'Oficina'
        case 'industrial':
            return 'Industrial'
        case 'land':
            return 'Terreno'
        default:
            return type
    }
}

// Función para obtener el color de badge según el estado de la propiedad
const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'available':
            return 'success'
        case 'sold':
            return 'danger'
        case 'rented':
            return 'warning'
        case 'pending':
            return 'primary'
        case 'reserved':
            return 'info'
        default:
            return 'default'
    }
}

// Función para obtener el nombre del estado en español
const getStatusName = (status: string) => {
    switch (status) {
        case 'available':
            return 'Disponible'
        case 'sold':
            return 'Vendida'
        case 'rented':
            return 'Rentada'
        case 'pending':
            return 'Pendiente'
        case 'reserved':
            return 'Reservada'
        default:
            return status
    }
}

// Definición de tipos para la galería de imágenes
type GalleryImage = {
    src: string
    alt: string
    verticalPosition?: number
}

type SimpleImageGalleryProps = {
    images: GalleryImage[]
    onImageClick: (index: number) => void
}

// Componente mejorado para galería de imágenes con altura controlada, thumbnails y overlay
const SimpleImageGallery = ({
    images,
    onImageClick,
}: SimpleImageGalleryProps) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const thumbnailsRef = useRef<HTMLDivElement>(null)

    const goToPrevious = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex(
            currentIndex === 0 ? images.length - 1 : currentIndex - 1,
        )
    }

    const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex(
            currentIndex === images.length - 1 ? 0 : currentIndex + 1,
        )
    }

    // Cuando cambie la imagen actual, destacamos la miniatura seleccionada
    useEffect(() => {
        // Aplicar estilos a las miniaturas según la selección actual
        const thumbnails = document.querySelectorAll('.thumbnail')
        thumbnails.forEach((thumb, idx) => {
            if (idx === currentIndex) {
                thumb.classList.add('ring-2', 'ring-primary', 'scale-105')
                thumb.classList.remove('opacity-70')
            } else {
                thumb.classList.remove('ring-2', 'ring-primary', 'scale-105')
                thumb.classList.add('opacity-70')
            }
        })
    }, [currentIndex])

    // Ajustar el grid al número de imágenes (máximo 6)
    useEffect(() => {
        if (thumbnailsRef.current && images.length > 0) {
            const gridElement = thumbnailsRef.current
            const imageCount = Math.min(images.length, 6) // Máximo 6 imágenes

            // Aplicar el estilo de grid-template-columns basado en el número de imágenes
            gridElement.style.gridTemplateColumns = `repeat(${imageCount}, 1fr)`

            // Si hay menos de 6 imágenes, ajustar el ancho para que ocupen todo el espacio
            if (imageCount < 6) {
                const thumbnails = gridElement.querySelectorAll('.thumbnail')
                thumbnails.forEach((thumbnail) => {
                    // Ajustamos el ancho para que ocupen más espacio pero mantengan la proporción
                    ;(thumbnail as HTMLElement).style.maxWidth =
                        `calc(100% / ${imageCount} - 4px)`
                })
            }
        }
    }, [images.length])

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-[400px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <DoubleSidedImage
                    src="/img/others/img-1.png"
                    darkModeSrc="/img/others/img-1-dark.png"
                    alt="No hay imagen disponible"
                    className="max-w-[200px]"
                />
            </div>
        )
    }

    return (
        <div className="w-full">
            {/* Imagen principal */}
            <div className="relative w-full h-[500px] cursor-pointer rounded-lg overflow-hidden mb-2">
                <img
                    src={images[currentIndex].src}
                    alt={images[currentIndex].alt}
                    className="w-full h-full object-cover rounded-lg"
                    style={{
                        objectPosition: images[currentIndex].verticalPosition
                            ? `center ${images[currentIndex].verticalPosition}%`
                            : 'center center',
                    }}
                    onClick={() => onImageClick(currentIndex)}
                />
                {images.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                        >
                            <TbChevronLeft className="text-xl" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                        >
                            <TbChevronRight className="text-xl" />
                        </button>
                    </>
                )}
                {/* Overlay con transparencia mostrando el número de imágenes */}
                {images.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 flex justify-center">
                        <span>{images.length} Imágenes</span>
                    </div>
                )}
            </div>

            {/* Carrusel de thumbnails */}
            {images.length > 1 && (
                <div className="relative">
                    {/* Eliminadas las flechas del carrusel de thumbnails */}

                    <div
                        ref={thumbnailsRef}
                        className="flex overflow-x-auto space-x-0 pb-2 hide-scrollbar thumbnails-grid"
                    >
                        {images.map((image, index) => (
                            <div
                                key={index}
                                className={`thumbnail rounded cursor-pointer transition-all ${currentIndex === index ? 'ring-2 ring-primary scale-105' : 'opacity-70 hover:opacity-100'}`}
                                onClick={() => setCurrentIndex(index)}
                            >
                                <img
                                    src={image.src}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover rounded"
                                    style={{
                                        objectPosition: image.verticalPosition
                                            ? `center ${image.verticalPosition}%`
                                            : 'center center',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Indicadores para pantallas pequeñas (se muestran en móviles) */}
            <div className="flex justify-center mt-2 lg:hidden">
                {images.map((_, idx) => (
                    <span
                        key={idx}
                        className={`h-2 w-2 mx-1 rounded-full ${idx === currentIndex ? 'bg-primary' : 'bg-gray-400 hover:bg-gray-600'}`}
                        onClick={() => setCurrentIndex(idx)}
                    />
                ))}
            </div>
        </div>
    )
}

type ImageDialogProps = {
    isOpen: boolean
    onClose: () => void
    images: GalleryImage[]
    initialIndex?: number
}

// Componente para el Dialog de imágenes
const ImageDialog = ({
    isOpen,
    onClose,
    images,
    initialIndex = 0,
}: ImageDialogProps) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)

    useEffect(() => {
        setCurrentIndex(initialIndex)
    }, [initialIndex])

    const goToPrevious = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex(
            currentIndex === 0 ? images.length - 1 : currentIndex - 1,
        )
    }

    const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex(
            currentIndex === images.length - 1 ? 0 : currentIndex + 1,
        )
    }

    if (!images || images.length === 0) return null

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            contentClassName="p-0 bg-transparent max-w-4xl"
            closable={false}
        >
            <div className="relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                >
                    <TbX className="text-xl" />
                </button>

                <div className="relative">
                    <img
                        src={images[currentIndex].src}
                        alt={images[currentIndex].alt}
                        style={{
                            objectPosition: images[currentIndex]
                                .verticalPosition
                                ? `center ${images[currentIndex].verticalPosition}%`
                                : 'center center',
                        }}
                        className="w-full max-h-[80vh] object-contain"
                    />

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={goToPrevious}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                            >
                                <TbChevronLeft className="text-2xl" />
                            </button>
                            <button
                                onClick={goToNext}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                            >
                                <TbChevronRight className="text-2xl" />
                            </button>

                            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                <div className="px-4 py-2 bg-black bg-opacity-50 rounded-full">
                                    <span className="text-white">
                                        {currentIndex + 1} / {images.length}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Dialog>
    )
}

// Importamos useEffect y useState para manejar la carga del mapa correctamente
import {
    useEffect as useLeafletEffect,
    useState as useLeafletState,
} from 'react'

// Creamos un Leaflet Map Icon de forma dinámica en cliente
const LeafletMapIcon = () => {
    useLeafletEffect(() => {
        // Dinámicamente configuramos el icono del marcador solo en cliente
        import('leaflet').then((L) => {
            delete L.Icon.Default.prototype._getIconUrl
            L.Icon.Default.mergeOptions({
                iconRetinaUrl:
                    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                iconUrl:
                    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl:
                    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            })
        })
    }, [])

    return null
}

// Componente de mapa funcional usando react-leaflet con carga dinámica
const FunctionalMap = ({ latitude, longitude }) => {
    // Estado para controlar cuándo se debe renderizar el mapa
    const [isMounted, setIsMounted] = useLeafletState(false)

    // Verificar si se debe mostrar ubicación aproximada (buscar en la propiedad actual)
    const property = useRef(null).current?.property
    const showApproximateLocation =
        property?.location?.showApproximateLocation === true ||
        property?.location?.showApproximateLocation === 'true'

    // Formatear la dirección en función de la configuración de privacidad
    const formatAddress = () => {
        if (!property) return 'Ubicación de la propiedad'

        const address = property.location?.address || ''
        const colony = property.location?.colony || ''
        const city = property.location?.city || ''
        const state = property.location?.state || ''

        return showApproximateLocation
            ? `Col. ${colony || 'N/A'}, ${city}, ${state}`
            : `${address}${colony ? `, Col. ${colony}` : ''}, ${city}, ${state}`
    }

    // Solo montar el mapa después de que el componente se haya renderizado en el cliente
    useLeafletEffect(() => {
        setIsMounted(true)
    }, [])

    if (!latitude || !longitude) {
        return (
            <div className="h-[400px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <TbMap className="text-5xl mx-auto mb-2 text-gray-400" />
                    <p>No hay coordenadas disponibles para mostrar el mapa</p>
                </div>
            </div>
        )
    }

    // Si no estamos en cliente todavía, mostramos un placeholder
    if (!isMounted) {
        return (
            <div className="h-[400px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <TbMap className="text-5xl mx-auto mb-2 text-gray-400" />
                    <p>Cargando mapa...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[400px] rounded-lg overflow-hidden">
            <LeafletMapIcon />
            <MapContainer
                center={[latitude, longitude]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[latitude, longitude]}>
                    <Popup>Ubicación de la propiedad</Popup>
                </Marker>
            </MapContainer>
        </div>
    )
}

type Document = {
    id: string
    name: string
    size: number
    url: string
}

// Eliminado el componente DocumentUpload ya que no es adecuado para la vista de detalles

const PropertyDetails = ({ id }: PropertyDetailsProps) => {
    const router = useRouter()
    const [property, setProperty] = useState<Property | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('info')
    const [favorite, setFavorite] = useState(false)
    const [imageDialogOpen, setImageDialogOpen] = useState(false)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [documents, setDocuments] = useState([]) // Documentos asociados a la propiedad

    // Referencia para el mapeo en DOM
    const mapRef = useRef(null)

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                setLoading(true)
                // Obtener la propiedad del servicio (usando server action)
                const propertyData = await getProperty({ id })

                if (propertyData) {
                    console.log('Propiedad recibida en detalle:', {
                        id: propertyData.id,
                        name: propertyData.name,
                        propertyType: propertyData.propertyType,
                        features: propertyData.features ? 'OK' : 'FALTA',
                        location: propertyData.location ? 'OK' : 'FALTA',
                        mediaCount: propertyData.media?.length || 0,
                    })

                    // Verificar si los datos recibidos tienen la estructura esperada
                    if (!propertyData.features || !propertyData.location) {
                        console.error(
                            'Estructura de datos incorrecta - Falta estructura anidada',
                            propertyData,
                        )
                    }

                    // PARCHE: Corregir el valor de show_approximate_location
                    // Este parche se puede eliminar cuando se corrija la causa raíz
                    // El problema es que el valor booleano 'false' no se procesa correctamente
                    if (propertyData.show_approximate_location === false) {
                        console.log(
                            '⚠️ APLICANDO PARCHE: Forzando show_approximate_location a false',
                        )
                        // Asegurarnos de que tanto el objeto principal como location tengan el valor correcto
                        propertyData.show_approximate_location = false
                        if (propertyData.location) {
                            propertyData.location.showApproximateLocation =
                                false
                        }
                    }

                    // Debug del valor en este punto
                    console.log(
                        'Valor final de show_approximate_location antes de setProperty:',
                        {
                            'propiedad directa':
                                propertyData.show_approximate_location,
                            'en location':
                                propertyData.location?.showApproximateLocation,
                        },
                    )

                    setProperty(propertyData)

                    // Simular documentos predeterminados
                    if (propertyData) {
                        setDocuments([
                            {
                                id: '1',
                                name: 'Brochure.pdf',
                                size: 2.4 * 1024 * 1024,
                                url: '#',
                            },
                            {
                                id: '2',
                                name: 'Planos.pdf',
                                size: 1.8 * 1024 * 1024,
                                url: '#',
                            },
                        ])
                    }
                } else {
                    console.error('No se encontró la propiedad con ID:', id)
                }
            } catch (error) {
                console.error('Error al obtener la propiedad:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProperty()
    }, [id])

    const handleBack = () => {
        router.back()
    }

    const handleEdit = () => {
        router.push(`/modules/properties/property-edit/${id}`)
    }

    const toggleFavorite = () => {
        setFavorite(!favorite)
    }

    const handleImageClick = (index) => {
        setSelectedImageIndex(index)
        setImageDialogOpen(true)
    }

    // Se eliminó la función handleDocumentUpload ya que no es apropiada para la vista de detalles

    if (loading) {
        return (
            <Container>
                <AdaptiveCard>
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-pulse">
                            Cargando detalles de la propiedad...
                        </div>
                    </div>
                </AdaptiveCard>
            </Container>
        )
    }

    if (!property) {
        return (
            <Container>
                <AdaptiveCard>
                    <div className="flex flex-col items-center justify-center h-64">
                        <h3 className="mb-4">Propiedad no encontrada</h3>
                        <p className="mb-6 text-gray-500">
                            La propiedad que buscas no existe o ha sido
                            eliminada.
                        </p>
                        <Button
                            variant="solid"
                            icon={<TbArrowLeft />}
                            onClick={handleBack}
                        >
                            Volver al listado
                        </Button>
                    </div>
                </AdaptiveCard>
            </Container>
        )
    }

    // Opciones para el segment (tabs)
    const segmentOptions = [
        { value: 'info', label: 'Información' },
        { value: 'location', label: 'Ubicación' },
        { value: 'media', label: 'Multimedia' },
    ]

    // Determinar cuál es la imagen principal para mostrar
    const primaryImage =
        property.media?.find((m) => m.isPrimary)?.url ||
        property.media?.[0]?.url

    // Preparar las imágenes para el componente ImageGallery
    const galleryImages =
        property.media?.map((m) => ({
            src: m.url,
            alt: m.title || 'Imagen de propiedad',
            verticalPosition: m.verticalPosition || 50, // Usar 50% como valor por defecto
        })) || []

    return (
        <Container>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Button
                        variant="plain"
                        icon={<TbArrowLeft />}
                        onClick={handleBack}
                        className="mr-2"
                    >
                        Volver
                    </Button>
                    <h3 className="m-0">
                        {property.name || 'Detalles de la propiedad'}
                    </h3>
                </div>
                <div className="flex items-center">
                    <Button
                        variant="plain"
                        icon={
                            favorite ? (
                                <TbHeartFilled className="text-red-500" />
                            ) : (
                                <TbHeart />
                            )
                        }
                        onClick={toggleFavorite}
                        className="mr-2"
                    >
                        Favorito
                    </Button>
                    <Button variant="plain" icon={<TbShare />} className="mr-2">
                        Compartir
                    </Button>
                    <Button
                        variant="twoTone"
                        icon={<TbPencil />}
                        onClick={handleEdit}
                    >
                        Editar
                    </Button>
                </div>
            </div>

            {/* Galería de imágenes principal con altura controlada y overlay */}
            <div className="mb-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                <SimpleImageGallery
                    images={galleryImages}
                    onImageClick={handleImageClick}
                />
            </div>

            {/* Dialog para visualización de imágenes a pantalla completa */}
            <ImageDialog
                isOpen={imageDialogOpen}
                onClose={() => setImageDialogOpen(false)}
                images={galleryImages}
                initialIndex={selectedImageIndex}
            />

            {/* Información principal de la propiedad */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Columna izquierda - Información general */}
                <div className="lg:col-span-2">
                    <AdaptiveCard>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center mb-2">
                                    <h4 className="m-0 mr-2">
                                        {property.name}
                                    </h4>
                                    <Badge
                                        content={getStatusName(property.status)}
                                        color={getStatusBadgeColor(
                                            property.status,
                                        )}
                                    />
                                </div>
                                <div className="text-gray-500 mb-1">
                                    ID:{' '}
                                    {property.propertyCode ||
                                        property.id.slice(0, 8).toUpperCase()}
                                </div>
                                <div className="flex items-center mb-2">
                                    {getPropertyIcon(
                                        property.propertyType || 'house',
                                    )}
                                    <span className="ml-1">
                                        {getPropertyTypeName(
                                            property.propertyType || 'house',
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center mb-1">
                                    <TbMap className="mr-1" />
                                    <span>
                                        {(() => {
                                            // Determinar el valor de showApproximateLocation
                                            const isApproximate =
                                                property.location
                                                    ?.showApproximateLocation ===
                                                    true ||
                                                property.location
                                                    ?.showApproximateLocation ===
                                                    'true' ||
                                                property.show_approximate_location ===
                                                    true ||
                                                property.show_approximate_location ===
                                                    'true'

                                            // Ver el valor que estamos usando
                                            console.log(
                                                `PropertyDetails - Mostrar ubicación aproximada: ${isApproximate}`,
                                                {
                                                    location_showApproximate:
                                                        property.location
                                                            ?.showApproximateLocation,
                                                    root_showApproximate:
                                                        property.show_approximate_location,
                                                },
                                            )

                                            // Formatear dirección según el valor
                                            if (isApproximate) {
                                                return `Col. ${property.location?.colony || 'N/A'}, ${property.location?.city || ''}, ${property.location?.state || ''}`
                                            } else {
                                                return `${property.location?.address || ''}, ${property.location?.colony ? `Col. ${property.location.colony}, ` : ''}${property.location?.city || ''}, ${property.location?.state || ''}`
                                            }
                                        })()}
                                    </span>

                                    {/* Mensaje de depuración en consola */}
                                    {console.log(
                                        '🏡 Estado de ubicación aproximada (detallado):',
                                        {
                                            'show_approximate_location directo':
                                                property.show_approximate_location,
                                            'tipo directo':
                                                typeof property.show_approximate_location,
                                            'showApproximateLocation en location':
                                                property.location
                                                    ?.showApproximateLocation,
                                            'tipo en location':
                                                typeof property.location
                                                    ?.showApproximateLocation,
                                            'decisión final':
                                                !(
                                                    property.show_approximate_location ===
                                                        false ||
                                                    property.location
                                                        ?.showApproximateLocation ===
                                                        false
                                                ) &&
                                                (property.location
                                                    ?.showApproximateLocation ===
                                                    true ||
                                                    property.location
                                                        ?.showApproximateLocation ===
                                                        'true' ||
                                                    property.show_approximate_location ===
                                                        true ||
                                                    property.show_approximate_location ===
                                                        'true'),
                                        },
                                    )}

                                    {/* Simplificado para usar la misma lógica */}
                                    {(() => {
                                        const isApproximate =
                                            property.location
                                                ?.showApproximateLocation ===
                                                true ||
                                            property.location
                                                ?.showApproximateLocation ===
                                                'true' ||
                                            property.show_approximate_location ===
                                                true ||
                                            property.show_approximate_location ===
                                                'true'

                                        // Solo mostrar el badge si es aproximado
                                        return (
                                            isApproximate && (
                                                <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-1 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                                                    Aprox.
                                                </span>
                                            )
                                        )
                                    })()}
                                </div>
                            </div>
                            <div className="text-2xl font-bold">
                                <NumericFormat
                                    displayType="text"
                                    value={property.price}
                                    thousandSeparator={true}
                                    prefix={
                                        property.currency === 'USD'
                                            ? '$'
                                            : property.currency === 'EUR'
                                              ? '€'
                                              : '$'
                                    }
                                    decimalScale={0}
                                />
                                <span className="text-sm text-gray-500 ml-1">
                                    {property.operationType === 'rent'
                                        ? '/ mes'
                                        : ''}
                                </span>
                            </div>
                        </div>

                        {/* Tabs de navegación */}
                        <div className="mb-4">
                            <Segment
                                value={activeTab}
                                onChange={(val) => setActiveTab(val as string)}
                                size="sm"
                            >
                                {segmentOptions.map((option) => (
                                    <Segment.Item
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </Segment.Item>
                                ))}
                            </Segment>
                        </div>

                        {/* Contenido según la pestaña activa */}
                        <div className="mt-4">
                            {activeTab === 'info' && (
                                <div>
                                    {/* Características principales - Iconos destacados */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        {property.features?.bedrooms > 0 && (
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <TbBed className="text-4xl text-primary mb-2" />
                                                <div className="font-medium">
                                                    {property.features.bedrooms}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Habitaciones
                                                </div>
                                            </div>
                                        )}
                                        {property.features?.bathrooms > 0 && (
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <TbBath className="text-4xl text-primary mb-2" />
                                                <div className="font-medium">
                                                    {
                                                        property.features
                                                            .bathrooms
                                                    }
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Baños
                                                </div>
                                            </div>
                                        )}
                                        {property.features?.area > 0 && (
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <TbRuler2 className="text-4xl text-primary mb-2" />
                                                <div className="font-medium">
                                                    {property.features.area} m²
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Superficie
                                                </div>
                                            </div>
                                        )}
                                        {property.features?.parkingSpots >
                                            0 && (
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <TbCar className="text-4xl text-primary mb-2" />
                                                <div className="font-medium">
                                                    {
                                                        property.features
                                                            .parkingSpots
                                                    }
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Estacionamientos
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Descripción */}
                                    <div className="mb-6">
                                        <h5 className="mb-3">Descripción</h5>
                                        <div
                                            className="prose dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{
                                                __html:
                                                    property.description ||
                                                    'Sin descripción disponible',
                                            }}
                                        />
                                    </div>

                                    {/* Características detalladas */}
                                    <div className="mb-6">
                                        <h5 className="mb-3">
                                            Características adicionales
                                        </h5>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {property.features?.yearBuilt && (
                                                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <TbCalendar className="text-4xl mr-2 text-primary" />
                                                    <div>
                                                        <div className="text-xs text-gray-500">
                                                            Año construcción
                                                        </div>
                                                        <div className="font-medium">
                                                            {
                                                                property
                                                                    .features
                                                                    .yearBuilt
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {property.features?.hasPool && (
                                                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <TbSwimming className="text-4xl mr-2 text-primary" />
                                                    <div>
                                                        <div className="text-xs text-gray-500">
                                                            Piscina
                                                        </div>
                                                        <div className="font-medium">
                                                            Sí
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {property.features?.hasGarden && (
                                                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <TbTree className="text-4xl mr-2 text-primary" />
                                                    <div>
                                                        <div className="text-xs text-gray-500">
                                                            Jardín
                                                        </div>
                                                        <div className="font-medium">
                                                            Sí
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {property.features
                                                ?.securitySystem && (
                                                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <TbShield className="text-4xl mr-2 text-primary" />
                                                    <div>
                                                        <div className="text-xs text-gray-500">
                                                            Seguridad
                                                        </div>
                                                        <div className="font-medium">
                                                            Sí
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {property.features?.otherFeatures &&
                                                property.features.otherFeatures.map(
                                                    (feature, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                                        >
                                                            <TbGardenCart className="text-4xl mr-2 text-primary" />
                                                            <div>
                                                                <div className="text-xs text-gray-500">
                                                                    Otro
                                                                </div>
                                                                <div className="font-medium">
                                                                    {feature}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'location' && (
                                <div ref={mapRef}>
                                    {/* Componente de mapa funcional */}
                                    <UpdatedFunctionalMap
                                        property={property}
                                        latitude={
                                            property.location?.coordinates?.lat
                                        }
                                        longitude={
                                            property.location?.coordinates?.lng
                                        }
                                    />
                                </div>
                            )}

                            {activeTab === 'media' && (
                                <div>
                                    <h5 className="mb-3">Documentos</h5>
                                    {documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between p-3 mb-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                        >
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 mr-2 truncate"
                                            >
                                                {doc.name}
                                            </a>
                                            <span className="text-xs text-gray-500">
                                                {(
                                                    doc.size /
                                                    (1024 * 1024)
                                                ).toFixed(2)}{' '}
                                                MB
                                            </span>
                                            <Button
                                                variant="plain"
                                                icon={<TbDownload />}
                                                size="sm"
                                            >
                                                Descargar
                                            </Button>
                                        </div>
                                    ))}
                                    {/* La funcionalidad de subir documentos se ha eliminado de la vista de detalles */}
                                    {documents.length === 0 && (
                                        <div className="text-center py-4 text-gray-500">
                                            No hay documentos disponibles para
                                            esta propiedad
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </AdaptiveCard>
                </div>

                {/* Columna derecha - Información del agente */}
                <div className="hidden lg:block">
                    <AgentInfo agentId={property.agentId} property={property} />
                </div>
            </div>
        </Container>
    )
}

export default PropertyDetails
