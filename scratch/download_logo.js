import https from 'https';
import fs from 'fs';
import path from 'path';

const logoUrl = 'https://res.cloudinary.com/dcsecgwzc/image/upload/v1780614959/waigdiljn3ecsjovd4hu.png';
const targets = [
  'logo.png',
  'favicon.ico',
  'favicon-32x32.png',
  'favicon-16x16.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png'
];

function download(url, filePath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (Status Code: ${res.statusCode})`));
        return;
      }
      const fileStream = fs.createWriteStream(filePath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded and saved to ${filePath}`);
        resolve();
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  try {
    for (const target of targets) {
      const targetPath = path.resolve(process.cwd(), 'public', target);
      await download(logoUrl, targetPath);
    }
    console.log('All static logos and icons updated successfully!');
  } catch (err) {
    console.error('Error during download:', err);
  }
}

run();
