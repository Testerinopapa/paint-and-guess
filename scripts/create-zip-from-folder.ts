// scripts/create-zip-from-folder.ts
import JSZip from 'jszip';
import * as fs from 'fs';
import * as path from 'path';

const SOURCE_DIR = path.join(process.cwd(), 'public/assets/characters/Character');
const OUTPUT_ZIP = path.join(process.cwd(), 'public/assets/characters/Character.zip');

async function createZipFromFolder() {
  const zip = new JSZip();
  
  function addFiles(dir: string, zipPath: string = '') {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const relativePath = zipPath ? `${zipPath}/${file}` : file;
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        addFiles(fullPath, relativePath);
      } else {
        zip.file(relativePath, fs.readFileSync(fullPath));
      }
    }
  }
  
  addFiles(SOURCE_DIR);
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(OUTPUT_ZIP, zipBuffer);
  console.log(`✅ Created ${OUTPUT_ZIP}`);
}

createZipFromFolder();