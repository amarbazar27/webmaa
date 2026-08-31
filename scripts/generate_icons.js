const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcImagePath = 'C:/Users/missi/.gemini/antigravity/brain/23016c15-3d70-4575-a51c-2717c3210974/.user_uploaded/media_1788143018185.jpg';

async function processIcons() {
  console.log('Reading source image:', srcImagePath);
  if (!fs.existsSync(srcImagePath)) {
    throw new Error('Source image not found: ' + srcImagePath);
  }

  const publicDir = path.join(__dirname, '../public');
  const flutterIconPath = path.join(__dirname, '../flutter_app_template/assets/icon.png');

  // 1. Generate 512x512 logo.png
  console.log('Generating public/logo.png...');
  await sharp(srcImagePath)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'logo.png'));

  // 2. Generate 32x32 favicon.ico (as PNG formatted as favicon.ico or 32x32)
  console.log('Generating public/favicon.ico and pngs...');
  await sharp(srcImagePath)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  await sharp(srcImagePath)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toFormat('png')
    .toFile(path.join(publicDir, 'favicon.ico'));

  // 3. Generate 16x16 favicon-16x16.png
  await sharp(srcImagePath)
    .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));

  // 4. Generate 180x180 apple-touch-icon.png
  await sharp(srcImagePath)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 5. Generate 192x192 & 512x512 chrome icons
  await sharp(srcImagePath)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'android-chrome-192x192.png'));

  await sharp(srcImagePath)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'android-chrome-512x512.png'));

  // 6. Generate Flutter App Icon
  console.log('Generating flutter_app_template/assets/icon.png...');
  await sharp(srcImagePath)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(flutterIconPath);

  console.log('✅ All favicon, logo, and app icon assets generated successfully!');
}

processIcons().catch(console.error);
