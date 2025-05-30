import Logo from '@/components/template/Logo'
import useTheme from '@/utils/hooks/useTheme'
import appConfig from '@/configs/app.config'
import Link from 'next/link'
import type { Mode } from '@/@types/theme'

const HeaderLogo = ({ mode }: { mode?: Mode }) => {
    const defaultMode = useTheme((state) => state.mode)

    return (
        <Link href={appConfig.authenticatedEntryPath}>
            <Logo
                mode={mode || defaultMode}
                className="hidden lg:block"
                logoHeight={40}
            />
        </Link>
    )
}

export default HeaderLogo
