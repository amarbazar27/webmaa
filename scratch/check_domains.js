const dns = require('dns').promises;

const domains = [
  // Pallah/Daripallah Brand Extensions
  'daripalla.com',
  'daripallah.com',
  'pallahify.com',
  'pallahbuilder.com',
  'pallahsaas.com',
  'pallahshop.com',
  'pallahstore.com',
  'pallahcart.com',
  'pallahapp.com',
  'pallahweb.com',
  'pallahpay.com',
  'daripallahbuilder.com',
  'daripallahshop.com',
  'daripallahstore.com',
  'daripallahsaas.com',
  'daripallahpay.com',
  'dariify.com',
  'daribuilder.com',
  'darisaas.com',
  'daripay.com',
  'daripallahapp.com',
  'daripallahweb.com',
  'ezpallah.com',
  'smartpallah.com',
  'gopallah.com',
  'getpallah.com',
  'mypallah.com',
  'pallahcloud.com',
  'scalebazar.com',
  'pallahdesk.com',
  'pallahcommerce.com',
  'trustpallah.com',

  // Bengali Shop Builder / SaaS
  'dokanbuilder.com',
  'bazarbuilder.com',
  'instantdokan.com',
  'minutedokan.com',
  'dokanify.com',
  'bazarify.com',
  'dokanly.com',
  'bazarfly.com',
  'dokanweb.com',
  'bazarweb.com',
  'easydokan.com',
  'easybazar.com',
  'dokandesk.com',
  'bazardesk.com',
  'dokancloud.com',
  'bazarcloud.com',
  'dokanbox.com',
  'bazarbox.com',
  'bechakenacloud.com',
  'bechakenaapp.com',
  'bechakenasaas.com',
  'amardokanbuilder.com',
  'amarbazarbuilder.com',
  'smartdokan.com',
  'smartbazar.com',
  'instabazar.com',
  'instadokan.com',
  'zatiqeasy.com',
  'webmaa.com',
  'webmaasaas.com',
  'webmaabuilder.com',
  'webmaashop.com',
  'webmaastore.com',
  'webmaapay.com',

  // Scale/Balance Metaphor
  'scalecommerce.com',
  'balanceshop.com',
  'balanceseller.com',
  'trustscale.com',
  'shopscale.com',
  'weighcart.com',
  'weighshop.com',
  'scalecart.com',
  'scaleify.com',
  'scalebox.com',
  'scalecloud.com',
  'scalebuilder.com',
  'merchantscale.com',
  'cartscale.com',
  'weighcommerce.com',
  'scalesell.com'
];

async function checkDomain(domain) {
  try {
    // Resolve DNS records. If it succeeds, the domain has DNS set up, so it is taken.
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
  console.log(`Checking ${domains.length} domains...`);
  const results = [];
  
  // Run in chunks to prevent rate limiting or timeout
  for (let i = 0; i < domains.length; i += 10) {
    const chunk = domains.slice(i, i + 10);
    const promises = chunk.map(d => checkDomain(d));
    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
  }

  const available = results.filter(r => r.status === 'POTENTIALLY_AVAILABLE');
  const taken = results.filter(r => r.status === 'TAKEN');
  const unknown = results.filter(r => r.status === 'UNKNOWN');

  console.log('\n--- POTENTIALLY AVAILABLE ---');
  available.forEach(r => console.log(r.domain));

  console.log('\n--- TAKEN ---');
  taken.forEach(r => console.log(r.domain));

  console.log('\n--- UNKNOWN ---');
  unknown.forEach(r => console.log(`${r.domain} (${r.error})`));
}

run();
