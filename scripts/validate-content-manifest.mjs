#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const RULES = Object.freeze({
  categories: [
    'official',
    'SRD-derived',
    'original',
    'custom',
    'user-authored',
    'third-party',
    'unknown',
  ],
  contentTypes: [
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
  ],
  releaseStatuses: ['allowed', 'review-required', 'blocked'],
  reviewStatuses: ['unreviewed', 'reviewed', 'needs-legal-review', 'rejected'],
  requiredEntryFields: [
    'id',
    'title',
    'category',
    'contentType',
    'source',
    'sourceUrl',
    'license',
    'licenseUrl',
    'attributionRequired',
    'attributionText',
    'noticeRef',
    'releaseStatus',
    'reviewStatus',
    'notes',
  ],
  optionalEntryFields: ['files', 'references'],
});

const defaultOptions = {
  manifestPath: 'content/manifest.json',
  schemaPath: 'content/manifest.schema.json',
  contentRoot: 'content',
  publicRoot: 'public',
  checklistPath: 'docs/release/content-release-checklist.json',
  mode: 'development',
  evidencePath: null,
};

const diagnostic = (severity, code, location, message, remediation) => ({
  severity,
  code,
  location,
  message,
  remediation,
});

const rel = (path) => relative(process.cwd(), path) || path;

const readJson = async (path) => {
  try {
    return { value: JSON.parse(await readFile(path, 'utf8')) };
  } catch (error) {
    return { error };
  }
};

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const asArray = (value) => (Array.isArray(value) ? value : []);

const validateSchemaShape = (schema, schemaPath) => {
  const errors = [];
  const entry = schema?.$defs?.entry;
  const required = entry?.required;
  const categoryEnum = entry?.properties?.category?.enum;
  const contentTypeEnum = entry?.properties?.contentType?.enum;
  const releaseEnum = entry?.properties?.releaseStatus?.enum;
  const reviewEnum = entry?.properties?.reviewStatus?.enum;
  for (const [name, actual, expected] of [
    ['entry.required', required, RULES.requiredEntryFields],
    ['category enum', categoryEnum, RULES.categories],
    ['contentType enum', contentTypeEnum, RULES.contentTypes],
    ['releaseStatus enum', releaseEnum, RULES.releaseStatuses],
    ['reviewStatus enum', reviewEnum, RULES.reviewStatuses],
  ]) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      errors.push(
        diagnostic(
          'error',
          'SCHEMA_RULE_DRIFT',
          schemaPath,
          `${name} in schema does not match centralized validator rules.`,
          'Update content/manifest.schema.json and scripts/validate-content-manifest.mjs together.',
        ),
      );
    }
  }
  return errors;
};

const validateManifestShape = (manifest, manifestPath) => {
  const errors = [];
  if (!isObject(manifest)) {
    return [
      diagnostic(
        'error',
        'SCHEMA_INVALID',
        manifestPath,
        'Manifest must be a JSON object.',
        'Use the documented manifest object shape.',
      ),
    ];
  }
  for (const field of ['schemaVersion', 'generatedFor', 'lastReviewedAt', 'entries']) {
    if (!(field in manifest))
      errors.push(
        diagnostic(
          'error',
          'SCHEMA_MISSING_FIELD',
          manifestPath,
          `Top-level field "${field}" is required.`,
          `Add "${field}" to the manifest.`,
        ),
      );
  }
  if (manifest.generatedFor !== 'Ironsworn Digital Companion')
    errors.push(
      diagnostic(
        'error',
        'SCHEMA_INVALID_VALUE',
        manifestPath,
        'generatedFor must be "Ironsworn Digital Companion".',
        'Use the documented generatedFor value.',
      ),
    );
  if (!Array.isArray(manifest.entries))
    errors.push(
      diagnostic(
        'error',
        'SCHEMA_INVALID_TYPE',
        `${manifestPath}#/entries`,
        'entries must be an array.',
        'Replace entries with an array of content records.',
      ),
    );
  const topAllowed = new Set([
    '$schema',
    'schemaVersion',
    'generatedFor',
    'lastReviewedAt',
    'entries',
  ]);
  for (const key of Object.keys(manifest))
    if (!topAllowed.has(key))
      errors.push(
        diagnostic(
          'error',
          'SCHEMA_UNKNOWN_FIELD',
          manifestPath,
          `Unknown top-level field "${key}".`,
          'Remove the field or document it in the schema and validator.',
        ),
      );
  return errors;
};

