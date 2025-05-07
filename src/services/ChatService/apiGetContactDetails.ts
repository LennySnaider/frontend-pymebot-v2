/**
 * frontend/src/services/ChatService/apiGetContactDetails.ts
 * Servicio para obtener detalles de contactos
 * @version 1.0.0
 * @updated 2025-04-16
 */

/**
 * Obtiene los detalles de un contacto
 */
const apiGetContactDetails = async <T>(id: string): Promise<T> => {
    // En implementación real, aquí se haría una llamada a la API
    // return await http.get(`/api/chat/contact/${id}`)
    
    // Simulación
    return Promise.resolve({
        userDetails: {
            id,
            name: 'Usuario Demo',
            email: 'usuario@demo.com',
            img: '/img/avatars/thumb-1.jpg',
            role: 'Cliente',
            lastOnline: Date.now(),
            status: 'online',
            title: 'Interesado',
            personalInfo: {
                birthday: '1990-01-01',
                phoneNumber: '+1234567890'
            },
            members: []
        },
        media: {
            images: [],
            files: [],
            links: []
        }
    } as unknown as T)
}

export default apiGetContactDetails