'use client'

/**
 * frontend/src/components/ui/Avatar/Avatar.tsx
 * Componente para mostrar avatares de usuario, imágenes de perfil o logos.
 * Incluye gestión avanzada de errores y estados de carga de imagen.
 * 
 * @version 2.1.0
 * @updated 2025-05-18
 */

import { useState, useEffect, useRef, SyntheticEvent } from 'react'
import useMergedRef from '../hooks/useMergeRef'
import classNames from 'classnames'
import type { CommonProps, TypeAttributes } from '../@types/common'
import type { ReactNode, Ref } from 'react'

export interface AvatarProps extends CommonProps {
    alt?: string
    icon?: ReactNode
    onClick?: () => void
    ref?: Ref<HTMLSpanElement>
    size?: 'lg' | 'md' | 'sm' | number
    shape?: Exclude<TypeAttributes.Shape, 'none'> | 'square'
    src?: string
    srcSet?: string
    onError?: (e: SyntheticEvent<HTMLImageElement, Event>) => void
    onLoad?: (e: SyntheticEvent<HTMLImageElement, Event>) => void
}

const Avatar = (props: AvatarProps) => {
    const {
        alt,
        className,
        icon,
        ref = null,
        shape = 'circle',
        size = 'md',
        src,
        srcSet,
        onError,
        onLoad,
        ...rest
    } = props

    let { children } = props
    const [scale, setScale] = useState(1)

    // Referencias para el manejo del texto interno
    const avatarChildren = useRef<HTMLSpanElement>(null)
    const avatarNode = useRef<HTMLSpanElement>(null)
    const avatarMergeRef = useMergedRef(ref, avatarNode)

    // Estado para controlar la carga de la imagen
    const [imgSrc, setImgSrc] = useState<string | undefined>(src)
    const [imgLoaded, setImgLoaded] = useState(false)
    const [imgError, setImgError] = useState(false)

    // Calcular la escala del texto interno para ajustar al tamaño
    const innerScale = () => {
        if (!avatarChildren.current || !avatarNode.current) {
            return
        }
        const avatarChildrenWidth = avatarChildren.current.offsetWidth
        const avatarNodeWidth = avatarNode.current.offsetWidth
        if (avatarChildrenWidth === 0 || avatarNodeWidth === 0) {
            return
        }
        setScale(
            avatarNodeWidth - 8 < avatarChildrenWidth
                ? (avatarNodeWidth - 8) / avatarChildrenWidth
                : 1,
        )
    }

    // Recalcular escala cuando cambian los hijos o la escala
    useEffect(() => {
        innerScale()
    }, [scale, children])

    // Actualizar estado de la imagen cuando cambia el prop src
    useEffect(() => {
        if (src) {
            setImgSrc(src)
            setImgLoaded(false)
            setImgError(false)
        } else {
            setImgSrc(undefined)
            setImgError(false)
        }
    }, [src])

    // Manejar errores de carga de imagen
    const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
        console.warn('Error al cargar imagen en Avatar:', {
            src: imgSrc,
            time: new Date().toISOString(),
        })
        
        setImgError(true)
        setImgLoaded(false)
        
        // Propagar el evento al handler proporcionado por el usuario
        if (onError) {
            onError(e)
        }
    }

    // Manejar carga exitosa de imagen
    const handleImageLoad = (e: SyntheticEvent<HTMLImageElement, Event>) => {
        // Evitamos actualizar el estado si ya está cargada la imagen
        if (!imgLoaded) {
            setImgLoaded(true)
            
            // Propagar el evento al handler proporcionado por el usuario
            if (onLoad) {
                onLoad(e)
            }
        }
    }

    // Estilo basado en el tamaño
    const sizeStyle =
        typeof size === 'number'
            ? {
                  width: size,
                  height: size,
                  minWidth: size,
                  lineHeight: `${size}px`,
                  fontSize: icon ? size / 2 : 12,
              }
            : {}

    // Clases basadas en las props
    const classes = classNames(
        'avatar',
        `avatar-${shape}`,
        typeof size === 'string' ? `avatar-${size}` : '',
        className,
    )

    // Determinar el contenido basado en el estado
    if (imgSrc && !imgError) {
        // Mostrar imagen si hay URL y no hay error
        children = (
            <img
                className={`avatar-img avatar-${shape}`}
                src={imgSrc}
                srcSet={srcSet}
                alt={alt || 'avatar'}
                loading="lazy"
                onError={handleImageError}
                onLoad={handleImageLoad}
            />
        )
    } else if (icon) {
        // Mostrar icono si no hay imagen o hay error, y se ha proporcionado un icono
        children = (
            <span className={classNames('avatar-icon', `avatar-icon-${size}`)}>
                {icon}
            </span>
        )
    } else {
        // Mostrar texto si no hay imagen ni icono
        const childrenSizeStyle =
            typeof size === 'number' ? { lineHeight: `${size}px` } : {}
        const stringCentralized = {
            transform: `translateX(-50%) scale(${scale})`,
        }
        children = (
            <span
                ref={avatarChildren}
                className={`avatar-string ${
                    typeof size === 'number' ? '' : `avatar-inner-${size}`
                }`}
                style={{
                    ...childrenSizeStyle,
                    ...stringCentralized,
                    ...(typeof size === 'number' ? { height: size } : {}),
                }}
            >
                {children}
            </span>
        )
    }

    return (
        <span
            ref={avatarMergeRef}
            className={classes}
            style={{ ...sizeStyle, ...rest.style }}
            {...rest}
        >
            {children}
        </span>
    )
}

export default Avatar