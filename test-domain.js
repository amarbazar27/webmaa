require('dotenv').config({ path: '.env.local' });
const { getShopByDomain } = require('./src/lib/firestore-server.js');

async function test() {
  const shop = await getShopByDomain('messerbazar.com');
  console.log("Result:", shop);
}

test();
