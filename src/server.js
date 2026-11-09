'use strict';

const http = require('node:http');
const { createApp } = require('./app');

const app = createApp();

const server = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);

  let body;
  try {
    body = chunks.length > 0 ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined;
  } catch {
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'INVALID_JSON', message: 'JSON inválido' } }));
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const response = await app.handle(req.method, url.pathname, {
    body,
    headers: req.headers,
    query: Object.fromEntries(url.searchParams),
  });

  res.writeHead(response.status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(response.body));
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => console.log(`Servidor escuchando en el puerto ${port}`));