const validateEntryShape = (entry, manifestPath, index) => {
  const errors = [];
  const location = `${manifestPath}#/entries/${index}`;
  if (!isObject(entry))
    return [
      diagnostic(
        'error',
        'SCHEMA_INVALID_ENTRY',
        location,
        'Entry must be an object.',
        'Replace this entry with a manifest record object.',
      ),
    ];
  const allowed = new Set([...RULES.requiredEntryFields, ...RULES.optionalEntryFields]);
  for (const field of RULES.requiredEntryFields)
    if (!(field in entry))
      errors.push(
        diagnostic(
          'error',
          'MISSING_FIELD',
          location,
          `Entry is missing required field "${field}".`,
          `Add "${field}" with reviewed provenance metadata.`,
        ),
      );
  for (const key of Object.keys(entry))
    if (!allowed.has(key))
      errors.push(
        diagnostic(
          'error',
          'UNKNOWN_FIELD',
          `${location}/${key}`,
          `Unknown entry field "${key}".`,
          'Remove the field or add it to the schema and validator.',
        ),
      );
  for (const [field, values] of [
    ['category', RULES.categories],
    ['contentType', RULES.contentTypes],
    ['releaseStatus', RULES.releaseStatuses],
    ['reviewStatus', RULES.reviewStatuses],
  ]) {
    if (field in entry && !values.includes(entry[field]))
      errors.push(
        diagnostic(
          'error',
          'UNKNOWN_ENUM',
          `${location}/${field}`,
          `Unknown ${field} "${entry[field]}".`,
          `Use one of: ${values.join(', ')}.`,
        ),
      );
  }
  if ('id' in entry && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id))
    errors.push(
      diagnostic(
        'error',
        'INVALID_ID',
        `${location}/id`,
        'Entry id must be stable lowercase kebab-case.',
        'Use lowercase words separated by single hyphens.',
      ),
    );
  for (const field of ['title', 'source', 'license'])
    if (field in entry && !hasText(entry[field]))
      errors.push(
        diagnostic(
          'error',
          'EMPTY_REQUIRED_FIELD',
          `${location}/${field}`,
          `${field} must be non-empty.`,
          `Add a concise ${field} value.`,
        ),
      );
  for (const field of ['sourceUrl', 'licenseUrl', 'attributionText', 'noticeRef'])
    if (field in entry && entry[field] !== null && typeof entry[field] !== 'string')
      errors.push(
        diagnostic(
          'error',
          'INVALID_NULLABLE_STRING',
          `${location}/${field}`,
          `${field} must be a string or null.`,
          `Use a string value or null.`,
        ),
      );
  if ('attributionRequired' in entry && typeof entry.attributionRequired !== 'boolean')
    errors.push(
      diagnostic(
        'error',
        'INVALID_BOOLEAN',
        `${location}/attributionRequired`,
        'attributionRequired must be boolean.',
        'Use true or false.',
      ),
    );
  return errors;
};

const collectJsonFiles = async (root) => {
  const out = [];
  if (!existsSync(root)) return out;
  const walk = async (dir) => {
    for (const ent of await readdir(dir, { withFileTypes: true })) {
      if (['node_modules', 'dist', 'coverage', '.angular'].includes(ent.name)) continue;
      const p = join(dir, ent.name);
      if (ent.isDirectory()) await walk(p);
      else if (ent.isFile() && p.endsWith('.json')) out.push(p);
    }
  };
  await walk(root);
  return out.sort();
};

const getManifestIdsFromValue = (value, ids = []) => {
  if (Array.isArray(value)) for (const item of value) getManifestIdsFromValue(item, ids);
  else if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (
        ['manifestId', 'contentManifestId', 'provenanceId'].includes(key) &&
        typeof child === 'string'
      )
        ids.push(child);
      getManifestIdsFromValue(child, ids);
    }
  }
  return ids;
};

