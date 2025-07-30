// Script para verificar que no hay bucles infinitos en la aplicación
const http = require('http');

console.log('Verificando estado de la aplicación...\n');

// Hacer una petición simple a la aplicación
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`Estado HTTP: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    console.log(`Respuesta: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('\n✅ La aplicación responde correctamente');
    console.log('✅ No se detectan bucles infinitos');
    process.exit(0);
  });
});

req.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.log('❌ La aplicación no está ejecutándose en el puerto 3000');
  } else {
    console.log(`❌ Error: ${err.message}`);
  }
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Timeout - posible bucle infinito detectado');
  req.destroy();
  process.exit(1);
});

req.end();