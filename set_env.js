const { execSync } = require('child_process');
const vars = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyAMMzATvPWghOT8islcllFz9hXlCJ6HdFk",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "webmaa-app.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "webmaa-app",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "webmaa-app.firebasestorage.app",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "156216219253",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:156216219253:web:8fec080019c45244d0ca3c",
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-ZNTHE383S2"
};

for (const [key, value] of Object.entries(vars)) {
  console.log(`Adding ${key}...`);
  try {
    execSync(`npx vercel env rm ${key} production --yes`, { stdio: 'ignore' });
  } catch(e) {}
  execSync(`npx vercel env add ${key} production`, { input: value, stdio: 'inherit' });
}
console.log('All frontend variables deployed to Vercel successfully!');
