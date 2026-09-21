import http from 'http';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqOptions = {
      ...options,
      headers: {
        ...options.headers,
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('🔑 Logging in as Admin to obtain JWT token...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
  }, { email: 'admin@hms.hospital', password: 'Admin@12345' });

  const token = loginRes.body?.token;
  if (token) {
    console.log('✅ Admin JWT Token Acquired Successfully!\n');
  } else {
    console.log('⚠️ Login failed:', loginRes.body);
  }

  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  const endpoints = [
    { name: 'Health Check', path: '/api/health', method: 'GET', auth: false },
    { name: 'API Version', path: '/api/version', method: 'GET', auth: false },
    { name: 'Schema Inspector', path: '/api/schema', method: 'GET', auth: false },
    { name: 'Doctors Roster', path: '/api/doctors', method: 'GET', auth: false },
    { name: 'Patients List', path: '/api/patients', method: 'GET', auth: true },
    { name: 'Appointments List', path: '/api/appointments', method: 'GET', auth: true },
    { name: 'OPD Live Queue Board', path: '/api/queue/live', method: 'GET', auth: false },
    { name: 'Nurse Triage Queue', path: '/api/triage/queue', method: 'GET', auth: true },
    { name: 'Appointment Flow Board', path: '/api/appointment-flow/board', method: 'GET', auth: true },
    { name: 'Consultation Stats Overview', path: '/api/consultation/stats/overview', method: 'GET', auth: false },
    { name: 'SOAP Note Templates', path: '/api/consultation/soap-notes/templates', method: 'GET', auth: false },
    { name: 'Pharmacy Stock Inventory', path: '/api/pharmacy/medicines', method: 'GET', auth: false },
    { name: 'IPD Beds & Wards Matrix', path: '/api/ipd/beds', method: 'GET', auth: false },
    { name: 'Integrated Auto-Billing Invoices', path: '/api/billing/invoices', method: 'GET', auth: false },
  ];

  console.log('🔍 Verifying Backend APIs for all Frontend Dashboard Tabs...\n');
  let allPassed = true;
  for (const ep of endpoints) {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: ep.path,
      method: ep.method,
      headers: ep.auth ? authHeaders : {},
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`✅ [${res.statusCode} OK] ${ep.name} (${ep.path})`);
    } else {
      console.log(`❌ [${res.statusCode}] ${ep.name} (${ep.path})`);
      allPassed = false;
    }
  }

  console.log('\n======================================================');
  console.log(allPassed ? '🎉 ALL TAB BACKEND API ENDPOINTS ARE 100% OPERATIONAL!' : '⚠️ Some endpoints returned non-2xx status');
  console.log('======================================================');
}

main();
