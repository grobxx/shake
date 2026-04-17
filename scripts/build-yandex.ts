import AdmZip from 'adm-zip';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

console.log('Building Vite project...');
execSync('npx vite build', { stdio: 'inherit' });

console.log('Creating ZIP archive for Yandex Games...');
const zip = new AdmZip();

// Add the dist folder contents to the root of the ZIP
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  for (const file of files) {
    const fullPath = path.join(distPath, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      zip.addLocalFolder(fullPath, file);
    } else {
      zip.addLocalFile(fullPath);
    }
  }

  const zipPath = path.resolve(process.cwd(), 'yandex-neon-snake.zip');
  zip.writeZip(zipPath);
  console.log(`\nSuccess! Created ${zipPath}`);
  console.log('You can download this file from the AI Studio File Explorer.');
} else {
  console.error("Error: 'dist' folder not found. Build may have failed.");
}
