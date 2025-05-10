import AxiosBase from './axios/AxiosBase'
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

const ApiService = {
    fetchDataWithAxios<Response = unknown, Request = Record<string, unknown>>(
        param: AxiosRequestConfig<Request>,
    ) {
        // Return the full AxiosResponse object, not just the data
        return new Promise<Response>((resolve, reject) => {
            AxiosBase(param)
                .then((response: AxiosResponse<Response>) => {
                    resolve(response.data) // Resolve with just the data for simplified usage
                })
                .catch((errors: AxiosError) => {
                    // Mejorar el mensaje de error para depuración
                    console.error('Error en ApiService.fetchDataWithAxios:', {
                        url: param.url,
                        method: param.method,
                        status: errors.response?.status,
                        statusText: errors.response?.statusText,
                        message: errors.message,
                        data: errors.response?.data
                    });
                    
                    reject(errors)
                })
        })
    },
}

export default ApiService
