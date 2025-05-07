/**
 * frontend/src/app/(protected-pages)/modules/properties/property-list/_store/propertyListStore.ts
 * Store global para el listado de propiedades.
 * Corregido para un mejor manejo de los datos y depuración.
 * 
 * @version 2.0.0
 * @updated 2025-06-23
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { getProperties } from '@/server/actions/properties/getProperties'
import { deleteProperty } from '@/server/actions/properties/deleteProperty'
import { revalidatePath } from 'next/cache'

interface PropertyListState {
    properties: any[]
    propertyList: any[] // Alias for properties
    total: number
    loading: boolean
    initialLoading: boolean // Initial loading state
    selected: string[]
    selectedProperties: any[] // Selected properties objects
    paginate: {
        pageSize: number
        pageIndex: number
    }
    sort: {
        order: string
        key: string
    }
    filter: Record<string, unknown>
    filterData: Record<string, unknown> // Alias for filter
    search: string
    deleteConfirmation: boolean
    setProperties: (properties: any[]) => void
    setPropertyList: (properties: any[]) => void // Alias for setProperties
    setTotal: (total: number) => void
    setLoading: (loading: boolean) => void
    setSelected: (selected: string[]) => void
    addSelected: (id: string) => void
    removeSelected: (id: string) => void
    setSelectedProperty: (checked: boolean, property: any) => void // Set individual selected property
    setSelectAllProperties: (properties: any[]) => void // Set all selected properties
    setPaginate: (paginate: { pageSize?: number; pageIndex?: number }) => void
    setSort: (sort: { order: string; key: string }) => void
    setFilter: (filter: Record<string, unknown>) => void
    setFilterData: (filter: Record<string, unknown>) => void // Alias for setFilter
    setSearch: (search: string) => void
    getData: (params?: Record<string, any>) => Promise<any>
    deleteData: (id: string) => Promise<any>
    toggleDeleteConfirmation: () => void
}

// Valores iniciales para el store
const initialState = {
    properties: [],
    propertyList: [], // Alias for properties
    total: 0,
    loading: false,
    initialLoading: true, // Start with loading state
    selected: [],
    selectedProperties: [], // Selected properties objects
    paginate: {
        pageSize: 10,
        pageIndex: 0,
    },
    sort: {
        order: '',
        key: '',
    },
    filter: {},
    filterData: {}, // Alias for filter
    search: '',
    deleteConfirmation: false,
}

// Crear store con immer para mutaciones más claras
const usePropertyListStore = create<PropertyListState>()(
    immer((set, get) => ({
        ...initialState,

        // Actualizar propiedades en el store
        setProperties: (properties) => {
            console.log('Actualizando store con propiedades:', properties);
            set((state) => {
                state.properties = properties;
                state.propertyList = properties; // Update alias
                state.initialLoading = false; // Set loading to false once properties are loaded
            });
        },
        
        // Alias para setProperties
        setPropertyList: (properties) => {
            console.log('Actualizando propertyList:', properties);
            set((state) => {
                state.properties = properties;
                state.propertyList = properties;
                state.initialLoading = false;
            });
        },

        // Actualizar total en el store
        setTotal: (total) => {
            set((state) => {
                state.total = total;
            });
        },

        // Actualizar estado de carga
        setLoading: (loading) => {
            set((state) => {
                state.loading = loading;
            });
        },

        // Actualizar seleccionados
        setSelected: (selected) => {
            set((state) => {
                state.selected = selected;
            });
        },

        // Añadir item a seleccionados
        addSelected: (id) => {
            set((state) => {
                if (!state.selected.includes(id)) {
                    state.selected.push(id);
                }
            });
        },

        // Quitar item de seleccionados
        removeSelected: (id) => {
            set((state) => {
                state.selected = state.selected.filter((selectedId) => selectedId !== id);
            });
        },
        
        // Establecer una propiedad seleccionada
        setSelectedProperty: (checked, property) => {
            set((state) => {
                if (checked) {
                    if (!state.selectedProperties.some(p => p.id === property.id)) {
                        state.selectedProperties.push(property);
                        if (!state.selected.includes(property.id)) {
                            state.selected.push(property.id);
                        }
                    }
                } else {
                    state.selectedProperties = state.selectedProperties.filter(
                        p => p.id !== property.id
                    );
                    state.selected = state.selected.filter(id => id !== property.id);
                }
            });
        },
        
        // Establecer todas las propiedades seleccionadas
        setSelectAllProperties: (properties) => {
            set((state) => {
                state.selectedProperties = properties;
                state.selected = properties.map(p => p.id);
            });
        },

        // Actualizar paginación
        setPaginate: (paginate) => {
            set((state) => {
                state.paginate = {
                    ...state.paginate,
                    ...paginate,
                };
            });
        },

        // Actualizar ordenación
        setSort: (sort) => {
            set((state) => {
                state.sort = sort;
            });
        },

        // Actualizar filtros
        setFilter: (filter) => {
            set((state) => {
                state.filter = filter;
                state.filterData = filter; // Update alias
            });
        },
        
        // Alias para setFilter
        setFilterData: (filter) => {
            set((state) => {
                state.filter = filter;
                state.filterData = filter;
            });
        },

        // Actualizar búsqueda
        setSearch: (search) => {
            set((state) => {
                state.search = search;
            });
        },

        // Obtener datos de propiedades del servidor
        getData: async (params = {}) => {
            const { paginate, sort, filter, search } = get();
            set((state) => {
                state.loading = true;
            });

            try {
                // Construir parámetros para la consulta
                const queryParams = {
                    page: paginate.pageIndex + 1,
                    limit: paginate.pageSize,
                    ...params,
                    ...(sort.order && sort.key
                        ? {
                              sort: {
                                  order: sort.order,
                                  key: sort.key,
                              },
                          }
                        : {}),
                    ...(Object.keys(filter).length > 0 ? { filter } : {}),
                    ...(search ? { search } : {}),
                };

                console.log('Obteniendo propiedades con parámetros:', queryParams);

                // Llamar al server action para obtener datos
                const result = await getProperties(queryParams);
                
                console.log('Resultado de getProperties:', result);

                // Verificar si hay resultados válidos
                if (!result || (!result.list && !result.properties)) {
                    console.warn('No se recibieron datos válidos de getProperties');
                    // En caso de error, al menos vaciamos la lista pero mantenemos la interfaz funcionando
                    set((state) => {
                        state.properties = [];
                        state.propertyList = [];
                        state.total = 0;
                        state.loading = false;
                        state.initialLoading = false;
                    });
                    return { list: [], total: 0 };
                }

                // Actualizar el store con los datos obtenidos
                set((state) => {
                    state.properties = result.list || result.properties || [];
                    state.propertyList = result.list || result.properties || [];
                    state.total = result.total || 0;
                    state.loading = false;
                    state.initialLoading = false;
                });

                return result;
            } catch (error) {
                console.error('Error al obtener propiedades:', error);
                set((state) => {
                    state.loading = false;
                    state.initialLoading = false;
                });
                throw error;
            }
        },

        // Eliminar una propiedad
        deleteData: async (id) => {
            try {
                set((state) => {
                    state.loading = true;
                });
                
                console.log(`PropertyListStore: Eliminando propiedad con ID ${id}`);

                // Llamar al server action para eliminar
                const result = await deleteProperty(id);
                
                console.log(`Resultado de eliminación:`, result);

                if (result && result.success) {
                    // Actualizar la lista local automáticamente para reflejar la eliminación
                    const currentProperties = get().properties;
                    
                    // Filtrar la propiedad eliminada
                    const updatedProperties = currentProperties.filter(
                        (property) => property.id !== id
                    );
                    
                    // Actualizar el store directamente
                    set((state) => {
                        state.properties = updatedProperties;
                        state.propertyList = updatedProperties;
                        // Ajustar el total si aplica
                        if (state.total > 0) {
                            state.total = state.total - 1;
                        }
                        // Limpiar seleccionados si el item eliminado estaba seleccionado
                        state.selected = state.selected.filter((selectedId) => selectedId !== id);
                        state.selectedProperties = state.selectedProperties.filter(
                            (prop) => prop.id !== id
                        );
                    });
                    
                    console.log(`Propiedad ${id} eliminada y store actualizado correctamente`);
                } else {
                    // Si hubo un error en la eliminación, intentar recargar los datos
                    console.warn(`Error al eliminar propiedad ${id}:`, result?.error);
                    // Recargar los datos para asegurar la sincronización
                    await get().getData();
                }

                set((state) => {
                    state.loading = false;
                    state.deleteConfirmation = false;
                });

                return result;
            } catch (error) {
                console.error('Error al eliminar propiedad:', error);
                
                // Intentar recargar los datos para estar sincronizados
                try {
                    await get().getData();
                } catch (reloadError) {
                    console.error('Error adicional al intentar recargar datos:', reloadError);
                }
                
                set((state) => {
                    state.loading = false;
                    state.deleteConfirmation = false;
                });
                
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                };
            }
        },

        // Alternar diálogo de confirmación de eliminación
        toggleDeleteConfirmation: () => {
            set((state) => {
                state.deleteConfirmation = !state.deleteConfirmation;
            });
        },
    })),
);

export default usePropertyListStore;