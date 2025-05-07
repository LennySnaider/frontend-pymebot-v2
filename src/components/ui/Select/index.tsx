import Select from './Select'
import Option from './Option'
import ClientSelect from './ClientSelect'

export type { SelectProps } from './Select'
export { Select, Option, ClientSelect }

// Para mantener la compatibilidad, seguimos exportando Select como predeterminado,
// pero recomendamos usar ClientSelect para evitar errores de hidratación
export default Select
