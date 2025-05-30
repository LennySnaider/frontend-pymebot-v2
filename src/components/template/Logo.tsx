import classNames from 'classnames'
import { APP_NAME } from '@/constants/app.constant'
import Image from 'next/image'
import type { CommonProps } from '@/@types/common'

interface LogoProps extends CommonProps {
    type?: 'full' | 'streamline'
    mode?: 'light' | 'dark'
    imgClass?: string
    logoWidth?: number
    logoHeight?: number
}

const LOGO_SRC_PATH = '/img/logo/'

const Logo = (props: LogoProps) => {
    const {
        type = 'full',
        mode = 'light',
        className,
        imgClass,
        style,
        logoWidth,
        logoHeight,
    } = props

    const width = logoWidth || (type === 'full' ? 180 : 80)
    const height = logoHeight || (type === 'full' ? 40 : 40)

    return (
        <div className={classNames('logo', className)} style={style}>
            {mode === 'light' && (
                <>
                    <Image
                        className={classNames(
                            '',
                            type === 'full' ? '' : 'hidden',
                            imgClass,
                        )}
                        src={`${LOGO_SRC_PATH}Logo_d.svg`}
                        alt={`${APP_NAME} logo`}
                        width={width}
                        height={height}
                        style={{ width: 'auto', height: 'auto' }}
                        priority
                    />
                    <Image
                        className={classNames(
                            '',
                            type === 'streamline' ? '' : 'hidden',
                            imgClass,
                        )}
                        src={`${LOGO_SRC_PATH}icon-logo.svg`}
                        alt={`${APP_NAME} logo`}
                        width={width}
                        height={height}
                        style={{ width: 'auto', height: 'auto' }}
                        priority
                    />
                </>
            )}
            {mode === 'dark' && (
                <>
                    <Image
                        className={classNames(
                            type === 'full' ? '' : 'hidden',
                            imgClass,
                        )}
                        src={`${LOGO_SRC_PATH}Logo_w.svg`}
                        alt={`${APP_NAME} logo`}
                        width={width}
                        height={height}
                        style={{ width: 'auto', height: 'auto' }}
                        priority
                    />
                    <Image
                        className={classNames(
                            type === 'streamline' ? '' : 'hidden',
                            imgClass,
                        )}
                        src={`${LOGO_SRC_PATH}icon-logo.svg`}
                        alt={`${APP_NAME} logo`}
                        width={width}
                        height={height}
                        style={{ width: 'auto', height: 'auto' }}
                        priority
                    />
                </>
            )}
        </div>
    )
}

export default Logo
