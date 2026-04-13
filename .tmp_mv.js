const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, 'temp_next');
const dest = __dirname;

function moveFolderSync(src, dest) {
    if (!fs.existsSync(src)) return;
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        if (entry.name === '.git') continue; 
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath);
            }
            moveFolderSync(srcPath, destPath);
        } else {
            if (entry.name === '.gitignore' && fs.existsSync(destPath)) {
                const existing = fs.readFileSync(destPath, 'utf8');
                const newIgnore = fs.readFileSync(srcPath, 'utf8');
                fs.writeFileSync(destPath, existing + '\n' + newIgnore);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
}

try {
    moveFolderSync(source, dest);
    console.log('Moved files successfully');
    fs.rmSync(source, { recursive: true, force: true });
    console.log('Cleaned up temp_next folder');
} catch (e) {
    console.error('Error during move:', e);
}
