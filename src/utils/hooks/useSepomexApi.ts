/**
 * frontend/src/utils/hooks/useSepomexApi.ts
 * Hook personalizado para realizar llamadas a la API de Sepomex
 * Maneja peticiones, caché y errores para datos de ubicación en México
 * @version 1.1.0
 * @updated 2025-04-04
 */

import { useState, useCallback } from 'react'

// URL base de la API de Sepomex
const API_BASE_URL = 'https://sepomex.icalialabs.com/api/v1'

// Interfaces para tipos de respuesta
interface StateResponse {
    states: string[]
    meta: {
        pagination: {
            per_page: number
            total_pages: number
            total_objects: number
        }
    }
}

interface MunicipalityResponse {
    municipalities: string[]
    meta: {
        pagination: {
            per_page: number
            total_pages: number
            total_objects: number
        }
    }
}

interface ZipCodeResponse {
    zip_codes: Array<{
        id: number
        d_codigo: string
        d_asenta: string
        d_tipo_asenta: string
        d_mnpio: string
        d_estado: string
        d_ciudad: string
        d_cp: string
        c_estado: string
        c_oficina: string
        c_cp: string
        c_tipo_asenta: string
        c_mnpio: string
        id_asenta_cpcons: string
        d_zona: string
        c_cve_ciudad: string
    }>
    meta: {
        pagination: {
            per_page: number
            total_pages: number
            total_objects: number
            links: {
                first: string
                last: string
                next: string | null
                prev: string | null
            }
        }
    }
}

// Sistema de caché para evitar peticiones repetidas
const cache: {
    states?: string[]
    municipalities: Record<string, string[]>
    colonies: Record<string, string[]>
    zipCodes: Record<string, ZipCodeResponse>
} = {
    municipalities: {},
    colonies: {},
    zipCodes: {},
}

