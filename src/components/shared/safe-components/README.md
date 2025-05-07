# Safe Components para Hidratación

*Version 1.0.0 - 30 de abril de 2025*

Esta biblioteca proporciona componentes seguros para evitar errores de hidratación en aplicaciones Next.js con SSR. Los errores de hidratación ocurren cuando hay diferencias entre el HTML renderizado en el servidor y lo que React intenta renderizar en el cliente.

## Componentes Disponibles

- `SafeHydration`: Componente base que renderiza su contenido solo del lado del cliente
- `SafeSelect`: Versión segura del componente Select (evita errores con atributos ARIA)
- `SafeDatePicker`: Encapsula componentes de calendario para renderizado seguro
- `SafeChart`: Para visualizaciones y gráficos que dependen del DOM o window
- `SafeDynamicContent`: Para contenido que depende de datos aleatorios, fechas o locale

## Ejemplos de Uso

### SafeHydration (Componente Base)

```tsx
import { SafeHydration } from '@/components/shared/safe-components';

const MyComponent = () => {
  return (
    <SafeHydration fallback={<div className="loading-placeholder">Cargando...</div>}>
      <ComponenteConProblemasDeHidratacion />
    </SafeHydration>
  );
};
```

### SafeSelect (Para Componentes Select)

```tsx
import { SafeSelect } from '@/components/shared/safe-components';

const MyForm = () => {
  return (
    <SafeSelect
      options={options}
      onChange={handleChange}
      placeholder="Selecciona una opción"
      placeholderText="Cargando opciones..."
    />
  );
};
```

### SafeDatePicker (Para Calendarios)

```tsx
import { SafeDatePicker } from '@/components/shared/safe-components';
import DatePicker from 'react-datepicker';

const MyCalendar = () => {
  return (
    <SafeDatePicker
      DatePickerComponent={DatePicker}
      datePickerProps={{
        selected: selectedDate,
        onChange: handleDateChange,
        dateFormat: "yyyy-MM-dd"
      }}
      placeholderText="Cargando calendario..."
    />
  );
};
```

### SafeChart (Para Visualizaciones)

```tsx
import { SafeChart } from '@/components/shared/safe-components';
import { BarChart } from 'recharts';

const MyChart = () => {
  return (
    <SafeChart
      ChartComponent={BarChart}
      chartProps={{
        width: 600,
        height: 300,
        data: chartData,
        margin: { top: 20, right: 30, left: 20, bottom: 5 }
      }}
      simulatedLines={true}
    />
  );
};
```

### SafeDynamicContent (Para Contenido Dinámico)

```tsx
import { SafeDynamicContent } from '@/components/shared/safe-components';

const FormattedDate = () => {
  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'full',
    timeStyle: 'long'
  }).format(now);
  
  return (
    <SafeDynamicContent>
      <span>{formattedDate}</span>
    </SafeDynamicContent>
  );
};
```

## Buenas Prácticas

1. **Utiliza SafeHydration para**:
   - Componentes que utilizan `window` o `document`
   - Cualquier uso de `localStorage` o `sessionStorage`
   - Fechas o horas formateadas según locale
   - Números aleatorios o valores cambiantes
   - Componentes de terceros que no son SSR-friendly

2. **Evita el uso excesivo**:
   - No envuelvas toda tu aplicación en SafeHydration
   - Utiliza el componente específico para cada caso de uso
   - Usa fallbacks significativos para mejorar UX durante la carga

3. **Para componentes complejos**:
   - Considera crear un componente Safe personalizado
   - Añade un pequeño delay si es necesario (para scripts externos)
   - Usa la función `isReady` para verificar datos asíncronos

4. **Combina con suspense cuando sea apropiado**:
   ```tsx
   <Suspense fallback={<Skeleton />}>
     <SafeHydration>
       <ComponenteComplejo />
     </SafeHydration>
   </Suspense>
   ```

## Errores Comunes que Soluciona

1. **Atributos ARIA inconsistentes**: Errores con `aria-activedescendant` en componentes Select.
2. **Diferencias en formateo de fechas**: Entre servidor y cliente debido a timezone o locale.
3. **Cálculos basados en el DOM**: Componentes que miden el viewport o elementos.
4. **Valores aleatorios**: Componentes que usan `Math.random()` u otras fuentes de aleatoriedad.
5. **Estado inicial basado en cliente**: Componentes que establecen estado basado en `window`.

## Extensión

Para añadir nuevos componentes seguros, sigue este patrón:

1. Crea un nuevo archivo `Safe[ComponentName].tsx`
2. Utiliza `SafeHydration` como base
3. Implementa un fallback adecuado
4. Exporta el componente en `index.ts`

## Contribuciones

Si encuentras errores de hidratación adicionales o necesitas un nuevo componente seguro, contacta al equipo de frontend.
