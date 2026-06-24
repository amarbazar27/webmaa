const http = require('https');

console.log("Starting fetch to https://piprapay-server-1.onrender.com/api/ ...");
const start = Date.now();

const req = http.request('https://piprapay-server-1.onrender.com/api/', {
  method: 'GET',
  timeout: 15000
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log(`BODY LENGTH: ${body.length}`);
    console.log(`BODY PREVIEW: ${body.slice(0, 300)}`);
    console.log(`Finished in ${Date.now() - start}ms`);
  });
});

req.on('timeout', () => {
  console.log(`TIMEOUT after ${Date.now() - start}ms`);
  req.destroy();
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message} after ${Date.now() - start}ms`);
});

req.end();
