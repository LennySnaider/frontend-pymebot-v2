/**
 * frontend/src/components/view/CustomerForm/ProfileImageSection.tsx
 * Sección de imagen de perfil con soporte para internacionalización.
 * @version 1.0.0
 * @updated 2025-04-01
 */

'use client'

import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Upload from '@/components/ui/Upload'
import Button from '@/components/ui/Button'
import DoubleSidedImage from '@/components/shared/DoubleSidedImage'
import { Controller } from 'react-hook-form'
import { HiOutlineUser } from 'react-icons/hi'
import { useTranslations } from 'next-intl'
import type { FormSectionBaseProps } from './types'

type ProfileImageSectionProps = FormSectionBaseProps

const ProfileImage = ({ control }: ProfileImageSectionProps) => {
    const t = useTranslations()

    const beforeUpload = (files: FileList | null) => {
        let valid: string | boolean = true

        const allowedFileType = ['image/jpeg', 'image/png']
        if (files) {
            Array.from(files).forEach((file) => {
                if (!allowedFileType.includes(file.type)) {
                    valid = t('customers.validation.invalidImageFormat')
                }
            })
        }

        return valid
    }

    return (
        <Card>
            <h4 className="mb-6">{t('customers.form.image')}</h4>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg text-center p-4">
                <div className="text-center">
                    <Controller
                        name="img"
                        control={control}
                        render={({ field }) => (
                            <>
                                <div className="flex items-center justify-center">
                                    {field.value ? (
                                        <Avatar
                                            size={100}
                                            className="border-4 border-white bg-gray-100 text-gray-300 shadow-lg"
                                            icon={<HiOutlineUser />}
                                            src={field.value}
                                        />
                                    ) : (
                                        <DoubleSidedImage
                                            src="/img/others/upload.png"
                                            darkModeSrc="/img/others/upload-dark.png"
                                            alt={t(
                                                'customers.form.uploadImageAlt',
                                            )}
                                        />
                                    )}
                                </div>
                                <Upload
                                    showList={false}
                                    uploadLimit={1}
                                    beforeUpload={beforeUpload}
                                    onChange={(files) => {
                                        if (files.length > 0) {
                                            field.onChange(
                                                URL.createObjectURL(files[0]),
                                            )
                                        }
                                    }}
                                >
                                    <Button
                                        variant="solid"
                                        className="mt-4"
                                        type="button"
                                    >
                                        {t('customers.form.uploadImage')}
                                    </Button>
                                </Upload>
                            </>
                        )}
                    />
                </div>
            </div>
        </Card>
    )
}

export default ProfileImage
