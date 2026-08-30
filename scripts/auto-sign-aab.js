/**
 * Auto Sign AAB script for Google Play Console Upload
 * Automatically generates a production release keystore (if not present)
 * and signs the given .aab file with zero interactive prompts.
 * 
 * Usage:
 *   node scripts/auto-sign-aab.js "path/to/main-app-release (4).aab"
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const aabInputPath = process.argv[2] || path.join(__dirname, '../public/builds/main/app-release.aab');
const keystorePath = path.join(__dirname, 'bdretailers-release-key.jks');
const keyAlias = 'bdretailers-release-key';
const keyPassword = 'bdretailers_release_pass_2026';

console.log('====================================================');
console.log('🚀 BDRetailers Auto Release Signer for Google Play');
console.log('====================================================\n');

// 1. Check if keytool and jarsigner exist
const checkKeytool = spawnSync('keytool', ['-help'], { shell: true });
if (checkKeytool.status !== 0) {
  console.error('❌ Error: keytool (Java JDK) is not installed or not in PATH.');
  process.exit(1);
}

// 2. Generate Production Keystore if not exists (Non-interactive)
if (!fs.existsSync(keystorePath)) {
  console.log('🔑 Generating Production Release Keystore (Zero prompts)...');
  const genKeyArgs = [
    '-genkeypair',
    '-v',
    '-keystore', keystorePath,
    '-keyalg', 'RSA',
    '-keysize', '2048',
    '-validity', '10000',
    '-alias', keyAlias,
    '-dname', 'CN=BDRetailers,OU=Mobile,O=BDRetailers,L=Rangpur,ST=Rangpur,C=BD',
    '-storepass', keyPassword,
    '-keypass', keyPassword
  ];

  const genKeyRes = spawnSync('keytool', genKeyArgs, { shell: true });
  if (genKeyRes.status !== 0) {
    console.error('❌ Failed to generate keystore:', genKeyRes.stderr?.toString() || genKeyRes.stdout?.toString());
    process.exit(1);
  }
  console.log('✅ Production Release Keystore generated successfully at:', keystorePath);
} else {
  console.log('✅ Existing Production Keystore found at:', keystorePath);
}

// 3. Check AAB file
if (!fs.existsSync(aabInputPath)) {
  console.error(`\n❌ Error: AAB file not found at: ${aabInputPath}`);
  console.log(`\n💡 Tip: Run the script with the exact path to your AAB file, for example:`);
  console.log(`node scripts/auto-sign-aab.js "C:\\Users\\...\\Downloads\\main-app-release (4).aab"\n`);
  process.exit(1);
}

console.log(`\n📦 Signing App Bundle: ${aabInputPath}...`);

// 4. Sign the AAB with jarsigner
const signArgs = [
  '-sigalg', 'SHA256withRSA',
  '-digestalg', 'SHA-256',
  '-keystore', `"${keystorePath}"`,
  '-storepass', keyPassword,
  '-keypass', keyPassword,
  `"${aabInputPath}"`,
  keyAlias
];

const signRes = spawnSync('jarsigner', signArgs, { shell: true });
if (signRes.status !== 0) {
  console.error('❌ Failed to sign AAB:', signRes.stderr?.toString() || signRes.stdout?.toString());
  process.exit(1);
}

console.log('\n====================================================');
console.log('🎉 SUCCESS! Your App Bundle (.aab) is now Release-Signed!');
console.log('====================================================');
console.log(`📁 File Location: ${aabInputPath}`);
console.log(`🛡️ Signed with: Production Release Key (${keyAlias})`);
console.log('\n👉 You can now directly upload this .aab file to Google Play Console with NO ERRORS!\n');
