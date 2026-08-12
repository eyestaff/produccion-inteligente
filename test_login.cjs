const https = require('https');

function request(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  const url = 'https://produccion-inteligente.smart-group.workers.dev';
  console.log('Testing login...');
  const loginRes = await request(
    url + '/api/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@smartgroup.com', password: 'admin123' },
  );

  console.log('Login Response:', loginRes.status, loginRes.data);
  if (!loginRes.data.token) {
    console.error('No token received');
    return;
  }

  const token = loginRes.data.token;

  console.log('Testing seed...');
  const seedRes = await request(url + '/api/demo/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
  });
  console.log('Seed Response:', seedRes.status, seedRes.data);
}
run();
