/**
 * frontend/src/app/(protected-pages)/superadmin/admin-tools/json-schema-forms/_components/JsonSchemaFormsFixedModal.tsx
 * Componente modal para crear/editar esquemas JSON, usando SimpleSwitch en lugar de Checkbox
 * @version 1.0.0
 * @updated 2025-05-01
 */

import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Form, FormItem } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SimpleSwitch } from '@/components/shared/formAlternatives';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { JSONSchemaEditor } from '@/components/shared';

// Esquema de validación para el formulario de esquemas
const schemaFormSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  isPublic: z.boolean().default(false),
});

type SchemaFormValues = z.infer<typeof schemaFormSchema>;

// Categorías predefinidas para los esquemas
const schemaCategories = [
  { value: 'user', label: 'Usuarios' },
  { value: 'customer', label: 'Clientes' },
  { value: 'product', label: 'Productos' },
  { value: 'service', label: 'Servicios' },
  { value: 'order', label: 'Órdenes' },
  { value: 'form', label: 'Formularios' },
  { value: 'survey', label: 'Encuestas' },
  { value: 'system', label: 'Sistema' },
  { value: 'custom', label: 'Personalizado' },
];

interface JsonSchemaFormsFixedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchema: any;
  schemaInEditor: Record<string, any>;
  onSchemaChange: (schema: Record<string, any>) => void;
  onSubmit: (data: SchemaFormValues) => void;
}

const JsonSchemaFormsFixedModal: React.FC<JsonSchemaFormsFixedModalProps> = ({
  isOpen,
  onClose,
  currentSchema,
  schemaInEditor,
  onSchemaChange,
  onSubmit,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SchemaFormValues>({
    resolver: zodResolver(schemaFormSchema),
    defaultValues: {
      name: currentSchema?.name || '',
      description: currentSchema?.description || '',
      category: currentSchema?.category || '',
      isPublic: currentSchema?.isPublic || false,
    },
  });

  return (
    <Dialog 
        isOpen={isOpen} 
        onClose={onClose} 
        onRequestClose={onClose}
        width={1000} // Hacemos el diálogo más ancho para acomodar mejor el contenido
        // No configuramos altura fija para que se ajuste al contenido, pero con máximo
        style={{ maxHeight: '90vh' }} // Máximo 90% de la altura visible
      >
      <h5 className="mb-4 text-lg font-medium">
        {currentSchema ? 'Editar Esquema' : 'Nuevo Esquema JSON'}
      </h5>

      <div className="overflow-y-auto pr-1" style={{ maxHeight: 'calc(85vh - 150px)' }}>
        <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormItem
            label="Nombre del Esquema"
            invalid={Boolean(errors.name)}
            errorMessage={errors.name?.message}
            className="col-span-2"
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </FormItem>

          <FormItem
            label="Categoría"
            invalid={Boolean(errors.category)}
            errorMessage={errors.category?.message}
          >
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  options={schemaCategories}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FormItem>

          <FormItem label="Esquema Público">
            <SimpleSwitch
              name="isPublic"
              label="Disponible para todos los tenants"
              control={control}
              defaultValue={currentSchema?.isPublic || false}
            />
          </FormItem>

          <FormItem label="Descripción" className="col-span-2">
            <Controller
              name="description"
              control={control}
              render={({ field }) => <Input {...field} textArea rows={3} />}
            />
          </FormItem>
        </div>

          <div className="mb-4">
            <div className="text-gray-700 dark:text-gray-300 font-medium mb-2">
              Definición del Esquema
            </div>
            <div className="border rounded-md" style={{ height: '400px', maxHeight: 'calc(60vh - 100px)' }}>
              <JSONSchemaEditor
                initialSchema={schemaInEditor}
                onChange={onSchemaChange}
              />
            </div>
          </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="plain" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="solid" type="submit">
            {currentSchema ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
        </Form>
      </div>
    </Dialog>
  );
};

export default JsonSchemaFormsFixedModal;
