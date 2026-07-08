#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const manifestPath = 'content/manifest.json';
const allowedCategories = new Set([
  'official',
  'SRD-derived',
  'original',
  'custom',
  'user-authored',
  'third-party',
  'unknown',
]);
const allowedContentTypes = new Set([
  'app-helper-text',
  'oracle-table',
  'oracle-entry',
  'move-metadata',
  'move-text',
  'asset-reference',
  'asset-text',
  'rules-summary',
  'ui-label',
  'notice',
  'third-party-asset',
  'test-fixture',
  'other',
]);
const allowedReleaseStatuses = new Set(['allowed', 'review-required', 'blocked']);
const allowedReviewStatuses = new Set(['unreviewed', 'reviewed', 'needs-legal-review', 'rejected']);
const requiredEntryFields = [
  'id',
  'title',
  'category',
  'contentType',
  'source',
  'license',
  'attributionRequired',
  'releaseStatus',
  'reviewStatus',
];

const errors = [];
const raw = await readFile(manifestPath, 'utf8');
let manifest;

try {
  manifest = JSON.parse(raw);
} catch (error) {
  console.error(`${manifestPath} is not valid JSON.`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

if (!manifest.schemaVersion) {
  errors.push('Top-level schemaVersion is required.');
}

if (!Array.isArray(manifest.entries)) {
  errors.push('Top-level entries must be an array.');
}

const seenIds = new Set();
for (const [index, entry] of (manifest.entries ?? []).entries()) {
  const label = entry?.id ? `entry "${entry.id}"` : `entry at index ${index}`;

  for (const field of requiredEntryFields) {
    if (!(field in entry)) {
      errors.push(`${label} is missing required field: ${field}.`);
    }
  }

  if (entry.id) {
    if (seenIds.has(entry.id)) {
      errors.push(`${label} has a duplicate id.`);
    }
    seenIds.add(entry.id);
  }

  if (!allowedCategories.has(entry.category)) {
    errors.push(`${label} has unsupported category: ${entry.category}.`);
  }

  if (!allowedContentTypes.has(entry.contentType)) {
    errors.push(`${label} has unsupported contentType: ${entry.contentType}.`);
  }

  if (!allowedReleaseStatuses.has(entry.releaseStatus)) {
    errors.push(`${label} has unsupported releaseStatus: ${entry.releaseStatus}.`);
  }

  if (!allowedReviewStatuses.has(entry.reviewStatus)) {
    errors.push(`${label} has unsupported reviewStatus: ${entry.reviewStatus}.`);
  }

  if (entry.category === 'unknown' && entry.releaseStatus === 'allowed') {
    errors.push(`${label} cannot be release-allowed while category is unknown.`);
  }

  if (entry.releaseStatus === 'allowed' && entry.reviewStatus !== 'reviewed') {
    errors.push(`${label} cannot be allowed unless reviewStatus is reviewed.`);
  }

  if (entry.releaseStatus === 'blocked' && entry.reviewStatus === 'reviewed') {
    errors.push(`${label} cannot be blocked and reviewed; use rejected or needs-legal-review.`);
  }

  if (entry.attributionRequired === true && !entry.attributionText && !entry.noticeRef) {
    errors.push(`${label} requires attributionText or noticeRef when attributionRequired is true.`);
  }
}

if (errors.length > 0) {
  console.error('Content manifest validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`${manifestPath} is valid JSON and passed provenance checks.`);
