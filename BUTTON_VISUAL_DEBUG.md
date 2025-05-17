# Depuración de Botones en el Chat

## Problema
Los botones se están enviando correctamente desde el backend pero no se muestran visualmente en el frontend.

## Logs del Backend
```
[flowRegistry] Devolviendo 2 mensajes y 2 botones
Respuesta del backend completa: {
  "success": true,
  "data": {
    "message": "...",
    "metadata": {
      "buttons": [
        { "body": "Comprar" },
        { "body": "Rentar" }
      ]
    }
  }
}
```

## Pasos para Verificar

1. **En el navegador, abrir las herramientas de desarrollo (F12)**
2. **Ir a la pestaña de Consola**
3. **Enviar mensajes en el chat hasta que aparezcan los botones**
4. **Buscar en la consola:**
   - "Respuesta del servidor:"
   - "Botones recibidos:"
   - "Botones encontrados en:"

## Posibles Puntos de Fallo

1. `apiSendChatMessage.ts` no está extrayendo los botones correctamente
2. `ChatBody.tsx` no está encontrando los botones en la respuesta
3. Los botones no se están pasando correctamente al componente Message

## Para Verificar en el Frontend

En la consola del navegador, ejecutar:
```javascript
// Ver el estado actual del chat
const chatStore = window.__NEXT_DATA__?.props?.pageProps;
console.log('Store:', chatStore);

// Ver los mensajes actuales
const messages = document.querySelectorAll('[class*="bubble"]');
console.log('Mensajes:', messages);

// Buscar elementos de botones
const buttons = document.querySelectorAll('button');
console.log('Botones encontrados:', buttons);
```

## Solución Temporal

Si los botones siguen sin mostrarse, verificar:

1. Que el frontend está usando la versión más reciente del código
2. Que no hay errores de compilación
3. Que el navegador no está usando caché antigua

Para forzar recarga sin caché:
- Chrome/Edge: Ctrl+Shift+R
- Firefox: Ctrl+F5
- Safari: Cmd+Shift+R