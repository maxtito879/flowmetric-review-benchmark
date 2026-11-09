# flowmetric-review-benchmark

Backend de comercio electrónico de ejemplo (Node.js, sin dependencias externas).
Se usa como banco de pruebas para revisar Pull Requests de distintos tamaños.

## Arquitectura

```
src/
  app.js            composición de dependencias y despacho de solicitudes
  routes.js         tabla de rutas
  router.js         enrutador mínimo con parámetros de ruta
  server.js         adaptador HTTP (node:http)
  config/           constantes y datos semilla
  controllers/      traducen solicitudes HTTP a llamadas de servicio
  services/         lógica de negocio (pedidos, precios, inventario, pagos, autenticación)
  repositories/     persistencia en memoria
  gateways/         pasarela de pagos simulada
  validators/       validación y normalización de entradas
  middleware/       autenticación, autorización, errores y registro
  utils/            dinero (centavos), errores, identificadores, reloj y logger
tests/              pruebas con node:test
```

## Uso

```
npm test
TOKEN_SECRET=<valor-local> npm start
```

Todos los importes se manejan en centavos enteros (MXN).