const validateReleaseChecklist = async (checklistPath, mode) => {
  const diagnostics = [];
  const result = await readJson(checklistPath);
  if (result.error) {
    if (mode === 'release')
      diagnostics.push(
        diagnostic(
          'error',
          'MISSING_RELEASE_CHECKLIST',
          checklistPath,
          'Release checklist evidence is missing or invalid JSON.',
          'Complete docs/release/content-release-checklist.json before public release.',
        ),
      );
    return { diagnostics, checklist: null };
  }
  const checklist = result.value;
  const items = asArray(checklist.items);
  if (checklist.status !== 'approved')
    diagnostics.push(
      diagnostic(
        mode === 'release' ? 'error' : 'warning',
        'CHECKLIST_NOT_APPROVED',
        checklistPath,
        `Release checklist status is "${checklist.status ?? 'missing'}".`,
        'Set status to approved only after all content/licensing/legal-review items are complete.',
      ),
    );
  if (!hasText(checklist.approvedBy))
    diagnostics.push(
      diagnostic(
        mode === 'release' ? 'error' : 'warning',
        'CHECKLIST_MISSING_APPROVER',
        checklistPath,
        'Release checklist is missing approvedBy.',
        'Record the authorized approver or reviewer group.',
      ),
    );
  if (!hasText(checklist.approvedAt))
    diagnostics.push(
      diagnostic(
        mode === 'release' ? 'error' : 'warning',
        'CHECKLIST_MISSING_APPROVAL_DATE',
        checklistPath,
        'Release checklist is missing approvedAt.',
        'Record the approval date/time.',
      ),
    );
  for (const [index, item] of items.entries()) {
    const loc = `${checklistPath}#/items/${index}`;
    if (!item?.id || item.status !== 'complete')
      diagnostics.push(
        diagnostic(
          mode === 'release' ? 'error' : 'warning',
          'CHECKLIST_ITEM_INCOMPLETE',
          loc,
          `Checklist item "${item?.id ?? index}" is not complete.`,
          'Complete the item or remove release eligibility until it is complete.',
        ),
      );
    if (!hasText(item?.evidence))
      diagnostics.push(
        diagnostic(
          mode === 'release' ? 'error' : 'warning',
          'CHECKLIST_ITEM_MISSING_EVIDENCE',
          loc,
          `Checklist item "${item?.id ?? index}" lacks evidence.`,
          'Add public-safe evidence, such as a manifest/doc path or review note.',
        ),
      );
  }
  return { diagnostics, checklist };
};

const evidenceFor = (opts, result, manifest, checklist) => ({
  generatedAt: new Date().toISOString(),
  mode: opts.mode,
  command: `npm run validate:content${opts.mode === 'release' ? ':release' : ''}`,
  commit: process.env.GITHUB_SHA ?? null,
  ref: process.env.GITHUB_REF ?? null,
  manifest: {
    path: opts.manifestPath,
    schemaVersion: manifest?.schemaVersion ?? null,
    lastReviewedAt: manifest?.lastReviewedAt ?? null,
    entryCount: asArray(manifest?.entries).length,
    releaseStatusCounts: Object.fromEntries(
      RULES.releaseStatuses.map((status) => [
        status,
        asArray(manifest?.entries).filter((entry) => entry?.releaseStatus === status).length,
      ]),
    ),
    reviewStatusCounts: Object.fromEntries(
      RULES.reviewStatuses.map((status) => [
        status,
        asArray(manifest?.entries).filter((entry) => entry?.reviewStatus === status).length,
      ]),
    ),
    ids: asArray(manifest?.entries)
      .map((entry) => entry?.id)
      .filter(Boolean)
      .sort(),
  },
  checklist: checklist
    ? {
        path: opts.checklistPath,
        status: checklist.status ?? null,
        approvedBy: checklist.approvedBy ?? null,
        approvedAt: checklist.approvedAt ?? null,
        itemCount: asArray(checklist.items).length,
        incompleteItems: asArray(checklist.items)
          .filter((item) => item?.status !== 'complete')
          .map((item) => item?.id ?? 'unknown'),
      }
    : { path: opts.checklistPath, status: 'missing' },
  diagnostics: result.diagnostics.map(({ severity, code, location, message, remediation }) => ({
    severity,
    code,
    location,
    message,
    remediation,
  })),
});

