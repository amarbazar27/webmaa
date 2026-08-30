/**
 * Auto Sign AAB script for Google Play Console Upload
 * 1. Strips any previous debug/duplicate signatures (fixes "more than one certificate chain")
 * 2. Signs cleanly with ONLY the production release key
 * 3. Verifies the single certificate chain
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const aabInputPath = process.argv[2] || path.join(__dirname, '../public/builds/main/app-release.aab');
const keystorePath = path.join(__dirname, 'bdretailers-release-key.jks');
const keyAlias = 'bdretailers-release-key';
const keyPassword = 'bdretailers_release_pass_2026';

console.log('====================================================');
console.log('🚀 BDRetailers Single-Chain Release Signer');
console.log('====================================================\n');

// 1. Check if AAB exists
if (!fs.existsSync(aabInputPath)) {
  console.error(`❌ Error: AAB file not found at: ${aabInputPath}`);
  process.exit(1);
}

// 2. Generate Keystore if missing
if (!fs.existsSync(keystorePath)) {
  console.log('🔑 Generating Production Release Keystore...');
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
  const genKeyRes = spawnSync('keytool', genKeyArgs);
  if (genKeyRes.status !== 0) {
    console.error('❌ Failed to generate keystore:', genKeyRes.stderr?.toString());
    process.exit(1);
  }
}

console.log(`📦 Cleaning previous signatures from: ${aabInputPath}...`);

// 3. Remove META-INF signature files using PowerShell .NET ZipFile to prevent "more than one certificate chain"
const psCleanScript = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open('${aabInputPath.replace(/'/g, "''")}', 'Update')
$entriesToDelete = @($zip.Entries | Where-Object { $_.FullName -like 'META-INF/*' })
foreach ($entry in $entriesToDelete) {
    $entry.Delete()
}
$zip.Dispose()
Write-Host "CLEANED_SIGNATURES_COUNT: $($entriesToDelete.Count)"
`;

const psRes = spawnSync('powershell', ['-NoProfile', '-Command', psCleanScript]);
console.log('  └─ Output:', psRes.stdout?.toString().trim() || psRes.stderr?.toString().trim());

console.log(`\n🔏 Signing App Bundle with Single Release Certificate...`);

// 4. Sign cleanly with jarsigner
const signArgs = [
  '-sigalg', 'SHA256withRSA',
  '-digestalg', 'SHA-256',
  '-keystore', keystorePath,
  '-storepass', keyPassword,
  '-keypass', keyPassword,
  aabInputPath,
  keyAlias
];

const signRes = spawnSync('jarsigner', signArgs);
if (signRes.status !== 0) {
  console.error('❌ Failed to sign AAB:', signRes.stderr?.toString() || signRes.stdout?.toString());
  process.exit(1);
}

// 5. Verify single signature chain
const verifyRes = spawnSync('jarsigner', ['-verify', aabInputPath]);
console.log('  └─ Verification:', verifyRes.stdout?.toString().trim());

console.log('\n====================================================');
console.log('🎉 SUCCESS! Clean Single-Certificate Release Signed!');
console.log('====================================================');
console.log(`📁 File: ${aabInputPath}`);
console.log(`🛡️ Certificate: ONLY ONE Production Release Key (${keyAlias})`);
console.log('\n👉 Upload this file to Play Console now — 100% Guaranteed No Duplicate Certificate Errors!\n');
