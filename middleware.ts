import {
    authRoutes as _authRoutes,
    publicRoutes as _publicRoutes,
} from '@/configs/routes.config'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import appConfig from '@/configs/app.config'
import { auth } from '@/auth'

const publicRoutes = Object.entries(_publicRoutes).map(([key]) => key)
const authRoutes = Object.entries(_authRoutes).map(([key]) => key)

const apiAuthPrefix = `${appConfig.apiPrefix}/auth`
const apiChatbotPrefix = `${appConfig.apiPrefix}/chatbot`

export default auth((req) => {
    const { nextUrl } = req
    const isSignedIn = !!req.auth

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
    const isApiChatbotRoute = nextUrl.pathname.startsWith(apiChatbotPrefix)
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
    const isAuthRoute = authRoutes.includes(nextUrl.pathname)

    /** Skip auth middleware for api routes */
    if (isApiAuthRoute || isApiChatbotRoute) return

    if (isAuthRoute) {
        if (isSignedIn) {
            /** Redirect to authenticated entry path if signed in & path is auth route */
            return Response.redirect(
                new URL(appConfig.authenticatedEntryPath, nextUrl),
            )
        }
        return
    }

    /** Redirect to authenticated entry path if signed in & path is public route */
    if (!isSignedIn && !isPublicRoute) {
        let callbackUrl = nextUrl.pathname
        if (nextUrl.search) {
            callbackUrl += nextUrl.search
        }

        return Response.redirect(
            new URL(
                `${appConfig.unAuthenticatedEntryPath}?${REDIRECT_URL_KEY}=${callbackUrl}`,
                nextUrl,
            ),
        )
    }
})

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api)(.*)'],
}