/**
 * Build Script for Chrome Dashboard
 * 
 * This script packages the extension for distribution
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const DIST_DIR = path.join(__dirname, '../dist');
const RELEASES_DIR = path.join(__dirname, '../releases');
const MANIFEST_PATH = path.join(__dirname, '../manifest.json');

// Read version from manifest
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const version = manifest.version;

// Create releases directory if it doesn't exist
if (!fs.existsSync(RELEASES_DIR)) {
  fs.mkdirSync(RELEASES_DIR, { recursive: true });
}

// Output filename
const outputFile = path.join(RELEASES_DIR, `chrome-dashboard-v${version}.zip`);

// Create write stream
const output = fs.createWriteStream(outputFile);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`✅ Package created: ${outputFile}`);
  console.log(`📦 Total bytes: ${archive.pointer()}`);
});

archive.on('error', (err) => {
  throw err;
});

// Pipe archive to file
archive.pipe(output);

// Add files to archive
const filesToInclude = [
  'manifest.json',
  'newtab.html',
  'popup.html',
  'background.js',
  'icon128.png',
];

const dirsToInclude = [
  'src',
  'stylesheets',
];

// Add individual files
filesToInclude.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    archive.file(filePath, { name: file });
  }
});

// Add directories
dirsToInclude.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    archive.directory(dirPath, dir);
  }
});

// Finalize archive
archive.finalize();

console.log('📦 Building Chrome Dashboard package...');
console.log(`Version: ${version}`);