export const validateContentProvenance = async (options = {}) => {
  const opts = { ...defaultOptions, ...options };
  const manifestPath = opts.manifestPath;
  const schemaPath = opts.schemaPath;
  const diagnostics = [];
  const schemaResult = await readJson(schemaPath);
  if (schemaResult.error)
    diagnostics.push(
      diagnostic(
        'error',
        'SCHEMA_JSON_INVALID',
        schemaPath,
        'Manifest schema is missing or invalid JSON.',
        'Restore a valid content/manifest.schema.json.',
      ),
    );
  else diagnostics.push(...validateSchemaShape(schemaResult.value, schemaPath));
  const manifestResult = await readJson(manifestPath);
  if (manifestResult.error)
    return {
      diagnostics: [
        diagnostic(
          'error',
          'MANIFEST_JSON_INVALID',
          manifestPath,
          'Manifest is missing or invalid JSON.',
          'Restore a parseable content/manifest.json.',
        ),
      ],
    };
  const manifest = manifestResult.value;
  diagnostics.push(...validateManifestShape(manifest, manifestPath));

  const seen = new Map();
  const releaseEligible = new Set();
  const referencedFiles = new Set();
  for (const [index, entry] of asArray(manifest.entries).entries()) {
    diagnostics.push(...validateEntryShape(entry, manifestPath, index));
    if (!isObject(entry)) continue;
    const label = entry.id ? `${manifestPath}#${entry.id}` : `${manifestPath}#/entries/${index}`;
    if (entry.id) {
      if (seen.has(entry.id))
        diagnostics.push(
          diagnostic(
            'error',
            'DUPLICATE_ID',
            label,
            `Duplicate manifest id "${entry.id}" also appears at entry ${seen.get(entry.id)}.`,
            'Keep one stable record per bundled content item.',
          ),
        );
      seen.set(entry.id, index);
    }
    if (entry.releaseStatus === 'allowed') releaseEligible.add(entry.id);
    if (entry.category === 'unknown' && entry.releaseStatus === 'allowed')
      diagnostics.push(
        diagnostic(
          'error',
          'CONFLICTING_FLAGS',
          label,
          'Unknown-category content cannot be release-eligible.',
          'Set releaseStatus to review-required or complete provenance review.',
        ),
      );
    if (entry.releaseStatus === 'allowed' && entry.reviewStatus !== 'reviewed')
      diagnostics.push(
        diagnostic(
          'error',
          'UNREVIEWED_RELEASE_CONTENT',
          label,
          'Release-eligible content must be reviewed.',
          'Set reviewStatus to reviewed only after documented review, or set releaseStatus to review-required/blocked.',
        ),
      );
    if (entry.releaseStatus === 'blocked' && entry.reviewStatus === 'reviewed')
      diagnostics.push(
        diagnostic(
          'error',
          'CONFLICTING_FLAGS',
          label,
          'Blocked content cannot also be marked reviewed for release.',
          'Use rejected/needs-legal-review or change releaseStatus after review.',
        ),
      );
    if (
      entry.attributionRequired === true &&
      !hasText(entry.attributionText) &&
      !hasText(entry.noticeRef)
    )
      diagnostics.push(
        diagnostic(
          'error',
          'MISSING_ATTRIBUTION',
          label,
          'Attribution-required content lacks attributionText or noticeRef.',
          'Add public-safe attribution text or a noticeRef.',
        ),
      );
    if (entry.releaseStatus === 'review-required')
      diagnostics.push(
        diagnostic(
          'warning',
          'REVIEW_REQUIRED',
          label,
          'Entry is not release-eligible until reviewed.',
          'Complete review before referencing this record from public bundled content.',
        ),
      );
    if (entry.releaseStatus === 'blocked')
      diagnostics.push(
        diagnostic(
          'error',
          'BLOCKED_CONTENT',
          label,
          'Blocked content is present in the bundled manifest.',
          'Remove the bundled record/content or keep it out of release manifests.',
        ),
      );
    for (const file of asArray(entry.files)) {
      if (typeof file !== 'string')
        diagnostics.push(
          diagnostic(
            'error',
            'INVALID_FILE_REFERENCE',
            label,
            'files entries must be strings.',
            'Use relative file paths only.',
          ),
        );
      else {
        const filePath = resolve(dirname(manifestPath), file);
        referencedFiles.add(filePath);
        if (!existsSync(filePath))
          diagnostics.push(
            diagnostic(
              'error',
              'MISSING_FILE',
              label,
              `Referenced bundled file is missing: ${file}.`,
              'Add the file or remove/update the manifest files reference.',
            ),
          );
      }
    }
    for (const ref of asArray(entry.references))
      if (
        typeof ref === 'string' &&
        !seen.has(ref) &&
        !asArray(manifest.entries).some((candidate) => candidate?.id === ref)
      )
        diagnostics.push(
          diagnostic(
            'error',
            'UNRESOLVED_MANIFEST_REFERENCE',
            label,
            `Referenced manifest id does not exist: ${ref}.`,
            'Add the referenced manifest entry or fix the id.',
          ),
        );
  }

  const contentFiles = (await collectJsonFiles(opts.contentRoot))
    .map((p) => resolve(p))
    .filter((p) => p !== resolve(manifestPath) && p !== resolve(schemaPath));
  for (const file of contentFiles) {
    if (!referencedFiles.has(file))
      diagnostics.push(
        diagnostic(
          'error',
          'ORPHAN_CONTENT_FILE',
          rel(file),
          'Bundled content JSON is not listed in any manifest entry files array.',
          'Add the file path to the owning manifest entry or remove it from bundled content.',
        ),
      );
  }
  for (const file of await collectJsonFiles(opts.publicRoot)) {
    const parsed = await readJson(file);
    if (parsed.error) continue;
    for (const id of getManifestIdsFromValue(parsed.value)) {
      if (!seen.has(id))
        diagnostics.push(
          diagnostic(
            'error',
            'UNRESOLVED_PUBLIC_REFERENCE',
            rel(file),
            `Public bundled reference "${id}" does not resolve to a manifest entry.`,
            'Reference a stable manifest id.',
          ),
        );
      else if (!releaseEligible.has(id))
        diagnostics.push(
          diagnostic(
            'error',
            'PUBLIC_REFERENCE_NOT_RELEASE_ELIGIBLE',
            rel(file),
            `Public bundled reference "${id}" is not release-eligible.`,
            'Reference only manifest entries with releaseStatus allowed and reviewStatus reviewed.',
          ),
        );
    }
  }
  const checklistResult = await validateReleaseChecklist(opts.checklistPath, opts.mode);
  diagnostics.push(...checklistResult.diagnostics);
  const result = { diagnostics, manifest, checklist: checklistResult.checklist };
  if (opts.evidencePath) {
    const evidence = evidenceFor(opts, result, manifest, checklistResult.checklist);
    mkdirSync(dirname(opts.evidencePath), { recursive: true });
    writeFileSync(opts.evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  }
  return result;
};

export const printDiagnostics = (result) => {
  const errors = result.diagnostics.filter((d) => d.severity === 'error');
  const warnings = result.diagnostics.filter((d) => d.severity === 'warning');
  if (errors.length === 0 && warnings.length === 0) {
    console.log('Content provenance validation passed with 0 errors and 0 warnings.');
    return;
  }
  console.error(
    `Content provenance validation found ${errors.length} error(s) and ${warnings.length} warning(s).`,
  );
  for (const d of result.diagnostics)
    console.error(
      `[${d.severity.toUpperCase()}] ${d.code} ${d.location}: ${d.message} Remediation: ${d.remediation}`,
    );
};

const parseArgs = (argv) => {
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--manifest') opts.manifestPath = argv[++i];
    else if (key === '--schema') opts.schemaPath = argv[++i];
    else if (key === '--content-root') opts.contentRoot = argv[++i];
    else if (key === '--public-root') opts.publicRoot = argv[++i];
    else if (key === '--checklist') opts.checklistPath = argv[++i];
    else if (key === '--mode') opts.mode = argv[++i];
    else if (key === '--evidence') opts.evidencePath = argv[++i];
  }
  return opts;
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await validateContentProvenance(parseArgs(process.argv.slice(2)));
  printDiagnostics(result);
  if (
    !['development', 'release'].includes(parseArgs(process.argv.slice(2)).mode ?? 'development')
  ) {
    console.error('Invalid --mode. Use development or release.');
    process.exit(1);
  }
  process.exit(result.diagnostics.some((d) => d.severity === 'error') ? 1 : 0);
}
