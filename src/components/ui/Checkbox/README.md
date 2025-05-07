# Componente Checkbox de ECME

Este componente proporciona funcionalidad de checkbox siguiendo los estándares de diseño de ECME.

## Importación correcta

Para evitar problemas de referencia circular o importaciones incorrectas, siempre importa el componente desde el directorio principal:

```tsx
// Correcto ✅
import { Checkbox } from '@/components/ui';
// o
import Checkbox from '@/components/ui/Checkbox';

// Incorrecto ❌
import Checkbox from '@/components/ui/Checkbox/Checkbox';
```

## Alternativas disponibles

Si experimentas problemas con el componente Checkbox de ECME, puedes usar estas alternativas:

1. **SimpleCheckbox**: Un componente de checkbox independiente sin dependencias externas
   ```tsx
   import SimpleCheckbox from '@/components/shared/SimpleCheckbox';
   ```

2. **CheckboxWrapper**: Un componente wrapper que resuelve problemas de importación
   ```tsx
   import CheckboxWrapper from '@/components/shared/CheckboxWrapper';
   ```

## API del componente

El componente Checkbox admite las siguientes propiedades:

- `checked`: Controla si el checkbox está marcado o no
- `defaultChecked`: Establece el valor inicial del checkbox
- `disabled`: Deshabilita el checkbox
- `onChange`: Función que se ejecuta cuando cambia el estado del checkbox
- `value`: Valor del checkbox (útil en grupos)
- `checkboxClass`: Clase CSS personalizada para el checkbox
- `name`: Nombre del campo de entrada

## Variantes

- **Default**: Checkbox estándar
- **Group**: Grupo de checkboxes relacionados
- **Disabled**: Checkbox deshabilitado
- **Vertical**: Checkboxes dispuestos verticalmente
- **Color**: Checkbox con opciones de color personalizadas

## Ejemplo básico

```tsx
import { Checkbox } from '@/components/ui';

export default function Example() {
  return (
    <Checkbox onChange={(checked) => console.log(checked)}>
      Opción de ejemplo
    </Checkbox>
  );
}
```
