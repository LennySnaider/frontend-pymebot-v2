import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id?: string
      role?: string
      tenant_id?: string | null
      tenantId?: string | null
      authority?: string[]
    } & DefaultSession["user"]
  }

  interface User {
    id?: string
    role?: string
    tenant_id?: string | null
    tenantId?: string | null
    authority?: string[]
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    role?: string
    tenant_id?: string | null
    tenantId?: string | null
    authority?: string[]
  }
}
