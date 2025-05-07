// 'use client'

// import toast from '@/components/ui/toast'
// import Notification from '@/components/ui/Notification'
// import SignUp from '@/components/auth/SignUp'
// import { apiSignUp } from '@/services/AuthService'
// import { useRouter } from 'next/navigation'
// import type { OnSignUpPayload } from '@/components/auth/SignUp'

// const SignUpClient = () => {
//     const router = useRouter()

//     const handlSignUp = async ({
//         values,
//         setSubmitting,
//         setMessage,
//     }: OnSignUpPayload) => {
//         try {
//             setSubmitting(true)
//             await apiSignUp(values)
//             toast.push(
//                 <Notification title="Account created!" type="success">
//                     You can now sign in from our sign in page
//                 </Notification>,
//             )
//             router.push('/sign-in')
//         } catch (error) {
//             setMessage(error as string)
//         } finally {
//             setSubmitting(false)
//         }
//     }

//     return <SignUp onSignUp={handlSignUp} />
// }

// export default SignUpClient
//

/**
 * frontend/src/app/(auth-pages)/sign-up/_components/SignUpClient.tsx
 * Componente cliente para manejar el registro de usuarios con validación de errores mejorada.
 * @version 1.1.0
 * @updated 2025-03-22
 */

'use client'

import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import SignUp from '@/components/auth/SignUp'
import { apiSignUp } from '@/services/AuthService'
import { useRouter } from 'next/navigation'
import type { OnSignUp } from '@/components/auth/SignUp/SignUpForm'
import axios from 'axios'

// Interfaz para el tipo de error de Axios
interface ApiErrorData {
    error?: string
    message?: string
    [key: string]: unknown
}

const SignUpClient = () => {
    const router = useRouter()

    const handlSignUp: OnSignUp = async ({
        values,
        setSubmitting,
        setMessage,
    }) => {
        try {
            setSubmitting(true)
            await apiSignUp(values)
            toast.push(
                <Notification title="Account created!" type="success">
                    You can now sign in from our sign in page
                </Notification>,
            )
            router.push('/sign-in')
        } catch (error: unknown) {
            // Inicializar mensaje de error con valor por defecto
            let errorMessage: string =
                'Error creating account. Please try again.'

            // Verificar si es un error de Axios
            if (axios.isAxiosError(error) && error.response) {
                // Acceder a la respuesta del servidor de forma segura
                const responseData = error.response.data as ApiErrorData
                if (responseData && typeof responseData.error === 'string') {
                    errorMessage = responseData.error
                } else if (typeof error.message === 'string') {
                    errorMessage = error.message
                }
            }
            // Si es un error estándar de JavaScript
            else if (error instanceof Error) {
                errorMessage = error.message
            }
            // Si de alguna forma es solo una cadena
            else if (typeof error === 'string') {
                errorMessage = error
            }

            // Ahora pasamos una string limpia
            setMessage(errorMessage)
        } finally {
            setSubmitting(false)
        }
    }

    return <SignUp onSignUp={handlSignUp} />
}

export default SignUpClient
