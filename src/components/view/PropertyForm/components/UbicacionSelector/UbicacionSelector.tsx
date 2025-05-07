/**
 * frontend/src/components/view/PropertyForm/components/UbicacionSelector/UbicacionSelector.tsx
 * Componente para selección jerárquica de ubicaciones en México:
 * estado → municipio → colonia → código postal
 * Modificado para usar API Sepomex en lugar de archivo XML local
 *
 * @version 3.0.0
 * @updated 2025-06-26
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import Input from '@/components/ui/Input'
import SafeSelect from '@/components/shared/SafeSelect'
import { FormItem } from '@/components/ui/Form'
import Spinner from '@/components/ui/Spinner'
import { TbSearch, TbMapPin } from 'react-icons/tb'
import useSepomexApi from '@/utils/hooks/useSepomexApi'
import debounce from 'lodash/debounce'
import Card from '@/components/ui/Card'

// Opciones por defecto para los select
const emptyOption = { value: '', label: 'Seleccionar...' }

// Tipos para las opciones de los select
type SelectOption = {
    value: string
    label: string
}

interface UbicacionSelectorProps {
    namePrefix?: string
    required?: boolean
}

const UbicacionSelector = ({
    namePrefix = 'location',
    required = true,
}: UbicacionSelectorProps) => {
    // Usar contexto de formulario de forma segura
    const methods = useFormContext()
    const control = methods?.control
    const formState = methods?.formState || {}
    const setValue = methods?.setValue
    const getValues = methods?.getValues
    const trigger = methods?.trigger
    const errors = formState.errors || {}

    // Usar el hook de Sepomex API
    const {
        loading: apiLoading,
        error: apiError,
        getStates,
        getMunicipalities,
        getColonies,
        getLocationByZipCode,
    } = useSepomexApi()

    // Estado local para las opciones y estados de carga
    const [estados, setEstados] = useState<SelectOption[]>([])
    const [municipios, setMunicipios] = useState<SelectOption[]>([])
    const [colonias, setColonias] = useState<SelectOption[]>([])

    const [loadingEstados, setLoadingEstados] = useState(false)
    const [loadingMunicipios, setLoadingMunicipios] = useState(false)
    const [loadingColonias, setLoadingColonias] = useState(false)
    const [loadingCP, setLoadingCP] = useState(false)

    const [busquedaCP, setBusquedaCP] = useState('')
    const [errorCP, setErrorCP] = useState('')

    // Propiedades fallback por si el contexto no está disponible
    const [fallbackState, setFallbackState] = useState('')
    const [fallbackCity, setFallbackCity] = useState('')
    const [fallbackZipCode, setFallbackZipCode] = useState('')
    const [fallbackColony, setFallbackColony] = useState('')
    const [fallbackAddress, setFallbackAddress] = useState('')

    // Si el componente se está renderizando del lado del servidor, mostrar un marcador de posición
    // para evitar errores de hydration
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Si hay métodos del formulario, utilizar sus valores como inicio para los fallbacks
    useEffect(() => {
        if (methods?.getValues) {
            setFallbackState(methods.getValues(`${namePrefix}.state`) || '')
            setFallbackCity(methods.getValues(`${namePrefix}.city`) || '')
            setFallbackZipCode(methods.getValues(`${namePrefix}.zipCode`) || '')
            setFallbackColony(methods.getValues(`${namePrefix}.colony`) || '')
            setFallbackAddress(methods.getValues(`${namePrefix}.address`) || '')
        }
    }, [methods, namePrefix])

    if (!isMounted) {
        return (
            <Card>
                <h5 className="mb-4">Ubicación</h5>
                <div className="h-64 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
            </Card>
        )
    }

    // Si no tenemos contexto de formulario, crear una versión simplificada del formulario
    if (!methods) {
        console.warn(
            'UbicacionSelector: No FormContext found, using fallback UI',
        )

        return (
            <Card>
                <h5 className="mb-4">Ubicación</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem label="Estado" required={required}>
                        <Input
                            value={fallbackState}
                            onChange={(e) => setFallbackState(e.target.value)}
                            placeholder="Estado"
                        />
                    </FormItem>

                    <FormItem label="Ciudad/Municipio" required={required}>
                        <Input
                            value={fallbackCity}
                            onChange={(e) => setFallbackCity(e.target.value)}
                            placeholder="Ciudad/Municipio"
                        />
                    </FormItem>

                    <FormItem label="Código Postal">
                        <Input
                            value={fallbackZipCode}
                            onChange={(e) => setFallbackZipCode(e.target.value)}
                            placeholder="Código Postal"
                        />
                    </FormItem>

                    <FormItem label="Colonia">
                        <Input
                            value={fallbackColony}
                            onChange={(e) => setFallbackColony(e.target.value)}
                            placeholder="Colonia"
                        />
                    </FormItem>

                    <div className="md:col-span-2">
                        <FormItem label="Dirección" required={required}>
                            <Input
                                value={fallbackAddress}
                                onChange={(e) =>
                                    setFallbackAddress(e.target.value)
                                }
                                placeholder="Dirección"
                            />
                        </FormItem>
                    </div>
                </div>
            </Card>
        )
    }

    // Valores observados (evitamos useWatch si no hay control)
    const [watchedState, setWatchedState] = useState('')
    const [watchedCity, setWatchedCity] = useState('')

    // Actualizar valores observados cuando cambian en el formulario
    useEffect(() => {
        if (getValues) {
            const formState = getValues(`${namePrefix}.state`)
            const formCity = getValues(`${namePrefix}.city`)

            if (formState && formState !== watchedState) {
                setWatchedState(formState)
            }

            if (formCity && formCity !== watchedCity) {
                setWatchedCity(formCity)
            }
        }
    }, [getValues, namePrefix, watchedState, watchedCity])

    // Función para cargar estados
    const cargarEstados = useCallback(async () => {
        try {
            setLoadingEstados(true)
            const estadosData = await getStates()

            const estadosOptions = estadosData.map((estadoNombre: string) => ({
                value: estadoNombre,
                label: estadoNombre,
            }))

            setEstados([emptyOption, ...estadosOptions])
        } catch (error) {
            console.error('Error al cargar estados:', error)
        } finally {
            setLoadingEstados(false)
        }
    }, [getStates])

    // Función para cargar municipios según el estado seleccionado
    const cargarMunicipios = useCallback(
        async (estadoNombre: string) => {
            if (!estadoNombre) {
                setMunicipios([emptyOption])
                return
            }

            try {
                setLoadingMunicipios(true)
                const municipiosData = await getMunicipalities(estadoNombre)

                const municipiosOptions = municipiosData.map(
                    (municipioNombre: string) => ({
                        value: municipioNombre,
                        label: municipioNombre,
                    }),
                )

                setMunicipios([emptyOption, ...municipiosOptions])
            } catch (error) {
                console.error('Error al cargar municipios:', error)
            } finally {
                setLoadingMunicipios(false)
            }
        },
        [getMunicipalities],
    )

    // Función para cargar colonias según el estado y municipio
    const cargarColonias = useCallback(
        async (estadoNombre: string, municipioNombre: string) => {
            if (!estadoNombre || !municipioNombre) {
                setColonias([emptyOption])
                return
            }

            try {
                setLoadingColonias(true)
                const coloniasData = await getColonies(
                    estadoNombre,
                    municipioNombre,
                )

                const coloniasOptions = coloniasData.map(
                    (coloniaNombre: string) => ({
                        value: coloniaNombre,
                        label: coloniaNombre,
                    }),
                )

                setColonias([emptyOption, ...coloniasOptions])
            } catch (error) {
                console.error('Error al cargar colonias:', error)
            } finally {
                setLoadingColonias(false)
            }
        },
        [getColonies],
    )

    // Función para cargar colonias según el código postal
    const cargarColoniasPorCP = useCallback(
        async (cp: string) => {
            if (!cp || cp.length !== 5) {
                return
            }

            try {
                setLoadingColonias(true)
                const locationInfo = await getLocationByZipCode(cp)

                if (!locationInfo) {
                    setColonias([emptyOption])
                    return
                }

                const coloniasOptions = locationInfo.colonies.map(
                    (coloniaNombre: string) => ({
                        value: coloniaNombre,
                        label: coloniaNombre,
                    }),
                )

                setColonias([emptyOption, ...coloniasOptions])
            } catch (error) {
                console.error('Error al cargar colonias por CP:', error)
            } finally {
                setLoadingColonias(false)
            }
        },
        [getLocationByZipCode],
    )

    // Función para buscar por código postal
    const buscarPorCP = useCallback(
        async (cp: string) => {
            setErrorCP('')

            if (!cp || cp.length !== 5 || !/^\d{5}$/.test(cp)) {
                setErrorCP('El código postal debe tener 5 dígitos')
                return
            }

            if (!setValue || !trigger) {
                console.error('UbicacionSelector: Missing form methods')
                setErrorCP('Error interno del formulario')
                return
            }

            try {
                setLoadingCP(true)
                const locationInfo = await getLocationByZipCode(cp)

                if (!locationInfo) {
                    setErrorCP('Código postal no encontrado')
                    return
                }

                // Actualizar los valores del formulario con la información del CP
                setValue(`${namePrefix}.state`, locationInfo.state || '')
                setValue(`${namePrefix}.city`, locationInfo.municipality || '')
                setValue(`${namePrefix}.zipCode`, locationInfo.zipCode || '')
                setValue(`${namePrefix}.colony`, '') // Limpiar colonia para evitar inconsistencias

                // Actualizar estado local para que el UI refleje los cambios
                setWatchedState(locationInfo.state || '')
                setWatchedCity(locationInfo.municipality || '')

                // Esperar un momento para que los valores de estado y ciudad se actualicen
                setTimeout(async () => {
                    // Cargar las colonias para este CP
                    await cargarColoniasPorCP(cp)

                    // Validar campos
                    trigger([
                        `${namePrefix}.state`,
                        `${namePrefix}.city`,
                        `${namePrefix}.zipCode`,
                        `${namePrefix}.colony`,
                    ])
                }, 100)
            } catch (error) {
                console.error('Error al buscar por código postal:', error)
                setErrorCP('Error al buscar el código postal')
            } finally {
                setLoadingCP(false)
            }
        },
        [
            setValue,
            trigger,
            getLocationByZipCode,
            cargarColoniasPorCP,
            namePrefix,
        ],
    )

    // Debounce para la búsqueda por CP
    const debouncedBuscarPorCP = useCallback(
        debounce((cp: string) => {
            buscarPorCP(cp)
        }, 500),
        [buscarPorCP],
    )

    // Cargar estados al montar el componente
    useEffect(() => {
        cargarEstados()
    }, [cargarEstados])

    // Cargar municipios cuando cambia el estado seleccionado
    useEffect(() => {
        if (watchedState) {
            cargarMunicipios(watchedState)
        } else {
            setMunicipios([emptyOption])
        }
    }, [watchedState, cargarMunicipios])

    // Cargar colonias cuando cambian estado y municipio
    useEffect(() => {
        if (watchedState && watchedCity) {
            cargarColonias(watchedState, watchedCity)
        } else {
            setColonias([emptyOption])
        }
    }, [watchedState, watchedCity, cargarColonias])

    // Inicialización: cargar datos a partir de valores existentes
    useEffect(() => {
        if (methods && getValues) {
            const initialState = getValues(`${namePrefix}.state`)
            const initialCity = getValues(`${namePrefix}.city`)
            const initialZipCode = getValues(`${namePrefix}.zipCode`)

            // Solo establecer si tenemos valores iniciales
            if (initialState) {
                setWatchedState(initialState)
            }

            if (initialCity) {
                setWatchedCity(initialCity)
            }

            if (initialZipCode && initialZipCode.length === 5) {
                setBusquedaCP(initialZipCode)

                // Cargar colonias basadas en el CP inicial
                setTimeout(() => {
                    // Si tenemos estado y ciudad, usamos esos datos para filtrar colonias
                    if (initialState && initialCity) {
                        cargarColonias(initialState, initialCity)
                    } else {
                        // Si no tenemos estado y ciudad, usamos el CP para obtener todos los datos
                        cargarColoniasPorCP(initialZipCode)
                    }
                }, 300)
            }
        }
    }, [getValues, namePrefix, cargarColonias, cargarColoniasPorCP])

    // Actualizar búsqueda por CP cuando se escribe
    const handleCPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cp = e.target.value.trim()
        setBusquedaCP(cp)

        if (cp.length === 5) {
            debouncedBuscarPorCP(cp)
        } else {
            setErrorCP('')
        }
    }

    // Ejecutar búsqueda al hacer clic en el botón
    const handleBuscarCP = () => {
        buscarPorCP(busquedaCP)
    }

    // Manejar cambio de colonia
    const handleColoniaChange = (colonia: string) => {
        // Solo actualizar la dirección si está vacía o era igual a la colonia anterior
        if (!getValues) return

        const currentAddress = getValues(`${namePrefix}.address`) || ''
        const currentColonia = getValues(`${namePrefix}.colony`) || ''

        if (
            setValue &&
            (currentAddress === '' || currentAddress === currentColonia)
        ) {
            setValue(`${namePrefix}.address`, colonia)
        }
    }

    return (
        <Card>
            <h5 className="mb-4">Ubicación</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Búsqueda por Código Postal */}
                <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">
                                Buscar por Código Postal
                            </label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={busquedaCP}
                                    onChange={handleCPChange}
                                    placeholder="Ingrese código postal (5 dígitos)"
                                    suffix={
                                        loadingCP || apiLoading ? (
                                            <Spinner size={20} />
                                        ) : undefined
                                    }
                                    className="w-full"
                                    invalid={!!errorCP}
                                />
                                <button
                                    type="button"
                                    className="bg-primary text-white p-2 rounded-md hover:bg-primary-600"
                                    onClick={handleBuscarCP}
                                    disabled={loadingCP || apiLoading}
                                >
                                    <TbSearch size={20} />
                                </button>
                            </div>
                            {errorCP && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errorCP}
                                </p>
                            )}
                            {apiError && (
                                <p className="text-xs text-red-500 mt-1">
                                    {apiError}
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                Buscar un código postal llenará automáticamente
                                estado, ciudad y colonias disponibles.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Estado */}
                <FormItem
                    label="Estado"
                    invalid={!!errors[namePrefix]?.state}
                    errorMessage={errors[namePrefix]?.state?.message as string}
                    required={required}
                >
                    <Controller
                        name={`${namePrefix}.state`}
                        control={control}
                        rules={{
                            required: required
                                ? 'El estado es requerido'
                                : false,
                        }}
                        render={({ field }) => (
                            <SafeSelect
                                options={estados}
                                isLoading={loadingEstados || apiLoading}
                                placeholder="Seleccione un estado"
                                value={
                                    estados.find(
                                        (option) =>
                                            option.label === field.value,
                                    ) || null
                                }
                                onChange={(option) => {
                                    // Usar el label del option seleccionado como valor de campo
                                    const newValue = option ? option.label : ''
                                    field.onChange(newValue)
                                    setWatchedState(newValue)

                                    // Reiniciar valores dependientes si setValue está disponible
                                    if (setValue) {
                                        setValue(`${namePrefix}.city`, '')
                                        setValue(`${namePrefix}.colony`, '')
                                        setValue(`${namePrefix}.address`, '')
                                        setWatchedCity('')
                                    }
                                }}
                                invalid={!!errors[namePrefix]?.state}
                                isDisabled={loadingEstados || apiLoading}
                            />
                        )}
                    />
                </FormItem>

                {/* Municipio/Ciudad */}
                <FormItem
                    label="Ciudad/Municipio"
                    invalid={!!errors[namePrefix]?.city}
                    errorMessage={errors[namePrefix]?.city?.message as string}
                    required={required}
                >
                    <Controller
                        name={`${namePrefix}.city`}
                        control={control}
                        rules={{
                            required: required
                                ? 'La ciudad es requerida'
                                : false,
                        }}
                        render={({ field }) => (
                            <SafeSelect
                                options={municipios}
                                isLoading={loadingMunicipios || apiLoading}
                                placeholder="Seleccione un municipio"
                                value={
                                    municipios.find(
                                        (option) =>
                                            option.label === field.value,
                                    ) || null
                                }
                                onChange={(option) => {
                                    // Usar el label del option seleccionado como valor de campo
                                    const newValue = option ? option.label : ''
                                    field.onChange(newValue)
                                    setWatchedCity(newValue)

                                    // Limpiar campos que dependen de ciudad
                                    if (setValue) {
                                        setValue(`${namePrefix}.colony`, '')
                                    }
                                }}
                                isDisabled={
                                    !watchedState ||
                                    loadingMunicipios ||
                                    apiLoading
                                }
                                invalid={!!errors[namePrefix]?.city}
                            />
                        )}
                    />
                </FormItem>

                {/* Código Postal */}
                <FormItem
                    label="Código Postal"
                    invalid={!!errors[namePrefix]?.zipCode}
                    errorMessage={
                        errors[namePrefix]?.zipCode?.message as string
                    }
                >
                    <Controller
                        name={`${namePrefix}.zipCode`}
                        control={control}
                        rules={{
                            pattern: {
                                value: /^\d{5}$/,
                                message:
                                    'El código postal debe tener 5 dígitos',
                            },
                        }}
                        render={({ field }) => (
                            <Input
                                {...field}
                                placeholder="00000"
                                onChange={(e) => {
                                    field.onChange(e)
                                    setBusquedaCP(e.target.value)

                                    // Cargar colonias si se completa el CP
                                    if (e.target.value.length === 5) {
                                        if (watchedState && watchedCity) {
                                            cargarColonias(
                                                watchedState,
                                                watchedCity,
                                            )
                                        } else {
                                            cargarColoniasPorCP(e.target.value)
                                        }
                                    }
                                }}
                                suffix={
                                    loadingCP || apiLoading ? (
                                        <Spinner size={20} />
                                    ) : (
                                        <TbMapPin />
                                    )
                                }
                                invalid={!!errors[namePrefix]?.zipCode}
                            />
                        )}
                    />
                </FormItem>

                {/* Colonia */}
                <FormItem
                    label="Colonia"
                    invalid={!!errors[namePrefix]?.colony}
                    errorMessage={errors[namePrefix]?.colony?.message as string}
                >
                    <Controller
                        name={`${namePrefix}.colony`}
                        control={control}
                        render={({ field }) => (
                            <SafeSelect
                                options={colonias}
                                isLoading={loadingColonias || apiLoading}
                                placeholder="Seleccione una colonia"
                                value={
                                    colonias.find(
                                        (option) =>
                                            option.value === field.value ||
                                            option.label === field.value,
                                    ) || null
                                }
                                onChange={(option) => {
                                    // Usar el value del option seleccionado como valor de campo
                                    const newValue = option ? option.value : ''
                                    field.onChange(newValue)

                                    // Actualizar dirección si está vacía o era igual a la colonia anterior
                                    if (newValue) {
                                        handleColoniaChange(newValue)
                                    }
                                }}
                                isDisabled={
                                    colonias.length <= 1 ||
                                    loadingColonias ||
                                    apiLoading
                                }
                                invalid={!!errors[namePrefix]?.colony}
                            />
                        )}
                    />
                </FormItem>

                {/* Dirección (calle y número) */}
                <div className="md:col-span-2">
                    <FormItem
                        label="Dirección"
                        invalid={!!errors[namePrefix]?.address}
                        errorMessage={
                            errors[namePrefix]?.address?.message as string
                        }
                        required={required}
                    >
                        <Controller
                            name={`${namePrefix}.address`}
                            control={control}
                            rules={{
                                required: required
                                    ? 'La dirección es requerida'
                                    : false,
                            }}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="Calle, número, interior"
                                    invalid={!!errors[namePrefix]?.address}
                                />
                            )}
                        />
                    </FormItem>
                </div>

                {/* País (oculto, siempre México) */}
                <Controller
                    name={`${namePrefix}.country`}
                    control={control}
                    defaultValue="México"
                    render={({ field }) => <input type="hidden" {...field} />}
                />
            </div>
        </Card>
    )
}

export default UbicacionSelector
