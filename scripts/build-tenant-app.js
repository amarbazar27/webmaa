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
const packageName = `com.bdretailers.${packageNameSlug}`;

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
  let shopName = "BDRetailers Store";
  let targetUrl = `https://bdretailers.com/${shopSlug}`;
  let primaryColor = "#9333ea";
  let logoUrl = null;
  let customDomain = null;

  if (db && !isDryRun) {
    try {
      console.log(`🔍 Fetching shop document from Firestore for: ${shopSlug}...`);
      let snap = await db.collection('shops').where('subdomainSlug', '==', shopSlug).limit(1).get();
      if (snap.empty) {
        snap = await db.collection('shops').where('shopSlug', '==', shopSlug).limit(1).get();
      }

      if (!snap.empty) {
        const shopData = snap.docs[0].data();
        shopName = shopData.shopName || shopName;
        primaryColor = shopData.designOverrides?.primaryColor || primaryColor;
        logoUrl = shopData.logoUrl || null;
        customDomain = shopData.customDomain || null;
        
        if (customDomain && shopData.domainStatus === 'active') {
          targetUrl = `https://${customDomain}`;
        } else {
          targetUrl = `https://bdretailers.com/${shopSlug}`;
        }
        console.log(`✅ Loaded shop metadata: ${shopName} | Color: ${primaryColor} | Domain: ${targetUrl}`);
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

  // 3. Download Logo Icon
  const iconDest = path.join(appWorkspace, 'assets/icon.png');
  if (logoUrl) {
    try {
      console.log(`📥 Downloading branding logo from: ${logoUrl}`);
      await downloadFile(logoUrl, iconDest);
      console.log(`✅ Logo saved to: ${iconDest}`);
    } catch (err) {
      console.error(`❌ Failed to download logo: ${err.message}. Using default placeholder.`);
    }
  }

  // 4. Overwrite Config files
  console.log('✍️ Overwriting template files with branding parameters...');
  
  // A. lib/config.dart
  const configDartPath = path.join(appWorkspace, 'lib/config.dart');
  const configContent = `class AppConfig {
  static const String appName = "${shopName.replace(/"/g, '\\"').trim()}";
  static const String targetUrl = "${targetUrl.trim()}";
  static const String primaryColorHex = "${primaryColor.trim()}";
  static const String shopId = "${shopSlug.trim()}";
}
`;
  fs.writeFileSync(configDartPath, configContent);
  console.log('  └─ lib/config.dart configured.');

  // B. pubspec.yaml (replace app name)
  const pubspecPath = path.join(appWorkspace, 'pubspec.yaml');
  let pubspecContent = fs.readFileSync(pubspecPath, 'utf8');
  pubspecContent = pubspecContent.replace('name: bdretailers_white_label_app', `name: bdretailers_${sanitizedSlug}`);
  pubspecContent = pubspecContent.replace('description: "BDRetailers multi-tenant e-commerce mobile webview app wrapper"', `description: "BDRetailers App wrapper for ${shopName}"`);
  fs.writeFileSync(pubspecPath, pubspecContent);
  console.log('  └─ pubspec.yaml configured.');

  // C. android/app/build.gradle (replace namespace AND applicationId)
  const buildGradlePath = path.join(appWorkspace, 'android/app/build.gradle');
  let buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
  buildGradleContent = buildGradleContent.replace('namespace "com.bdretailers.template"', `namespace "${packageName}"`);
  buildGradleContent = buildGradleContent.replace('applicationId "com.bdretailers.template"', `applicationId "${packageName}"`);
  fs.writeFileSync(buildGradlePath, buildGradleContent);
  console.log('  └─ android/app/build.gradle configured.');

  // C2. android/app/google-services.json — write complete valid JSON
  // Ensures Firebase SDK doesn't crash due to package_name/mobilesdk_app_id mismatch
  const googleServicesPath = path.join(appWorkspace, 'android/app/google-services.json');
  const googleServicesContent = JSON.stringify({
    project_info: {
      project_number: '156216219253',
      project_id: 'webmaa-app',
      storage_bucket: 'webmaa-app.firebasestorage.app'
    },
    client: [
      {
        client_info: {
          mobilesdk_app_id: '1:156216219253:android:8fec080019c45244d0ca3c',
          android_client_info: { package_name: packageName }
        },
        oauth_client: [],
        api_key: [{ current_key: 'AIzaSyAMMzATvPWghOT8islcllFz9hXlCJ6HdFk' }],
        services: { appinvite_service: { other_platform_oauth_client: [] } }
      }
    ],
    configuration_version: '3'
  }, null, 2);
  fs.writeFileSync(googleServicesPath, googleServicesContent);
  console.log('  └─ android/app/google-services.json configured.');

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
  const newKotlinDir = path.join(appWorkspace, `android/app/src/main/kotlin/com/bdretailers/${packageNameSlug}`);
  
  fs.mkdirSync(newKotlinDir, { recursive: true });
  const newKotlinPath = path.join(newKotlinDir, 'MainActivity.kt');
  
  const mainActivityContent = `package com.bdretailers.${packageNameSlug}
 
import io.flutter.embedding.android.FlutterActivity
 
class MainActivity: FlutterActivity() {
}
`;
  fs.writeFileSync(newKotlinPath, mainActivityContent);
  
  // Remove the old template MainActivity
  if (fs.existsSync(oldKotlinPath)) {
    fs.unlinkSync(oldKotlinPath);
  }
  console.log('  └─ Kotlin folder restructured.');

  // F. Generate Play Store Assets (Submission Package)
  console.log('🖨️ Generating Play Console Launch Checklist Package...');
  const assetsOutDir = path.join(tempBuildDir, 'play_store_assets');
  fs.mkdirSync(assetsOutDir, { recursive: true });

  const metadataJson = {
    packageName,
    appName: shopName,
    shortDescription: `Official Android App for ${shopName}. Shop online with fast delivery, reviews, and secure checkout.`,
    longDescription: `Welcome to the official ${shopName} Android mobile application!\n\nBrowse through our extensive catalog of products, manage your cart, apply coupon discounts, track your orders in real-time, and check out securely.\n\nKey App Features:\n- Full access to the catalog and product variants\n- Real-time notifications and alerts\n- Seamless digital and cash-on-delivery payments\n- Dynamic support chats\n- Offline caching and performance optimization\n\nDownload the ${shopName} app today and enjoy a premium e-commerce experience!`,
    privacyPolicyUrl: `${targetUrl}/privacy-policy`,
    contactEmail: `support@bdretailers.com`,
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
  const buildApk = spawnSync('flutter', ['build', 'apk', '--release'], { cwd: appWorkspace, shell: true });
  if (buildApk.status !== 0) {
    throw new Error(`APK build failed: ${buildApk.stderr?.toString() || buildApk.stdout?.toString()}`);
  }
  console.log('  └─ Compiled APK successfully.');

  console.log('  └─ Compiling Release App Bundle (AAB)...');
  const buildAab = spawnSync('flutter', ['build', 'appbundle', '--release'], { cwd: appWorkspace, shell: true });
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
  };
}

// Execute wrapper
build()
  .then(async (result) => {
    console.log('🏆 App Build Completed Successfully.');
    
    // Update build record in Firestore if available
    if (db && !isDryRun) {
      try {
        console.log(`💾 Updating Firestore build status for ${shopSlug}...`);
        const shopQuery = await db.collection('shops').where('subdomainSlug', '==', shopSlug).limit(1).get();
        if (!shopQuery.empty) {
          const shopId = shopQuery.docs[0].id;
          await db.collection('shops').doc(shopId).update({
            appBuildStatus: 'completed',
            appBuildApkUrl: result.apkUrl,
            appBuildAabUrl: result.aabUrl,
            appBuildPackageName: packageName,
            appBuildUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            appBuildError: null
          });
          console.log('✅ Firestore updated successfully.');
        }
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
        const shopQuery = await db.collection('shops').where('subdomainSlug', '==', shopSlug).limit(1).get();
        if (!shopQuery.empty) {
          const shopId = shopQuery.docs[0].id;
          await db.collection('shops').doc(shopId).update({
            appBuildStatus: 'failed',
            appBuildError: err.message || err.toString(),
            appBuildUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (_) {}
    }
    process.exit(1);
  });
