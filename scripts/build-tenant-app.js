/**
 * Daripallah White-Label App Builder Runner
 * Usage: node scripts/build-tenant-app.js <shopSlug> [--dry-run] [--github-actions]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');

// Custom zero-dependency .env parser function
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let value = parts.slice(1).join('=').trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.replace(/\\n/g, '\n'); // handle escaped newlines
      }
    });
  } catch (err) {
    console.warn(`Failed to read env file: ${filePath}`, err.message);
  }
}

// Load environment variables if running locally
loadEnvFile(path.join(__dirname, '../.env.local'));
loadEnvFile(path.join(__dirname, '../.env'));

const shopSlug = process.argv[2];
const isDryRun = process.argv.includes('--dry-run');
const isGitHubActions = process.argv.includes('--github-actions');
const versionCodeFlag = process.argv.find(arg => arg.startsWith('--version-code='));
const customVersionCode = versionCodeFlag ? parseInt(versionCodeFlag.split('=')[1], 10) : null;

if (!shopSlug) {
  console.error('❌ Error: Please specify shopSlug as the first argument.');
  process.exit(1);
}

// Helper to sanitize shopSlug to make it a valid Android package identifier (alphanumeric only)
const sanitizedSlug = shopSlug.toLowerCase().replace(/[^a-z0-9]/g, '');

const reservedKeywords = new Set([
  'abstract', 'as', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue',
  'default', 'do', 'double', 'else', 'enum', 'extends', 'false', 'final', 'finally', 'float', 'for', 'fun', 'goto',
  'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'is', 'long', 'native', 'new', 'null',
  'object', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch',
  'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'typealias', 'typeof', 'val', 'var',
  'void', 'volatile', 'when', 'while'
]);

const packageNameSlug = reservedKeywords.has(sanitizedSlug) ? `${sanitizedSlug}app` : sanitizedSlug;
let packageName = (shopSlug === 'main') ? 'com.bdretailers' : `com.${packageNameSlug}`;

console.log(`🚀 Starting App Build Runner for [${shopSlug}]`);
console.log(`📦 Package Name: ${packageName}`);
console.log(`🔧 Dry Run: ${isDryRun ? 'YES' : 'NO'}`);
console.log(`🌐 GitHub Actions Context: ${isGitHubActions ? 'YES' : 'NO'}`);

// Initialize Firebase Admin (Only Firestore — no Storage needed)
let admin;
let db;

if (!isDryRun) {
  try {
    admin = require('firebase-admin');
    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log('✅ Firebase Admin (Firestore) initialized successfully.');
      } else {
        console.warn('⚠️ Firebase credentials missing. Running in mock database mode.');
      }
    }
    db = admin.apps.length ? admin.firestore() : null;
  } catch (err) {
    console.error('❌ Failed to load firebase-admin:', err.message);
  }
}

// GitHub Release Upload Helper (free, no billing required)
async function uploadToGitHubRelease(filePath, fileName, contentType) {
  const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
  const githubOwner = process.env.GITHUB_OWNER || 'amarbazar27';
  const githubRepo = process.env.GITHUB_REPO || 'webmaa';

  if (!githubToken) {
    throw new Error('GITHUB_TOKEN or GITHUB_PAT environment variable is required for file upload.');
  }

  const releaseTag = `app-${shopSlug}-${Date.now()}`;
  const releaseName = `${shopSlug} App Build ${new Date().toISOString().slice(0, 10)}`;

  // 1. Create a new GitHub Release
  console.log(`  📦 Creating GitHub Release tag: ${releaseTag}...`);
  const createReleaseBody = JSON.stringify({
    tag_name: releaseTag,
    name: releaseName,
    body: `Auto-generated white-label Android app build for shop: **${shopSlug}**\n\nPackage: \`${packageName}\``,
    draft: false,
    prerelease: false,
  });

  const releaseResponse = await new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${githubOwner}/${githubRepo}/releases`,
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DaripallahAppBuilder',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(createReleaseBody),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { reject(new Error(`Failed to parse release response: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.write(createReleaseBody);
    req.end();
  });

  if (releaseResponse.status !== 201) {
    throw new Error(`GitHub Release creation failed (${releaseResponse.status}): ${JSON.stringify(releaseResponse.body)}`);
  }

  const uploadUrl = releaseResponse.body.upload_url.replace('{?name,label}', '');
  const releasePageUrl = releaseResponse.body.html_url;
  console.log(`  ✅ Release created: ${releasePageUrl}`);

  // 2. Upload the file as a release asset
  console.log(`  ⬆️  Uploading ${fileName} to release...`);
  const fileBuffer = fs.readFileSync(filePath);

  const uploadResponse = await new Promise((resolve, reject) => {
    const uploadUrlParsed = new URL(`${uploadUrl}?name=${encodeURIComponent(fileName)}`);
    const options = {
      hostname: uploadUrlParsed.hostname,
      path: uploadUrlParsed.pathname + uploadUrlParsed.search,
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DaripallahAppBuilder',
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { reject(new Error(`Failed to parse upload response: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.write(fileBuffer);
    req.end();
  });

  if (uploadResponse.status !== 201) {
    throw new Error(`Asset upload failed (${uploadResponse.status}): ${JSON.stringify(uploadResponse.body)}`);
  }

  const downloadUrl = uploadResponse.body.browser_download_url;
  console.log(`  ✅ Uploaded! Download URL: ${downloadUrl}`);
  return downloadUrl;
}

// Download utility
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: HTTP Status ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => reject(err));
    });
  });
}

// Core execution function
async function build() {
  const rootDir = path.join(__dirname, '..');
  const tempBuildDir = path.join(rootDir, '.tmp/builds', shopSlug);
  const appWorkspace = path.join(tempBuildDir, 'app');

  // 1. Fetch Tenant Configuration
  let shopName = shopSlug === 'main' ? "BDRetailers Platform" : "BDRetailers Store";
  let targetUrl = shopSlug === 'main' ? "https://bdretailers.com" : `https://bdretailers.com/${shopSlug}`;
  let primaryColor = "#9333ea";
  let logoUrl = null;
  let customDomain = null;
  let appConfig = {};
  let actualShopId = shopSlug;

  if (db && !isDryRun) {
    try {
      console.log(`🔍 Fetching configuration from Firestore for: ${shopSlug}...`);
      
      // If building for main platform, first read globalConfig
      let globalConfig = {};
      try {
        const globalSnap = await db.collection('config').doc('global').get();
        if (globalSnap.exists) {
          globalConfig = globalSnap.data() || {};
        }
      } catch (gErr) {
        console.warn('⚠️ Could not fetch globalConfig:', gErr.message);
      }

      let snap = await db.collection('shops').where('subdomainSlug', '==', shopSlug).limit(1).get();
      if (snap.empty) {
        snap = await db.collection('shops').where('shopSlug', '==', shopSlug).limit(1).get();
      }
      if (snap.empty) {
        snap = await db.collection('shops').doc(shopSlug).get();
      }

      if (shopSlug === 'main') {
        shopName = globalConfig.brandName || "BDRetailers Platform";
        targetUrl = `https://bdretailers.com`;
        primaryColor = globalConfig.primaryColor || globalConfig.themeColor || "#9333ea";
        logoUrl = globalConfig.logoUrl || null;
        packageName = "com.bdretailers";

        if (!snap.empty) {
          const shopDoc = snap.docs ? snap.docs[0] : snap;
          actualShopId = shopDoc.id;
          const shopData = shopDoc.data();
          appConfig = shopData.appConfig || {};
          appConfig.versionCode = shopData.appBuildVersionCode || appConfig.versionCode;
          appConfig.versionName = shopData.appBuildVersionName || appConfig.versionName;
          shopName = appConfig.appName || globalConfig.brandName || shopData.shopName || shopName;
          primaryColor = shopData.designOverrides?.primaryColor || primaryColor;
          logoUrl = appConfig.logoUrl || globalConfig.logoUrl || shopData.logoUrl || logoUrl;
        }
        console.log(`✅ Loaded main platform metadata: ${shopName} | Package: ${packageName} | Color: ${primaryColor} | Logo: ${logoUrl || 'default'}`);
      } else if (!snap.empty) {
        const shopDoc = snap.docs ? snap.docs[0] : snap;
        actualShopId = shopDoc.id;
        const shopData = shopDoc.data();
        appConfig = shopData.appConfig || {};
        appConfig.versionCode = shopData.appBuildVersionCode || appConfig.versionCode;
        appConfig.versionName = shopData.appBuildVersionName || appConfig.versionName;
        shopName = appConfig.appName || shopData.shopName || shopName;
        primaryColor = shopData.designOverrides?.primaryColor || primaryColor;
        logoUrl = appConfig.logoUrl || shopData.logoUrl || null;
        customDomain = shopData.customDomain || null;
        
        if (appConfig.packageName) {
          packageName = appConfig.packageName.trim();
        }
        
        if (customDomain && shopData.domainStatus === 'active') {
          targetUrl = `https://${customDomain}`;
        } else {
          targetUrl = `https://bdretailers.com/${shopSlug}`;
        }
        console.log(`✅ Loaded shop metadata: ${shopName} | DocId: ${actualShopId} | Package: ${packageName} | Color: ${primaryColor} | Domain: ${targetUrl}`);
      } else {
        console.warn(`⚠️ Shop document not found in Firestore. Using default parameters.`);
      }
    } catch (err) {
      console.error('❌ Firestore read failed:', err.message);
    }
  } else {
    console.log('📝 Dry-run / mock database mode. Using default branding values.');
  }

  // Ensure workspace setup
  console.log(`📁 Preparing workspace at: ${appWorkspace}`);
  if (fs.existsSync(tempBuildDir)) {
    fs.rmSync(tempBuildDir, { recursive: true, force: true });
  }
  fs.mkdirSync(appWorkspace, { recursive: true });

  // 2. Copy Flutter App Template
  const templatePath = path.join(rootDir, 'flutter_app_template');
  console.log(`📂 Copying template from ${templatePath} to ${appWorkspace}`);
  fs.cpSync(templatePath, appWorkspace, { recursive: true });

  // 3. Setup Logo Icon
  const iconDest = path.join(appWorkspace, 'assets/icon.png');
  const defaultPublicLogo = path.join(rootDir, 'public/logo.png');

  if (logoUrl) {
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      try {
        console.log(`📥 Downloading branding logo from: ${logoUrl}`);
        await downloadFile(logoUrl, iconDest);
        console.log(`✅ Remote logo saved to: ${iconDest}`);
      } catch (err) {
        console.error(`❌ Failed to download logo: ${err.message}. Using public logo fallback.`);
        if (fs.existsSync(defaultPublicLogo)) {
          fs.copyFileSync(defaultPublicLogo, iconDest);
        }
      }
    } else {
      // Local relative path (e.g. /logo.png or logo.png)
      const cleanRelPath = logoUrl.startsWith('/') ? logoUrl.slice(1) : logoUrl;
      const localLogoPath = path.join(rootDir, 'public', cleanRelPath);
      if (fs.existsSync(localLogoPath)) {
        fs.copyFileSync(localLogoPath, iconDest);
        console.log(`✅ Copied local logo from ${localLogoPath} to: ${iconDest}`);
      } else if (fs.existsSync(defaultPublicLogo)) {
        fs.copyFileSync(defaultPublicLogo, iconDest);
        console.log(`✅ Copied fallback public logo to: ${iconDest}`);
      }
    }
  } else if (fs.existsSync(defaultPublicLogo)) {
    fs.copyFileSync(defaultPublicLogo, iconDest);
    console.log(`✅ Using official public logo as default icon: ${iconDest}`);
  }

  // Ensure logo icon has Android Adaptive Icon safe-zone padding (prevents edge cropping)
  if (fs.existsSync(iconDest)) {
    try {
      const sharp = require('sharp');
      const inputBuffer = fs.readFileSync(iconDest);
      const resizedLogo = await sharp(inputBuffer)
        .resize(330, 330, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .toBuffer();

      await sharp({
        create: {
          width: 512,
          height: 512,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        }
      })
      .composite([{ input: resizedLogo, gravity: 'center' }])
      .png()
      .toFile(iconDest + '.padded.png');

      fs.renameSync(iconDest + '.padded.png', iconDest);
      console.log('✅ Applied 512x512 safe-zone padding to logo icon (no side cropping).');
    } catch (sharpErr) {
      console.warn(`⚠️ Safe-zone logo padding warning: ${sharpErr.message}`);
    }
  }

  // 4. Overwrite Config files
  console.log('✍️ Overwriting template files with branding parameters...');
  
  // A. lib/config.dart
  const configDartPath = path.join(appWorkspace, 'lib/config.dart');
  const shopTagline = (shopSlug === 'main') ? "YOUR STORE. YOUR WAY." : (appConfig.appShortDesc || "OFFICIAL MOBILE STORE");
  const shopSubtitle = (shopSlug === 'main') ? "সহজ ও নির্ভরযোগ্য অনলাইন শপিং" : "দ্রুত ও নিরাপদ শপিং অভিজ্ঞতা";
  const configContent = `class AppConfig {
  static const String appName = "${shopName.replace(/"/g, '\\"').trim()}";
  static const String appTagline = "${shopTagline.replace(/"/g, '\\"').trim()}";
  static const String appSubtitle = "${shopSubtitle.replace(/"/g, '\\"').trim()}";
  static const String targetUrl = "${targetUrl.trim()}";
  static const String primaryColorHex = "${primaryColor.trim()}";
  static const String shopId = "${actualShopId.trim()}";
  static const String shopSlug = "${shopSlug.trim()}";
}
`;
  fs.writeFileSync(configDartPath, configContent);
  console.log('  └─ lib/config.dart configured.');

  // B. pubspec.yaml (replace app name AND auto-increment version code per shop)
  const versionsFilePath = path.join(rootDir, 'scripts/app-versions.json');
  let appVersions = {};
  if (fs.existsSync(versionsFilePath)) {
    try {
      appVersions = JSON.parse(fs.readFileSync(versionsFilePath, 'utf8'));
    } catch (_) {}
  }

  const firestoreVersion = Number(appConfig.versionCode || 0);
  const fileVersion = Number(appVersions[shopSlug] || 0);
  const minimumFloor = (shopSlug === 'messerbazar') ? 5 : (shopSlug === 'main' ? 2 : 1);
  const previousVersionCode = Math.max(firestoreVersion, fileVersion, minimumFloor);
  const targetVersionCode = customVersionCode || (previousVersionCode + 1);
  const targetVersionName = appConfig.versionName || `1.0.${targetVersionCode - 1}`;

  // Persist updated version code back to app-versions.json
  appVersions[shopSlug] = targetVersionCode;
  try {
    fs.writeFileSync(versionsFilePath, JSON.stringify(appVersions, null, 2));
    console.log(`  📌 Auto-incremented version code for [${shopSlug}]: ${previousVersionCode} ➔ ${targetVersionCode} (v${targetVersionName})`);
  } catch (err) {
    console.warn(`  ⚠️ Could not update app-versions.json: ${err.message}`);
  }

  const pubspecPath = path.join(appWorkspace, 'pubspec.yaml');
  let pubspecContent = fs.readFileSync(pubspecPath, 'utf8');
  pubspecContent = pubspecContent.replace('name: bdretailers_white_label_app', `name: bdretailers_${sanitizedSlug}`);
  pubspecContent = pubspecContent.replace('description: "BDRetailers multi-tenant e-commerce mobile webview app wrapper"', `description: "BDRetailers App wrapper for ${shopName}"`);
  pubspecContent = pubspecContent.replace(/version:\s*[\d\.\+\-]+/, `version: ${targetVersionName}+${targetVersionCode}`);

  fs.writeFileSync(pubspecPath, pubspecContent);
  console.log(`  └─ pubspec.yaml configured with Version Code: ${targetVersionCode} (${targetVersionName}).`);

  // C. android/app/build.gradle (replace namespace AND applicationId)
  const buildGradlePath = path.join(appWorkspace, 'android/app/build.gradle');
  let buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
  buildGradleContent = buildGradleContent.replace('namespace "com.bdretailers.template"', `namespace "${packageName}"`);
  buildGradleContent = buildGradleContent.replace('applicationId "com.bdretailers.template"', `applicationId "${packageName}"`);
  fs.writeFileSync(buildGradlePath, buildGradleContent);
  console.log('  └─ android/app/build.gradle configured.');

  // C2. android/app/google-services.json — write complete valid JSON including Android OAuth client
  // client_type 1 (Android) is REQUIRED for google_sign_in to return idToken on Android
  const googleServicesPath = path.join(appWorkspace, 'android/app/google-services.json');

  // Android OAuth clients from Firebase Console (both Upload Key & Play App Signing Key)
  const ANDROID_OAUTH_CLIENTS = {
    'com.bdretailers': [
      {
        client_id: '156216219253-21kngrda3a07lk04rnk5cstvr07no92u.apps.googleusercontent.com',
        client_type: 1,
        android_info: { package_name: 'com.bdretailers', certificate_hash: '25786062a1a147b884467f38e03c0b36ae1aa609' }
      },
      {
        client_id: '156216219253-947el7srnb4o46v7uf8ojc21k04i8a7k.apps.googleusercontent.com',
        client_type: 1,
        android_info: { package_name: 'com.bdretailers', certificate_hash: '2fbffe07234e89948c4a73d4d35a28af28f42a64' }
      }
    ],
    'com.messerbazar': [
      {
        client_id: '156216219253-svv9tlktp7jdsrm13bk6964r6lf4kup7.apps.googleusercontent.com',
        client_type: 1,
        android_info: { package_name: 'com.messerbazar', certificate_hash: '25786062a1a147b884467f38e03c0b36ae1aa609' }
      },
      {
        client_id: '156216219253-edl3je55b748ciq422g8r9h21ot5ot26.apps.googleusercontent.com',
        client_type: 1,
        android_info: { package_name: 'com.messerbazar', certificate_hash: '3983f8e4cc0ec92b830628cf53738d53c8682a6e' }
      }
    ]
  };
  const WEB_CLIENT_ID = '156216219253-4truhu9ta74ochdqc0bo995fgkpuqv2l.apps.googleusercontent.com';

  const buildOAuthClients = (pkg) => {
    const clients = [{ client_id: WEB_CLIENT_ID, client_type: 3 }];
    const androidClients = ANDROID_OAUTH_CLIENTS[pkg];
    if (Array.isArray(androidClients)) {
      clients.unshift(...androidClients);
    } else if (androidClients) {
      clients.unshift(androidClients);
    }
    return clients;
  };

  const googleServicesContent = JSON.stringify({
    project_info: {
      project_number: '156216219253',
      firebase_url: 'https://webmaa-app-default-rtdb.firebaseio.com',
      project_id: 'webmaa-app',
      storage_bucket: 'webmaa-app.firebasestorage.app'
    },
    client: [
      {
        client_info: {
          mobilesdk_app_id: (packageName === 'com.messerbazar') ? '1:156216219253:android:84998771525920b1d0ca3c' : '1:156216219253:android:491be9bc9e61d0c9d0ca3c',
          android_client_info: { package_name: packageName }
        },
        oauth_client: buildOAuthClients(packageName),
        api_key: [{ current_key: 'AIzaSyBHRcN3fql3TYrrsUGBkkxmPPrIb2lhSYc' }],
        services: {
          appinvite_service: {
            other_platform_oauth_client: [{ client_id: WEB_CLIENT_ID, client_type: 3 }]
          }
        }
      }
    ],
    configuration_version: '1'
  }, null, 2);
  fs.writeFileSync(googleServicesPath, googleServicesContent);
  console.log('  └─ android/app/google-services.json configured (with Android OAuth client).');


  // D. android/app/src/main/AndroidManifest.xml (replace app name and deep link domain)
  const manifestPath = path.join(appWorkspace, 'android/app/src/main/AndroidManifest.xml');
  let manifestContent = fs.readFileSync(manifestPath, 'utf8');
  manifestContent = manifestContent.replace('android:label="BDRetailers"', `android:label="${shopName.replace(/"/g, '&quot;')}"`);
  // If custom domain exists, insert custom host in AndroidManifest
  if (customDomain) {
    const deepLinkHook = `<data android:host="${customDomain}" />`;
    manifestContent = manifestContent.replace('<data android:host="bdretailers.com" />', `<data android:host="bdretailers.com" />\n                ${deepLinkHook}`);
  }
  fs.writeFileSync(manifestPath, manifestContent);
  console.log('  └─ android/app/src/main/AndroidManifest.xml configured.');

  // E. Dynamic Kotlin Folder Structure & MainActivity package rename
  console.log('  └─ Restructuring MainActivity.kt package...');
  const oldKotlinPath = path.join(appWorkspace, 'android/app/src/main/kotlin/com/bdretailers/MainActivity.kt');
  const packagePathPart = packageName.replace(/\./g, '/');
  const newKotlinDir = path.join(appWorkspace, 'android/app/src/main/kotlin', packagePathPart);
  
  fs.mkdirSync(newKotlinDir, { recursive: true });
  const newKotlinPath = path.join(newKotlinDir, 'MainActivity.kt');
  
  const mainActivityContent = `package ${packageName}
 
import io.flutter.embedding.android.FlutterActivity
 
class MainActivity: FlutterActivity() {
}
`;
  fs.writeFileSync(newKotlinPath, mainActivityContent);
  
  // Remove the old template MainActivity if it's in a different path
  if (fs.existsSync(oldKotlinPath) && oldKotlinPath !== newKotlinPath) {
    fs.unlinkSync(oldKotlinPath);
  }
  console.log('  └─ Kotlin folder restructured.');

  // F. Configure Release Keystore and key.properties for Android Signing
  console.log('  └─ Configuring production release signing...');
  const keyPropertiesPath = path.join(appWorkspace, 'android/key.properties');
  const sharedKeystorePath = path.join(rootDir, 'scripts/bdretailers-release-key.jks');
  const targetKeystorePath = path.join(appWorkspace, 'android/app/release-key.jks');
  
  if (fs.existsSync(sharedKeystorePath)) {
    fs.copyFileSync(sharedKeystorePath, targetKeystorePath);
    const keyPropsContent = `storePassword=bdretailers_release_pass_2026\nkeyPassword=bdretailers_release_pass_2026\nkeyAlias=bdretailers-release-key\nstoreFile=release-key.jks\n`;
    fs.writeFileSync(keyPropertiesPath, keyPropsContent);
    console.log('  └─ Production release keystore linked.');
  }

  // G. Generate Play Store Assets (Submission Package)
  console.log('🖨️ Generating Play Console Launch Checklist Package...');
  const assetsOutDir = path.join(tempBuildDir, 'play_store_assets');
  fs.mkdirSync(assetsOutDir, { recursive: true });

  const pemCertPath = path.join(rootDir, 'scripts/bdretailers_upload_cert.pem');
  if (fs.existsSync(pemCertPath)) {
    fs.copyFileSync(pemCertPath, path.join(assetsOutDir, 'upload_certificate.pem'));
  }

  const metadataJson = {
    packageName,
    appName: shopName,
    shortDescription: appConfig.appShortDesc || `Official Android App for ${shopName}. Shop online with fast delivery, reviews, and secure checkout.`,
    longDescription: appConfig.appLongDesc || `Welcome to the official ${shopName} Android mobile application!\n\nBrowse through our extensive catalog of products, manage your cart, apply coupon discounts, track your orders in real-time, and check out securely.\n\nKey App Features:\n- Full access to the catalog and product variants\n- Real-time notifications and alerts\n- Seamless digital and cash-on-delivery payments\n- Dynamic support chats\n- Offline caching and performance optimization\n\nDownload the ${shopName} app today and enjoy a premium e-commerce experience!`,
    privacyPolicyUrl: appConfig.privacyUrl || `${targetUrl}/privacy-policy`,
    contactEmail: appConfig.developerEmail || `rafiqunnabi07@gmail.com`,
  };
  fs.writeFileSync(path.join(assetsOutDir, 'metadata.json'), JSON.stringify(metadataJson, null, 2));

  const checklistMd = `# Google Play Console Launch Checklist for ${shopName}

1. **Keystore Generation**:
   Generates a secure release key to sign your app. Run this command to generate a upload-keystore:
   \`\`\`bash
   keytool -genkey -v -keystore ${sanitizedSlug}-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias ${sanitizedSlug}-key
   \`\`\`
   *Note: Save this key safely! If lost, you cannot update your app on Google Play.*

2. **App Bundle Upload**:
   - Go to Play Console → Select your App → Production → Create new release.
   - Drag and drop your compiled \`app-release.aab\` file.

3. **Store Listing Assets Setup**:
   - **App Name**: ${shopName} (Max 30 characters)
   - **Short Description**: Official mobile app for ${shopName} store. (Max 80 characters)
   - **Full Description**: (See metadata.json in this directory)
   - **App Icon**: 512x512 PNG, 32-bit (No transparent background)
   - **Feature Graphic**: 1024x500 PNG/JPG
   - **Screenshots**: At least 2 phone screenshots (minimum 320px, maximum 3840px, aspect ratio 16:9 or 9:16).

4. **Data Safety Declarations**:
   - **Location**: Collected (if user grants permission) for delivery addressing.
   - **Personal Info**: Name, Email, Phone, Address collected for account registration and order delivery.
   - **Financial Info**: Payment gateway inputs are handled securely by payment provider. No cards stored in-app.
   - **Security Practices**: Data is transferred over secure HTTPS connections. Users can request account deletion.
`;
  fs.writeFileSync(path.join(assetsOutDir, 'checklist.md'), checklistMd);
  console.log('  └─ Play Store launch checklist assets generated.');

  // 5. Run Compiler (If NOT in dry-run)
  if (isDryRun) {
    console.log('🚨 Dry-Run complete. Build file operations generated successfully.');
    console.log(`📦 Simulated artifacts locations: ${tempBuildDir}`);
    return {
      status: 'completed',
      apkUrl: `/builds/${shopSlug}/app-release.apk`,
      aabUrl: `/builds/${shopSlug}/app-release.aab`,
      packageName,
      targetVersionCode,
      targetVersionName,
      actualShopId,
    };
  }

  // Local compilation is only supported if flutter command exists
  console.log('🔨 Compiling binaries using Flutter SDK...');
  
  // Set local.properties path for Android SDK if system has it
  const localPropsPath = path.join(appWorkspace, 'android/local.properties');
  if (process.env.ANDROID_HOME) {
    fs.writeFileSync(localPropsPath, `sdk.dir=${process.env.ANDROID_HOME.replace(/\\/g, '/')}\n`);
  }

  console.log('  └─ Running: flutter pub get...');
  const pubGet = spawnSync('flutter', ['pub', 'get'], { cwd: appWorkspace, shell: true });
  if (pubGet.status !== 0) {
    throw new Error(`flutter pub get failed: ${pubGet.stderr?.toString() || pubGet.stdout?.toString()}`);
  }

  console.log('  └─ Running: launcher icon generator...');
  const iconsGen = spawnSync('flutter', ['pub', 'run', 'flutter_launcher_icons'], { cwd: appWorkspace, shell: true });
  if (iconsGen.status !== 0) {
    console.warn(`⚠️ Icons generation warning. App will build with default template icon.`);
  }

  console.log('  └─ Running: native splash generator...');
  const splashGen = spawnSync('flutter', ['pub', 'run', 'flutter_native_splash:create'], { cwd: appWorkspace, shell: true });
  if (splashGen.status !== 0) {
    console.warn(`⚠️ Splash generation warning.`);
  }

  console.log('  └─ Compiling Release APK...');
  const buildApk = spawnSync('flutter', ['build', 'apk', '--release', '--android-skip-build-dependency-validation'], { cwd: appWorkspace, shell: true });
  if (buildApk.status !== 0) {
    throw new Error(`APK build failed: ${buildApk.stderr?.toString() || buildApk.stdout?.toString()}`);
  }
  console.log('  └─ Compiled APK successfully.');

  console.log('  └─ Compiling Release App Bundle (AAB)...');
  const buildAab = spawnSync('flutter', ['build', 'appbundle', '--release', '--android-skip-build-dependency-validation'], { cwd: appWorkspace, shell: true });
  if (buildAab.status !== 0) {
    throw new Error(`AAB build failed: ${buildAab.stderr?.toString() || buildAab.stdout?.toString()}`);
  }
  console.log('  └─ Compiled AAB successfully.');

  // Find outputs
  const apkSource = path.join(appWorkspace, 'build/app/outputs/flutter-apk/app-release.apk');
  const aabSource = path.join(appWorkspace, 'build/app/outputs/bundle/release/app-release.aab');

  const outDir = path.join(rootDir, 'public/builds', shopSlug);
  fs.mkdirSync(outDir, { recursive: true });

  const apkDest = path.join(outDir, 'app-release.apk');
  const aabDest = path.join(outDir, 'app-release.aab');

  fs.copyFileSync(apkSource, apkDest);
  fs.copyFileSync(aabSource, aabDest);
  console.log(`🎉 Files saved locally: \n- APK: ${apkDest}\n- AAB: ${aabDest}`);

  let apkUrl = `/builds/${shopSlug}/app-release.apk`;
  let aabUrl = `/builds/${shopSlug}/app-release.aab`;

  // 6. Upload Binaries to GitHub Releases (Free, no billing required)
  if (isGitHubActions || process.env.GITHUB_TOKEN || process.env.GITHUB_PAT) {
    try {
      console.log(`📤 Uploading APK to GitHub Releases (free hosting)...`);
      apkUrl = await uploadToGitHubRelease(
        apkDest,
        `${shopSlug}-app-release.apk`,
        'application/vnd.android.package-archive'
      );

      console.log(`📤 Uploading AAB to GitHub Releases (free hosting)...`);
      aabUrl = await uploadToGitHubRelease(
        aabDest,
        `${shopSlug}-app-release.aab`,
        'application/octet-stream'
      );

      console.log(`✅ Uploaded to GitHub Releases!\n- APK: ${apkUrl}\n- AAB: ${aabUrl}`);
    } catch (err) {
      console.error(`❌ GitHub Releases upload failed: ${err.message}. Using local fallback URLs.`);
    }
  }

  return {
    status: 'completed',
    apkUrl,
    aabUrl,
    packageName,
    targetVersionCode,
    targetVersionName,
    actualShopId,
  };
}

// Execute wrapper
build()
  .then(async (result) => {
    console.log(`🏆 App Build Completed Successfully (Version Code: ${result.targetVersionCode}, Version Name: ${result.targetVersionName}).`);
    
    // Update build record in Firestore if available
    if (db && !isDryRun) {
      try {
        console.log(`💾 Updating Firestore build status for ${shopSlug}...`);
        let shopDocRef = null;
        if (result.actualShopId && result.actualShopId !== shopSlug) {
          shopDocRef = db.collection('shops').doc(result.actualShopId);
        } else {
          let snap = await db.collection('shops').where('subdomainSlug', '==', shopSlug).limit(1).get();
          if (snap.empty) {
            snap = await db.collection('shops').where('shopSlug', '==', shopSlug).limit(1).get();
          }
          if (!snap.empty) {
            shopDocRef = snap.docs[0].ref;
          } else {
            shopDocRef = db.collection('shops').doc(shopSlug);
          }
        }

        if (shopDocRef) {
          try {
            await shopDocRef.set({
              appBuildStatus: 'completed',
              appBuildApkUrl: result.apkUrl,
              appBuildAabUrl: result.aabUrl,
              appBuildPackageName: packageName,
              appBuildVersionCode: result.targetVersionCode,
              appBuildVersionName: result.targetVersionName,
              'appConfig.versionCode': result.targetVersionCode,
              'appConfig.versionName': result.targetVersionName,
              appBuildUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
              appBuildError: null
            }, { merge: true });
          } catch (e) {
            console.warn('⚠️ Shop doc set warning:', e.message);
          }
        }

        if (shopSlug === 'main') {
          try {
            await db.collection('config').doc('global').set({
              appBuildStatus: 'completed',
              appBuildApkUrl: result.apkUrl,
              appBuildAabUrl: result.aabUrl,
              appBuildPackageName: packageName,
              appBuildVersionCode: result.targetVersionCode,
              appBuildVersionName: result.targetVersionName,
              appBuildUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
              appBuildError: null
            }, { merge: true });
            console.log(`✅ Global config updated with main app build info.`);
          } catch (gErr) {
            console.warn('⚠️ Global config update warning:', gErr.message);
          }
        }
        console.log(`✅ Firestore updated successfully with Version Code: ${result.targetVersionCode}.`);
      } catch (err) {
        console.error('❌ Failed to update Firestore with build urls:', err.message);
      }
    }
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Build runner crashed with exception:', err);
    
    // Log error inside Firestore
    if (db && !isDryRun) {
      try {
        let snap = await db.collection('shops').where('subdomainSlug', '==', shopSlug).limit(1).get();
        if (snap.empty) {
          snap = await db.collection('shops').where('shopSlug', '==', shopSlug).limit(1).get();
        }
        if (!snap.empty) {
          await snap.docs[0].ref.update({
            appBuildStatus: 'failed',
            appBuildError: err.message || err.toString(),
            appBuildUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (_) {}
    }
    process.exit(1);
  });
