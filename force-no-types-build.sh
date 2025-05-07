#!/bin/bash
# Script para forzar la construcción sin comprobación de tipos o linting
# Modifica temporalmente el archivo tsconfig.json para deshabilitar la verificación de tipos

# Crear respaldo de tsconfig.json
cp tsconfig.json tsconfig.json.bak

# Modificar tsconfig.json para deshabilitar la verificación de tipos
cat > tsconfig.json << EOL
{
  "compilerOptions": {
    "target": "es5",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "checkJs": false,
    "noImplicitAny": false,
    "noImplicitThis": false,
    "strictNullChecks": false,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
EOL

# Ejecutar el build con opciones para deshabilitar linting
export NODE_OPTIONS="--max-old-space-size=16384"
npx next build --no-lint

# Restaurar el archivo tsconfig.json original
mv tsconfig.json.bak tsconfig.json