export const useSepomexApi = () => {
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    /**
     * Obtiene la lista de estados de México
     */
    const getStates = useCallback(async (): Promise<string[]> => {
        // Si ya tenemos los estados en caché, los devolvemos
        if (cache.states && Array.isArray(cache.states) && cache.states.length > 0) {
            return cache.states
        }

        setLoading(true)
        setError(null)

        try {
            // La API de Sepomex requiere la ruta completa para states
            const response = await fetch(`${API_BASE_URL}/states`)

            if (!response.ok) {
                throw new Error(
                    `Error: ${response.status} - ${response.statusText}`
                )
            }

            const data: StateResponse = await response.json()

            // Verificamos que tengamos datos válidos
            if (!data || !data.states || !Array.isArray(data.states)) {
                throw new Error('Formato de respuesta inválido para estados')
            }

            // Guardamos en caché
            cache.states = data.states

            return data.states
        } catch (err) {
            const errorMsg =
                err instanceof Error
                    ? err.message
                    : 'Error desconocido al obtener estados'
            setError(errorMsg)
            console.error('Error al obtener estados:', err)
            return []
        } finally {
            setLoading(false)
        }
    }, [])

    /**
     * Obtiene la lista de municipios para un estado
     * @param state Nombre del estado
     */
    const getMunicipalities = useCallback(
        async (state: string): Promise<string[]> => {
            if (!state) return []

            // Verificamos si ya tenemos los municipios en caché
            const cacheKey = state.toLowerCase()
            if (cache.municipalities[cacheKey] && Array.isArray(cache.municipalities[cacheKey])) {
                return cache.municipalities[cacheKey]
            }

            setLoading(true)
            setError(null)

            try {
                const encodedState = encodeURIComponent(state)
                const response = await fetch(
                    `${API_BASE_URL}/municipalities?state=${encodedState}`
                )

                if (!response.ok) {
                    throw new Error(
                        `Error: ${response.status} - ${response.statusText}`
                    )
                }

                const data: MunicipalityResponse = await response.json()

                // Verificamos que tengamos datos válidos
                if (!data || !data.municipalities || !Array.isArray(data.municipalities)) {
                    throw new Error('Formato de respuesta inválido para municipios')
                }

                // Guardamos en caché
                cache.municipalities[cacheKey] = data.municipalities

                return data.municipalities
            } catch (err) {
                const errorMsg =
                    err instanceof Error
                        ? err.message
                        : 'Error desconocido al obtener municipios'
                setError(errorMsg)
                console.error('Error al obtener municipios:', err)
                return []
            } finally {
                setLoading(false)
            }
        },
        []
    )

    /**
     * Obtiene la lista de colonias para un estado y municipio
     * @param state Nombre del estado
     * @param municipality Nombre del municipio
     */
    const getColonies = useCallback(
        async (state: string, municipality: string): Promise<string[]> => {
            if (!state || !municipality) return []

            // Verificamos si ya tenemos las colonias en caché
            const cacheKey = `${state.toLowerCase()}_${municipality.toLowerCase()}`
            if (cache.colonies[cacheKey] && Array.isArray(cache.colonies[cacheKey])) {
                return cache.colonies[cacheKey]
            }

            setLoading(true)
            setError(null)

            try {
                const encodedState = encodeURIComponent(state)
                const encodedMunicipality = encodeURIComponent(municipality)

                // Para obtener colonias, filtramos zip_codes por estado y municipio
                const response = await fetch(
                    `${API_BASE_URL}/zip_codes?state=${encodedState}&municipality=${encodedMunicipality}`
                )

                if (!response.ok) {
                    throw new Error(
                        `Error: ${response.status} - ${response.statusText}`
                    )
                }

                const data: ZipCodeResponse = await response.json()

                // Verificamos que tengamos datos válidos
                if (!data || !data.zip_codes || !Array.isArray(data.zip_codes)) {
                    throw new Error('Formato de respuesta inválido para colonias')
                }

                // Extraer colonias únicas (d_asenta es el nombre de la colonia)
                try {
                    const uniqueColonies = Array.from(
                        new Set(data.zip_codes.map((item) => {
                            if (typeof item.d_asenta !== 'string') {
                                console.warn("Valor de colonia inválido:", item.d_asenta)
                                return "Desconocido"
                            }
                            return item.d_asenta.trim()
                        }))
                    ).sort()

                    // Guardamos en caché
                    cache.colonies[cacheKey] = uniqueColonies

                    return uniqueColonies
                } catch (mapError) {
                    console.error('Error al procesar colonias:', mapError)
                    throw new Error('Error al procesar datos de colonias')
                }
            } catch (err) {
                const errorMsg =
                    err instanceof Error
                        ? err.message
                        : 'Error desconocido al obtener colonias'
                setError(errorMsg)
                console.error('Error al obtener colonias:', err)
                return []
            } finally {
                setLoading(false)
            }
        },
        []
    )

    /**
     * Busca información de ubicación por código postal
     * @param zipCode Código postal a buscar
     */
    const getLocationByZipCode = useCallback(
        async (
            zipCode: string
        ): Promise<{
            state?: string
            municipality?: string
            colonies: string[]
            zipCode: string
        } | null> => {
            if (!zipCode || zipCode.length !== 5) {
                setError('El código postal debe tener 5 dígitos')
                return null
            }

            // Verificamos si ya tenemos la información en caché
            if (cache.zipCodes[zipCode] && cache.zipCodes[zipCode].zip_codes && Array.isArray(cache.zipCodes[zipCode].zip_codes)) {
                const data = cache.zipCodes[zipCode]
                if (data.zip_codes.length === 0) return null

                const firstResult = data.zip_codes[0]
                const state = firstResult.d_estado ? firstResult.d_estado.trim() : '';
                const municipality = firstResult.d_mnpio ? firstResult.d_mnpio.trim() : '';

                // Extraer colonias únicas
                try {
                    const colonies = Array.from(
                        new Set(
                            data.zip_codes.map((item) => {
                                if (typeof item.d_asenta !== 'string') {
                                    return "Desconocido";
                                }
                                return item.d_asenta.trim();
                            })
                        )
                    ).sort();

                    return {
                        state,
                        municipality,
                        colonies,
                        zipCode,
                    }
                } catch (mapError) {
                    console.error('Error al procesar colonias de caché:', mapError)
                    throw new Error('Error al procesar datos de colonias en caché')
                }
            }

            setLoading(true)
            setError(null)

            try {
                console.log(`Buscando código postal: ${zipCode}`)
                
                // Para buscar por código postal usamos d_codigo (que es el campo de CP)
                const response = await fetch(
                    `${API_BASE_URL}/zip_codes?zip_code=${zipCode}`
                )

                if (!response.ok) {
                    throw new Error(
                        `Error: ${response.status} - ${response.statusText}`
                    )
                }

                const data: ZipCodeResponse = await response.json()

                // Verificamos que tengamos datos válidos
                if (!data || !data.zip_codes || !Array.isArray(data.zip_codes)) {
                    throw new Error('Formato de respuesta inválido para código postal')
                }

                console.log(`Respuesta para CP ${zipCode}:`, data)

                // Guardamos en caché
                cache.zipCodes[zipCode] = data

                if (data.zip_codes.length === 0) return null

                const firstResult = data.zip_codes[0]
                const state = firstResult.d_estado ? firstResult.d_estado.trim() : '';
                const municipality = firstResult.d_mnpio ? firstResult.d_mnpio.trim() : '';

                // Extraer colonias únicas con validación
                try {
                    const colonies = Array.from(
                        new Set(
                            data.zip_codes.map((item) => {
                                if (typeof item.d_asenta !== 'string') {
                                    return "Desconocido";
                                }
                                return item.d_asenta.trim();
                            })
                        )
                    ).sort();

                    // Si hay muchas páginas de resultados, hacer consultas adicionales
                    const paginationInfo = data?.meta?.pagination;
                    if (paginationInfo && 
                        paginationInfo.total_pages > 1 && 
                        paginationInfo.links && 
                        paginationInfo.links.next) {
                        
                        console.log(`Código postal ${zipCode} tiene ${paginationInfo.total_pages} páginas. Obteniendo datos adicionales...`);
                        
                        // Máximo de páginas a consultar para evitar problemas
                        const maxPages = 5;
                        let currentPage = 2;
                        let allColonies = [...colonies];
                        
                        while (currentPage <= Math.min(paginationInfo.total_pages, maxPages)) {
                            try {
                                const nextResponse = await fetch(
                                    `${API_BASE_URL}/zip_codes?zip_code=${zipCode}&page=${currentPage}`
                                );
                                
                                if (nextResponse.ok) {
                                    const nextPageData: ZipCodeResponse = await nextResponse.json();
                                    
                                    if (nextPageData && nextPageData.zip_codes && Array.isArray(nextPageData.zip_codes)) {
                                        const nextPageColonies = Array.from(
                                            new Set(
                                                nextPageData.zip_codes.map(item => {
                                                    if (typeof item.d_asenta !== 'string') {
                                                        return "Desconocido";
                                                    }
                                                    return item.d_asenta.trim();
                                                })
                                            )
                                        );
                                        
                                        // Añadir las nuevas colonias al conjunto total
                                        allColonies = [...allColonies, ...nextPageColonies];
                                    }
                                }
                            } catch (pageError) {
                                console.error(`Error al obtener página ${currentPage} para CP ${zipCode}:`, pageError);
                                // Continuamos con las siguientes páginas incluso si hay error
                            }
                            
                            currentPage++;
                        }
                        
                        // Eliminar duplicados y ordenar
                        const uniqueAllColonies = Array.from(new Set(allColonies)).sort();
                        console.log(`Total de colonias obtenidas para CP ${zipCode}: ${uniqueAllColonies.length}`);
                        
                        return {
                            state,
                            municipality,
                            colonies: uniqueAllColonies,
                            zipCode,
                        };
                    }

                    return {
                        state,
                        municipality,
                        colonies,
                        zipCode,
                    }
                } catch (mapError) {
                    console.error('Error al procesar colonias:', mapError)
                    throw new Error('Error al procesar datos de colonias')
                }
            } catch (err) {
                const errorMsg =
                    err instanceof Error
                        ? err.message
                        : 'Error desconocido al buscar código postal'
                setError(errorMsg)
                console.error('Error al buscar código postal:', err)
                return null
            } finally {
                setLoading(false)
            }
        },
        []
    )

    return {
        loading,
        error,
        getStates,
        getMunicipalities,
        getColonies,
        getLocationByZipCode,
    }
}

export default useSepomexApi