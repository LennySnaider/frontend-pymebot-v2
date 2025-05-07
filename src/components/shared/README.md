# Alternativas para el Componente Checkbox

Este directorio contiene varios componentes alternativos que pueden usarse cuando el componente `Checkbox` estándar de ECME presenta problemas.

## Componentes Disponibles

1. **SimpleCheckbox**: Un componente checkbox independiente sin dependencias externas
   - Ideal para casos simples donde solo necesitas la funcionalidad de un checkbox
   - No depende del componente Checkbox de ECME

2. **CheckboxAlternative**: Usa Radio pero funciona como Checkbox
   - Compatible con react-hook-form
   - Buena alternativa temporal mientras se resuelven problemas con Checkbox

3. **ToggleRadio**: Alternativa que usa Radio pero con diseño diferente
   - Ofrece una experiencia visual diferente
   - Compatible con react-hook-form

4. **SimpleSwitch**: Un toggle switch elegante
   - Implementación desde cero sin dependencias de otros componentes UI
   - Visual moderna y atractiva para casos de activación/desactivación

5. **CheckboxWrapper**: Wrapper para el componente Checkbox de ECME
   - Intenta resolver problemas de importación
   - Usar solo si las otras alternativas no cubren tu caso de uso

## Uso con react-hook-form

```tsx
import { useForm } from 'react-hook-form';
import { SimpleSwitch } from '@/components/shared/formAlternatives';

export default function MyForm() {
  const { control, handleSubmit } = useForm();
  
  const onSubmit = (data) => {
    console.log(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SimpleSwitch
        name="acceptTerms"
        label="Acepto los términos y condiciones"
        control={control}
        defaultValue={false}
        rules={{ required: 'Este campo es obligatorio' }}
      />
      
      <button type="submit">Enviar</button>
    </form>
  );
}
```

## Migración desde Checkbox

Si estás migrando desde Checkbox, reemplaza:

```tsx
<Controller
  name="myCheckbox"
  control={control}
  render={({ field }) => (
    <Checkbox {...field} checked={field.value}>
      Mi etiqueta
    </Checkbox>
  )}
/>
```

Por cualquiera de estas alternativas:

```tsx
// Opción 1: SimpleSwitch (recomendada)
<SimpleSwitch
  name="myCheckbox"
  label="Mi etiqueta"
  control={control}
  defaultValue={false}
/>

// Opción 2: CheckboxAlternative
<CheckboxAlternative
  name="myCheckbox"
  label="Mi etiqueta"
  control={control}
  defaultValue={false}
/>

// Opción 3: SimpleCheckbox con Controller
<Controller
  name="myCheckbox"
  control={control}
  render={({ field: { value, onChange } }) => (
    <SimpleCheckbox
      checked={value}
      onChange={onChange}
    >
      Mi etiqueta
    </SimpleCheckbox>
  )}
/>
```

Estas alternativas te permitirán avanzar en el desarrollo mientras se resuelven los problemas con el componente Checkbox de ECME.
