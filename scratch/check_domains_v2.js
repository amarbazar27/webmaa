const dns = require('dns').promises;

const domains = [
  'pallahhub.com',
  'pallahhq.com',
  'pallahlink.com',
  'pallahflow.com',
  'pallahops.com',
  'pallahrun.com',
  'pallahcentral.com',
  'pallahsuite.com',
  'pallahgrid.com',
  'pallahnode.com',
  'pallahscale.com',
  'pallahbiz.com',
  'pallahpro.com',
  'pallahplus.com',
  'pallahx.com',
  'pallahnet.com',
  'pallahstudio.com',
  'daripallahhub.com',
  'daripallahhq.com',
  'daripallahflow.com',
  'daripallahlink.com',
  'daripallahstudio.com',
  'daripallahplus.com',
  'daripallahpro.com'
];

async function checkDomain(domain) {
  try {
    await dns.resolve(domain);
    return { domain, status: 'TAKEN' };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return { domain, status: 'POTENTIALLY_AVAILABLE' };
    }
    return { domain, status: 'UNKNOWN', error: err.code };
  }
}

async function run() {
  const results = [];
  for (let i = 0; i < domains.length; i += 10) {
    const chunk = domains.slice(i, i + 10);
    const promises = chunk.map(d => checkDomain(d));
    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
  }

  const available = results.filter(r => r.status === 'POTENTIALLY_AVAILABLE');
  console.log('\n--- POTENTIALLY AVAILABLE ---');
  available.forEach(r => console.log(r.domain));
}

run();
