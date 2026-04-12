import http from 'node:http';

function req(options, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const r = http.request({ ...options, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr), ...(options.headers ?? {}) } }, (res) => {
      let data = ''; const cookies = res.headers['set-cookie'] ?? [];
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data), cookies }));
    });
    r.on('error', reject); r.write(bodyStr); r.end();
  });
}

const base = { hostname: 'localhost', port: 3100 };

// 1. Login
const login = await req({ ...base, path: '/api/auth/login', method: 'POST' }, { username: 'operator', password: 'Santiago2026!' });
console.log('LOGIN:', login.status);
const cookie = login.cookies.map(c => c.split(';')[0]).join('; ');

// 2. Execute — Test 1: explicit agentId "forge"
console.log('\n--- TEST 1: explicit agentId = forge ---');
const exec1 = await req(
  { ...base, path: '/api/execute', method: 'POST', headers: { Cookie: cookie } },
  { order: 'respondeme exactamente con una sola palabra: OPERATIVO', provider: 'claude', agentId: 'forge' }
);
console.log('STATUS:', exec1.status);
console.log('agentId:', exec1.data.agentId);
console.log('model:', exec1.data.model);
console.log('output:', exec1.data.output?.slice(0, 200));

// 3. Execute — Test 2: auto-routing to pixel via keyword
console.log('\n--- TEST 2: auto-routing (frontend keyword → pixel) ---');
const exec2 = await req(
  { ...base, path: '/api/execute', method: 'POST', headers: { Cookie: cookie } },
  { order: 'fix the frontend button and update the react component', provider: 'claude' }
);
console.log('STATUS:', exec2.status);
console.log('agentId (should be pixel):', exec2.data.agentId);
console.log('model:', exec2.data.model);

// 4. Execute — Test 3: short order → haiku
console.log('\n--- TEST 3: short order → haiku ---');
const exec3 = await req(
  { ...base, path: '/api/execute', method: 'POST', headers: { Cookie: cookie } },
  { order: '¿estado del sistema?', provider: 'claude' }
);
console.log('STATUS:', exec3.status);
console.log('agentId:', exec3.data.agentId);
console.log('model (should contain haiku):', exec3.data.model);

// 5. Execute — Test 4: complex order → sonnet
console.log('\n--- TEST 4: complex order → sonnet ---');
const exec4 = await req(
  { ...base, path: '/api/execute', method: 'POST', headers: { Cookie: cookie } },
  { order: 'implementá el endpoint de autenticación con JWT y refresh tokens', provider: 'claude' }
);
console.log('STATUS:', exec4.status);
console.log('agentId:', exec4.data.agentId);
console.log('model (should contain sonnet):', exec4.data.model);
