import type { KeyedMutator } from 'swr'

export type User = {
    id: string
    name?: string
    full_name?: string | null
    email: string
    img?: string
    avatar_url?: string | null
    role: string | null
    lastOnline?: number
    last_activity?: string | null
    status?: string | null
    created_at?: string
}

export type Filter = {
    role?: string
    status?: string
}

export type Users = User[]

export type Role = {
    id: string
    name: string
    description: string | null
    users: Pick<User, 'id' | 'full_name' | 'email' | 'role' | 'avatar_url'>[]
    accessRight?: Record<string, string[]>
    tenant_id?: string | null
    created_at?: string
    updated_at?: string
}

export type Roles = Role[]

export type GetRolesPermissionsUsersResponse = {
    list: Users
    total: number
}

export type GetRolesPermissionsRolesResponse = Roles

export type MutateRolesPermissionsUsersResponse =
    KeyedMutator<GetRolesPermissionsUsersResponse>

export type MutateRolesPermissionsRolesResponse =
    KeyedMutator<GetRolesPermissionsRolesResponse>
