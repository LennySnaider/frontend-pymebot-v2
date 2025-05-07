/**
 * frontend/src/components/shared/Location/LocationSection.tsx
 * Componente para selección encadenada de ubicación en México (Estado, Municipio, Colonia, CP)
 * Adaptado para trabajar con react-hook-form y geocodificación automática
 * Incluye visualización en mapa de la ubicación seleccionada
 * @version 1.6.2
 * @updated 2025-10-15
 */

import React, { useEffect, useState, useCallback } from 'react'
import ClientSelect from '@/components/shared/ClientSelect'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PiMapPinFill, PiEyeSlash, PiEye } from 'react-icons/pi'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import useSepomexApi from '@/utils/hooks/useSepomexApi'
import { Controller, useFormContext } from 'react-hook-form'
import MapDisplay from './MapComponents/MapDisplay'

const GEO_API_KEY = '67f085f1a33c9258251767yrh6b6c80'

interface LocationSectionProps {
    control: any
    errors: any
}

interface Coordinates {
    lat: number
    lng: number
}

interface GeocodingResult {
    lat: string
    lon: string
    display_name: string
    [key: string]: any
}

interface SelectOption {
    label: string
    value: string
}

const LocationSection: React.FC<LocationSectionProps> = ({
    control,
    errors,
}) => {
    const { setValue, watch, getValues } = useFormContext()

    const zipCode = watch('location.zipCode') || ''
    const [zipCodeSearch, setZipCodeSearch] = useState<string>(zipCode)

    const address = watch('location.address') || ''
    const city = watch('location.city') || ''
    const state = watch('location.state') || ''
    const colony = watch('location.colony') || ''
    // Ya no definimos una variable local para showApproximateLocation
    // Ahora usamos watch('location.showApproximateLocation') directamente en el JSX

    const {
        loading,
        error,
        getStates,
        getMunicipalities,
        getColonies,
        getLocationByZipCode,
    } = useSepomexApi()

    const [message, setMessage] = useState<{
        text: string
        type: 'success' | 'error' | 'info'
    } | null>(null)
    const [geocoding, setGeocoding] = useState<boolean>(false)
    const [searchingZipCode, setSearchingZipCode] = useState<boolean>(false)

    const [states, setStates] = useState<SelectOption[]>([])
    const [municipalities, setMunicipalities] = useState<SelectOption[]>([])
    const [colonies, setColonies] = useState<SelectOption[]>([])

    const [currentState, setCurrentState] = useState<string>('')
    const [currentMunicipality, setCurrentMunicipality] = useState<string>('')

    useEffect(() => {
        console.log('LocationSection - Valores iniciales:', {
            address: watch('location.address'),
            city: watch('location.city'),
            state: watch('location.state'),
            zipCode: watch('location.zipCode'),
            colony: watch('location.colony'),
            lat: watch('location.coordinates.lat'),
            lng: watch('location.coordinates.lng'),
            showApproximateLocation: watch('location.showApproximateLocation'),
        })
    }, [watch])

    useEffect(() => {
        const initialState = watch('location.state')
        const initialCity = watch('location.city')
        const initialZipCode = watch('location.zipCode')

        if (initialZipCode && zipCodeSearch === '') {
            setZipCodeSearch(initialZipCode)
        }

        if (initialState && !currentState) {
            setCurrentState(initialState)
        }

        if (initialCity && !currentMunicipality) {
            setCurrentMunicipality(initialCity)
        }
    }, [watch, currentState, currentMunicipality, zipCodeSearch])

    const geocodeAddress = useCallback(async () => {
        if (!address || !city || !state) return null

        const fullAddress = `${address}, ${colony ? colony + ', ' : ''}${city}, ${state}, México`
        setGeocoding(true)

        try {
            const encodedAddress = encodeURIComponent(fullAddress)
            const url = `https://geocode.maps.co/search?q=${encodedAddress}&api_key=${GEO_API_KEY}`
            console.log(`Geocodificando: ${fullAddress}`)

            const response = await fetch(url)
            if (!response.ok)
                throw new Error(
                    `Error al geocodificar: ${response.status} ${response.statusText}`,
                )

            const data: GeocodingResult[] = await response.json()
            if (!data || data.length === 0) {
                console.warn('No se encontraron coordenadas para la dirección')
                setMessage({
                    text: 'No se encontraron coordenadas para esta dirección.',
                    type: 'warning',
                })
                setTimeout(() => setMessage(null), 5000)
                return null
            }

            const { lat, lon } = data[0]
            const coordinates: Coordinates = {
                lat: parseFloat(lat),
                lng: parseFloat(lon),
            }
            console.log(`Coordenadas obtenidas:`, coordinates)

            setValue('location.coordinates.lat', coordinates.lat, {
                shouldValidate: true,
            })
            setValue('location.coordinates.lng', coordinates.lng, {
                shouldValidate: true,
            })

            setMessage({
                text: 'Coordenadas obtenidas correctamente',
                type: 'success',
            })
            setTimeout(() => setMessage(null), 3000)
            return coordinates
        } catch (error) {
            console.error('Error al geocodificar la dirección:', error)
            setMessage({
                text: 'No se pudieron obtener las coordenadas.',
                type: 'error',
            })
            setTimeout(() => setMessage(null), 5000)
            return null
        } finally {
            setGeocoding(false)
        }
    }, [address, city, colony, state, setValue])

    useEffect(() => {
        if (error) {
            setMessage({ text: error, type: 'error' })
            setTimeout(() => setMessage(null), 5000)
        }
    }, [error])

    useEffect(() => {
        const loadStates = async () => {
            try {
                const statesData = await getStates()
                if (Array.isArray(statesData)) {
                    const stateOptions = statesData.map((state) => ({
                        label: state,
                        value: state,
                    }))
                    setStates(stateOptions)
                }
            } catch (err) {
                console.error('Error al cargar estados:', err)
            }
        }
        loadStates()
    }, [getStates])

    useEffect(() => {
        if (currentState) {
            const loadMunicipalities = async () => {
                try {
                    const municipalitiesData =
                        await getMunicipalities(currentState)
                    if (Array.isArray(municipalitiesData)) {
                        const municipalityOptions = municipalitiesData.map(
                            (mun) => ({ label: mun, value: mun }),
                        )
                        setMunicipalities(municipalityOptions)
                    }
                } catch (err) {
                    console.error('Error al cargar municipios:', err)
                }
            }
            loadMunicipalities()
        }
    }, [currentState, getMunicipalities])

    useEffect(() => {
        if (currentState && currentMunicipality) {
            const loadColonies = async () => {
                try {
                    const coloniesData = await getColonies(
                        currentState,
                        currentMunicipality,
                    )
                    if (Array.isArray(coloniesData)) {
                        const colonyOptions = coloniesData.map((colony) => ({
                            label: colony,
                            value: colony,
                        }))
                        setColonies(colonyOptions)
                    }
                } catch (err) {
                    console.error('Error al cargar colonias:', err)
                }
            }
            loadColonies()
        }
    }, [currentMunicipality, currentState, getColonies])

    const searchByZipCode = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!zipCodeSearch || zipCodeSearch.length !== 5) {
            setMessage({
                text: 'Ingrese un código postal válido de 5 dígitos',
                type: 'error',
            })
            setTimeout(() => setMessage(null), 5000)
            return
        }

        setSearchingZipCode(true)
        try {
            const locationData = await getLocationByZipCode(zipCodeSearch)
            if (!locationData) {
                setMessage({
                    text: 'No se encontró información para este código postal',
                    type: 'error',
                })
                setTimeout(() => setMessage(null), 5000)
                return
            }

            setCurrentState(locationData.state)
            const municipalitiesData = await getMunicipalities(
                locationData.state,
            )
            if (Array.isArray(municipalitiesData)) {
                const municipalityOptions = municipalitiesData.map((mun) => ({
                    label: mun,
                    value: mun,
                }))
                setMunicipalities(municipalityOptions)
            }
            setCurrentMunicipality(locationData.municipality)

            const colonyOptions = locationData.colonies.map((colony) => ({
                label: colony,
                value: colony,
            }))
            setColonies(colonyOptions)

            setValue('location.state', locationData.state || '', {
                shouldValidate: true,
            })
            setValue('location.city', locationData.municipality || '', {
                shouldValidate: true,
            })
            setValue('location.zipCode', zipCodeSearch, {
                shouldValidate: true,
            })

            if (locationData.colonies.length === 1) {
                setValue('location.colony', locationData.colonies[0], {
                    shouldValidate: true,
                })
            }

            const lat = getValues('location.coordinates.lat')
            const lng = getValues('location.coordinates.lng')
            if (!lat || !lng) {
                setValue('location.coordinates.lat', 0, {
                    shouldValidate: true,
                })
                setValue('location.coordinates.lng', 0, {
                    shouldValidate: true,
                })
            }

            setMessage({
                text: 'Información cargada correctamente',
                type: 'success',
            })
            setTimeout(() => setMessage(null), 5000)
        } catch (error) {
            console.error('Error al buscar código postal:', error)
            setMessage({
                text: 'No se pudo buscar el código postal.',
                type: 'error',
            })
            setTimeout(() => setMessage(null), 5000)
        } finally {
            setSearchingZipCode(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="p-6 space-y-6">
                <h2 className="text-xl font-semibold">Ubicación</h2>

                {message && (
                    <div
                        className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}
                    >
                        {message.text}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Buscar por Código Postal
                    </label>
                    <div className="flex space-x-2">
                        <Input
                            placeholder="Ej. 01000"
                            value={zipCodeSearch}
                            onChange={(e) => setZipCodeSearch(e.target.value)}
                            maxLength={5}
                            className="w-full"
                        />
                        <Button
                            color="primary"
                            onClick={searchByZipCode}
                            disabled={searchingZipCode || loading}
                            className="min-w-[100px]"
                            type="button"
                        >
                            {searchingZipCode || loading ? (
                                <Spinner size="sm" />
                            ) : (
                                'Buscar'
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                        Buscar un código postal llenará automáticamente estado,
                        ciudad y colonias disponibles.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Estado{' '}
                            {errors?.location?.state && (
                                <span className="text-danger">*</span>
                            )}
                        </label>
                        <Controller
                            name="location.state"
                            control={control}
                            render={({ field }) => (
                                <ClientSelect
                                    isLoading={loading}
                                    placeholder="Seleccione un estado"
                                    options={states}
                                    onChange={(option) => {
                                        const value =
                                            typeof option?.value === 'string'
                                                ? option.value
                                                : ''
                                        field.onChange(value)
                                        setCurrentState(value)
                                        setValue('location.city', '', {
                                            shouldValidate: true,
                                        })
                                        setValue('location.colony', '', {
                                            shouldValidate: true,
                                        })
                                    }}
                                    value={
                                        field.value
                                            ? {
                                                  label: field.value,
                                                  value: field.value,
                                              }
                                            : null
                                    }
                                    instanceId="state-select"
                                />
                            )}
                        />
                        {errors?.location?.state && (
                            <p className="text-xs text-danger mt-1">
                                {errors.location.state.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Ciudad/Municipio{' '}
                            {errors?.location?.city && (
                                <span className="text-danger">*</span>
                            )}
                        </label>
                        <Controller
                            name="location.city"
                            control={control}
                            render={({ field }) => (
                                <ClientSelect
                                    isLoading={loading}
                                    placeholder="Seleccione un municipio"
                                    options={municipalities}
                                    onChange={(option) => {
                                        const value =
                                            typeof option?.value === 'string'
                                                ? option.value
                                                : ''
                                        field.onChange(value)
                                        setCurrentMunicipality(value)
                                        setValue('location.colony', '', {
                                            shouldValidate: true,
                                        })
                                    }}
                                    value={
                                        field.value
                                            ? {
                                                  label: field.value,
                                                  value: field.value,
                                              }
                                            : null
                                    }
                                    isDisabled={!currentState}
                                    instanceId="municipality-select"
                                />
                            )}
                        />
                        {errors?.location?.city && (
                            <p className="text-xs text-danger mt-1">
                                {errors.location.city.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Código Postal{' '}
                            {errors?.location?.zipCode && (
                                <span className="text-danger">*</span>
                            )}
                        </label>
                        <Controller
                            name="location.zipCode"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="Ej. 01000"
                                    maxLength={5}
                                    onChange={(e) => {
                                        field.onChange(e.target.value)
                                        setZipCodeSearch(e.target.value)
                                    }}
                                />
                            )}
                        />
                        {errors?.location?.zipCode && (
                            <p className="text-xs text-danger mt-1">
                                {errors.location.zipCode.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Colonia{' '}
                            {errors?.location?.colony && (
                                <span className="text-danger">*</span>
                            )}
                        </label>
                        <Controller
                            name="location.colony"
                            control={control}
                            render={({ field }) => (
                                <ClientSelect
                                    isLoading={loading}
                                    placeholder="Seleccionar..."
                                    options={colonies}
                                    onChange={(option) => {
                                        const value =
                                            typeof option?.value === 'string'
                                                ? option.value
                                                : ''
                                        field.onChange(value)
                                    }}
                                    value={
                                        field.value
                                            ? {
                                                  label: field.value,
                                                  value: field.value,
                                              }
                                            : null
                                    }
                                    isDisabled={!currentMunicipality}
                                    instanceId="colony-select"
                                />
                            )}
                        />
                        {errors?.location?.colony && (
                            <p className="text-xs text-danger mt-1">
                                {errors.location.colony.message}
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Dirección{' '}
                        {errors?.location?.address && (
                            <span className="text-danger">*</span>
                        )}
                    </label>
                    <div className="flex space-x-2">
                        <div className="flex-grow">
                            <Controller
                                name="location.address"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        placeholder="Calle, número exterior e interior"
                                    />
                                )}
                            />
                        </div>
                        <Button
                            loading={geocoding}
                            variant="solid"
                            color="primary"
                            icon={<PiMapPinFill />}
                            onClick={(e) => {
                                e.preventDefault()
                                geocodeAddress()
                            }}
                            disabled={!address || !city || !state}
                            className="min-w-[105px]"
                        >
                            Geocodificar
                        </Button>
                    </div>
                    {errors?.location?.address && (
                        <p className="text-xs text-danger mt-1">
                            {errors.location.address.message}
                        </p>
                    )}
                    <p className="text-xs text-gray-500 italic">
                        {geocoding
                            ? 'Obteniendo coordenadas...'
                            : 'Haga clic en "Geocodificar" para obtener las coordenadas exactas.'}
                    </p>

                    <div className="flex items-center mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <Controller
                                    name="location.showApproximateLocation"
                                    control={control}
                                    // defaultValue={false} // Asegura un valor por defecto
                                    render={({ field }) => {
                                        // Este useEffect garantiza que el UI siempre refleje el valor actual del formulario
                                        // y no el valor inicial capturado en el closure
                                        React.useEffect(() => {
                                            console.log(
                                                'Estado del control actualizado:',
                                                field.value,
                                            )
                                        }, [field.value])

                                        return (
                                            <Button
                                                variant={
                                                    field.value
                                                        ? 'solid'
                                                        : 'plain'
                                                }
                                                color={
                                                    field.value
                                                        ? 'success'
                                                        : 'gray'
                                                }
                                                size="sm"
                                                icon={
                                                    field.value ? (
                                                        <PiEyeSlash />
                                                    ) : (
                                                        <PiEye />
                                                    )
                                                }
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    const newValue =
                                                        !field.value
                                                    console.log(
                                                        'Cambiando showApproximateLocation a:',
                                                        newValue,
                                                    )
                                                    field.onChange(newValue)
                                                }}
                                                className="min-w-[40px]"
                                                type="button"
                                            >
                                                {field.value
                                                    ? 'Ubicación aproximada'
                                                    : 'Ubicación exacta'}
                                            </Button>
                                        )
                                    }}
                                />
                                <span className="text-xs text-gray-500">
                                    {watch('location.showApproximateLocation')
                                        ? 'Ubicación aproximada. Solo se mostrará la colonia.'
                                        : 'Ubicación exacta. Se mostrará la dirección completa.'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 italic">
                                Active esta opción por motivos de seguridad si
                                no desea revelar la ubicación exacta.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="hidden">
                    <Controller
                        name="location.coordinates.lat"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="hidden"
                                {...field}
                                value={field.value || 0}
                            />
                        )}
                    />
                    <Controller
                        name="location.coordinates.lng"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="hidden"
                                {...field}
                                value={field.value || 0}
                            />
                        )}
                    />
                    <Controller
                        name="location.country"
                        control={control}
                        defaultValue="México"
                        render={({ field }) => (
                            <Input type="hidden" {...field} />
                        )}
                    />
                </div>
            </Card>

            <MapDisplay
                showApproximateLocation={
                    watch('location.showApproximateLocation') || false
                }
            />
        </div>
    )
}

export default LocationSection
