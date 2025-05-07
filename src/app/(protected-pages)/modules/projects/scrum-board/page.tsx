import ScrumBoardProvider from './_components/ScrumBoardProvider'
import Board from './_components/Board'
import getScrumboardData from '@/server/actions/getScrumboardData'
import getSrcumboardMembers from '@/server/actions/getSrcumboardMembers'
import { getTranslations } from 'next-intl/server'

/**
 * Página principal del tablero Scrum
 * Obtiene datos del servidor y renderiza el tablero
 *
 * @version 1.0.0
 * @updated 2025-03-25
 */
export default async function Page() {
    const data = await getScrumboardData()
    const projectMembers = await getSrcumboardMembers()
    await getTranslations('scrumboard') // Precargar traducciones para el cliente

    return (
        <ScrumBoardProvider data={data} projectMembers={projectMembers}>
            <Board />
        </ScrumBoardProvider>
    )
}
