import { copyFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const outputPath = process.argv[2];

if (!outputPath) {
  console.error('Usage: node scripts/copy-spa-fallback.mjs <build-output-path>');
  process.exit(1);
}

const indexPath = join(outputPath, 'index.html');
const fallbackPath = join(outputPath, '404.html');

try {
  await stat(indexPath);
  await copyFile(indexPath, fallbackPath);
  console.log(`Copied ${indexPath} to ${fallbackPath} for GitHub Pages SPA routing fallback.`);
} catch (error) {
  console.error(`Unable to create SPA fallback from ${indexPath}:`);
  console.error(error);
  process.exit(1);
}
