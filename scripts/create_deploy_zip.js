const fs = require('fs');
const path = require('path');
const { ZipArchive } = require('archiver');

const zipPath = path.join(__dirname, '..', 'hostinger-deploy-latest.zip');
const output = fs.createWriteStream(zipPath);
const archive = new ZipArchive({ zlib: { level: 9 } });

output.on('close', function() {
  console.log(`✅ hostinger-deploy-latest.zip created successfully! Total bytes: ${archive.pointer()}`);
});

archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

const rootDir = path.join(__dirname, '..');
const exclude = new Set([
  '.git',
  '.vercel',
  'node_modules',
  'screenshots',
  'scripts',
  'hostinger-deploy-latest.zip',
  'package-lock.json'
]);

const items = fs.readdirSync(rootDir);
for (const item of items) {
  if (exclude.has(item)) continue;
  const fullPath = path.join(rootDir, item);
  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    archive.directory(fullPath, item);
  } else {
    archive.file(fullPath, { name: item });
  }
}

archive.finalize();
