// Script de debug para capturar el error real del login
import http from 'node:http';

const body = JSON.stringify({ username: 'operator', password: 'Santiago2026!' });

const req = http.request({
  hostname: 'localhost',
  port: 3100,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:', data);
  });
});
req.on('error', e => console.error('REQUEST ERROR:', e.message));
req.write(body);
req.end();
