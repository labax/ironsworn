#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { glob } from 'node:fs/promises';

const patterns = ['content/**/*.json', 'public/**/*.json'];
const excludedSegments = new Set(['node_modules', 'dist', 'coverage', '.angular']);
const files = new Set();

for (const pattern of patterns) {
  for await (const path of glob(pattern, {
    exclude: (path) => path.split('/').some((segment) => excludedSegments.has(segment)),
  })) {
    files.add(path);
  }
}

const sortedFiles = [...files].sort();

if (sortedFiles.length === 0) {
  console.log('No content JSON files found to validate.');
  process.exit(0);
}

let hasError = false;

for (const file of sortedFiles) {
  try {
    const raw = await readFile(file, 'utf8');
    JSON.parse(raw);
    console.log(`Valid JSON: ${relative(process.cwd(), file)}`);
  } catch (error) {
    hasError = true;
    console.error(`Invalid JSON: ${relative(process.cwd(), file)}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

if (hasError) {
  process.exit(1);
}
