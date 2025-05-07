'use client'

import { useState } from 'react'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import CustomerForm from '@/components/view/CustomerForm'
import sleep from '@/utils/sleep'
import { TbTrash, TbArrowNarrowLeft } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { CustomerFormSchema } from '@/components/view/CustomerForm'
import type { Customer } from '../types'

type CustomerEditProps = {
    data: Customer
}

/**
 * Componente para editar los datos de un cliente existente
 * Incluye formulario, acciones de guardado y eliminación, y navegación
 *
 * @version 1.0.0
 * @updated 2025-03-25
 */
const CustomerEdit = ({ data }: CustomerEditProps) => {
    // Inicializar traducciones utilizando la estructura exacta del archivo JSON
    const t = useTranslations('customers')
    const tCommon = useTranslations('common')

    const router = useRouter()

    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const [isSubmiting, setIsSubmiting] = useState(false)

    const handleFormSubmit = async (values: CustomerFormSchema) => {
        console.log('Submitted values', values)
        setIsSubmiting(true)
        await sleep(800)
        setIsSubmiting(false)
        toast.push(
            <Notification type="success">{t('customerCreated')}</Notification>,
            {
                placement: 'top-center',
            },
        )
        router.push('/modules/customers/customer-list')
    }

    const getDefaultValues = () => {
        if (data) {
            const { firstName, lastName, email, personalInfo, img } = data

            return {
                firstName,
                lastName,
                email,
                img,
                phoneNumber: personalInfo.phoneNumber,
                dialCode: personalInfo.dialCode,
                country: personalInfo.country,
                address: personalInfo.address,
                city: personalInfo.city,
                postcode: personalInfo.postcode,
                tags: [],
            }
        }

        return {}
    }

    const handleConfirmDelete = () => {
        setDeleteConfirmationOpen(false)
        toast.push(
            <Notification type="success">
                {t('details.deleteSuccess')}
            </Notification>,
            { placement: 'top-center' },
        )
        router.push('/modules/customers/customer-list')
    }

    const handleDelete = () => {
        setDeleteConfirmationOpen(true)
    }

    const handleCancel = () => {
        setDeleteConfirmationOpen(false)
    }

    const handleBack = () => {
        history.back()
    }

    return (
        <>
            <CustomerForm
                defaultValues={getDefaultValues() as CustomerFormSchema}
                newCustomer={false}
                onFormSubmit={handleFormSubmit}
            >
                <Container>
                    <div className="flex items-center justify-between px-8">
                        <Button
                            className="ltr:mr-3 rtl:ml-3"
                            type="button"
                            variant="plain"
                            icon={<TbArrowNarrowLeft />}
                            onClick={handleBack}
                        >
                            {tCommon('back')}
                        </Button>
                        <div className="flex items-center">
                            <Button
                                className="ltr:mr-3 rtl:ml-3"
                                type="button"
                                customColorClass={() =>
                                    'border-error ring-1 ring-error text-error hover:border-error hover:ring-error hover:text-error bg-transparent'
                                }
                                icon={<TbTrash />}
                                onClick={handleDelete}
                            >
                                {tCommon('delete')}
                            </Button>
                            <Button
                                variant="solid"
                                type="submit"
                                loading={isSubmiting}
                            >
                                {tCommon('save')}
                            </Button>
                        </div>
                    </div>
                </Container>
            </CustomerForm>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title={t('removeCustomers')}
                onClose={handleCancel}
                onRequestClose={handleCancel}
                onCancel={handleCancel}
                onConfirm={handleConfirmDelete}
            >
                <p>{t('removeConfirmation')}</p>
            </ConfirmDialog>
        </>
    )
}

export default CustomerEdit
