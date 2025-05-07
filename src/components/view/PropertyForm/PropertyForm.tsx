/**
 * frontend/src/components/view/PropertyForm/PropertyForm.tsx
 * Componente de formulario para crear y editar propiedades inmobiliarias.
 * @version 1.1.2
 * @updated 2025-10-15
 */

'use client'

import { useEffect } from 'react'
import { Form } from '@/components/ui/Form'
import Container from '@/components/shared/Container'
import BottomStickyBar from '@/components/template/BottomStickyBar'
import GeneralSection from './components/GeneralSection'
import PricingSection from './components/PricingSection'
import LocationSection from './components/LocationSection'
import FeaturesSection from './components/FeaturesSection'
import MediaSection from './components/MediaSection'
import AgentSection from './components/AgentSection'
import DebugInfo from './components/DebugInfo'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import isEmpty from 'lodash/isEmpty'
import { propertyFormSchema, PropertyFormSchema } from './types'
import type { CommonProps } from '@/@types/common'

type PropertyFormProps = {
    onFormSubmit: (values: PropertyFormSchema) => void
    defaultValues?: PropertyFormSchema
    newProperty?: boolean
} & CommonProps

const PropertyForm = (props: PropertyFormProps) => {
    const {
        onFormSubmit,
        defaultValues = {
            name: '',
            propertyCode: '',
            description: '',
            status: 'available',
            propertyType: 'house',
            operationType: 'sale',
            price: 0,
            currency: 'MXN',
            features: {
                bedrooms: 0,
                bathrooms: 0,
                area: 0,
                parkingSpots: 0,
                yearBuilt: new Date().getFullYear(),
                hasPool: false,
                hasGarden: false,
                hasGarage: false,
                hasSecurity: false,
            },
            location: {
                address: '',
                city: '',
                state: '',
                zipCode: '',
                colony: '',
                country: 'México',
                coordinates: {
                    lat: 0,
                    lng: 0,
                },
                showApproximateLocation: false,
            },
            media: [],
            agentId: '',
        },
        children,
    } = props

    const methods = useForm<PropertyFormSchema>({
        defaultValues,
        resolver: zodResolver(propertyFormSchema),
    })

    const {
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = methods

    useEffect(() => {
        if (!isEmpty(defaultValues)) {
            reset(defaultValues)
        }
    }, [JSON.stringify(defaultValues)])

    const onSubmit = (values: PropertyFormSchema) => {
        console.log('Valores del formulario antes de enviar:', values)
        onFormSubmit?.(values)
    }

    return (
        <FormProvider {...methods}>
            <Form
                className="flex w-full h-full"
                containerClassName="flex flex-col w-full justify-between"
                onSubmit={handleSubmit(onSubmit)}
            >
                <Container>
                    <div className="flex flex-col xl:flex-row gap-4">
                        <div className="gap-4 flex flex-col flex-auto">
                            <GeneralSection control={control} errors={errors} />
                            <LocationSection
                                control={control}
                                errors={errors}
                            />
                            <FeaturesSection
                                control={control}
                                errors={errors}
                            />
                            <PricingSection control={control} errors={errors} />
                        </div>
                        <div className="lg:min-w-[440px] 2xl:w-[500px] gap-4 flex flex-col">
                            <MediaSection control={control} errors={errors} />
                            <AgentSection control={control} errors={errors} />
                            <DebugInfo />
                        </div>
                    </div>
                </Container>
                <BottomStickyBar>{children}</BottomStickyBar>
            </Form>
        </FormProvider>
    )
}

export default PropertyForm
