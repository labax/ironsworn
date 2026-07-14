import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { RULES, validateContentProvenance } from './validate-content-manifest.mjs';

const schema = () => ({
  $defs: {
    entry: {
      required: RULES.requiredEntryFields,
      properties: {
        category: { enum: RULES.categories },
        contentType: { enum: RULES.contentTypes },
        releaseStatus: { enum: RULES.releaseStatuses },
        reviewStatus: { enum: RULES.reviewStatuses },
      },
    },
  },
});

const entry = (overrides = {}) => ({
  id: 'original-helper',
  title: 'Original helper',
  category: 'original',
  contentType: 'app-helper-text',
  source: 'project-original',
  sourceUrl: null,
  license: 'project-content-license',
  licenseUrl: null,
  attributionRequired: false,
  attributionText: null,
  noticeRef: null,
  releaseStatus: 'allowed',
  reviewStatus: 'reviewed',
  notes: 'Project-original fixture metadata only.',
  ...overrides,
});

const checklist = (overrides = {}) => ({
  status: 'approved',
  approvedBy: 'reviewers',
  approvedAt: '2026-07-14T00:00:00Z',
  items: [{ id: 'review', status: 'complete', evidence: 'public-safe evidence path' }],
  ...overrides,
});

const workspace = async ({
  entries = [entry()],
  contentFiles = {},
  publicFiles = {},
  checklistValue,
} = {}) => {
  const root = await mkdtemp(join(tmpdir(), 'content-provenance-'));
  const content = join(root, 'content');
  const pub = join(root, 'public');
  await mkdir(content, { recursive: true });
  await mkdir(pub, { recursive: true });
  await writeFile(join(content, 'manifest.schema.json'), JSON.stringify(schema(), null, 2));
  await writeFile(
    join(content, 'manifest.json'),
    JSON.stringify(
      {
        schemaVersion: 'test',
        generatedFor: 'Ironsworn Digital Companion',
        lastReviewedAt: null,
        entries,
      },
      null,
      2,
    ),
  );
  for (const [name, value] of Object.entries(contentFiles))
    await writeFile(join(content, name), JSON.stringify(value));
  for (const [name, value] of Object.entries(publicFiles))
    await writeFile(join(pub, name), JSON.stringify(value));
  if (checklistValue !== undefined) {
    await mkdir(join(root, 'docs', 'release'), { recursive: true });
    await writeFile(
      join(root, 'docs', 'release', 'content-release-checklist.json'),
      JSON.stringify(checklistValue, null, 2),
    );
  }
  return {
    root,
    content,
    pub,
    manifest: join(content, 'manifest.json'),
    schema: join(content, 'manifest.schema.json'),
  };
};

const codes = async (config) => {
  const w = await workspace(config);
  const result = await validateContentProvenance({
    manifestPath: w.manifest,
    schemaPath: w.schema,
    contentRoot: w.content,
    publicRoot: w.pub,
    checklistPath: join(w.root, 'docs', 'release', 'content-release-checklist.json'),
  });
  return result.diagnostics.map((d) => d.code);
};

describe('content provenance validator', () => {
  it('passes a valid manifest and release-eligible public reference', async () => {
    expect(
      await codes({ publicFiles: { 'bundle.json': { manifestId: 'original-helper' } } }),
    ).toEqual([]);
  });

  it('reports blocking missing fields, duplicate ids, unknown enums, conflicts, blocked and unreviewed release content', async () => {
    const bad = entry({
      category: 'mystery',
      releaseStatus: 'allowed',
      reviewStatus: 'unreviewed',
    });
    delete bad.license;
    expect(await codes({ entries: [bad, entry()] })).toEqual(
      expect.arrayContaining([
        'MISSING_FIELD',
        'DUPLICATE_ID',
        'UNKNOWN_ENUM',
        'UNREVIEWED_RELEASE_CONTENT',
      ]),
    );
    expect(
      await codes({ entries: [entry({ releaseStatus: 'blocked', reviewStatus: 'reviewed' })] }),
    ).toEqual(expect.arrayContaining(['CONFLICTING_FLAGS', 'BLOCKED_CONTENT']));
    expect(await codes({ entries: [entry({ category: 'unknown' })] })).toContain(
      'CONFLICTING_FLAGS',
    );
  });

  it('reports missing files, orphan content files, missing attribution, and unresolved manifest references', async () => {
    expect(
      await codes({
        entries: [
          entry({ files: ['missing.json'], references: ['missing-id'], attributionRequired: true }),
        ],
        contentFiles: { 'orphan.json': { manifestId: 'original-helper' } },
      }),
    ).toEqual(
      expect.arrayContaining([
        'MISSING_FILE',
        'ORPHAN_CONTENT_FILE',
        'MISSING_ATTRIBUTION',
        'UNRESOLVED_MANIFEST_REFERENCE',
      ]),
    );
  });

  it('reports unresolved and non-release-eligible public references', async () => {
    expect(
      await codes({ publicFiles: { 'bad.json': { items: [{ manifestId: 'missing-id' }] } } }),
    ).toContain('UNRESOLVED_PUBLIC_REFERENCE');
    expect(
      await codes({
        entries: [entry({ releaseStatus: 'review-required' })],
        publicFiles: { 'bad.json': { manifestId: 'original-helper' } },
      }),
    ).toEqual(expect.arrayContaining(['REVIEW_REQUIRED', 'PUBLIC_REFERENCE_NOT_RELEASE_ELIGIBLE']));
  });

  it('keeps warning-only diagnostics non-blocking', async () => {
    expect(
      await codes({
        entries: [entry({ releaseStatus: 'review-required', reviewStatus: 'needs-legal-review' })],
      }),
    ).toEqual(['REVIEW_REQUIRED']);
  });

  it('passes release mode with an approved checklist and writes privacy-safe evidence', async () => {
    const w = await workspace({
      checklistValue: checklist(),
      publicFiles: {
        'bundle.json': { manifestId: 'original-helper', body: 'SECRET BODY MUST NOT PRINT' },
      },
    });
    const evidence = join(w.root, 'evidence', 'content-provenance-evidence.json');
    const result = await validateContentProvenance({
      manifestPath: w.manifest,
      schemaPath: w.schema,
      contentRoot: w.content,
      publicRoot: w.pub,
      checklistPath: join(w.root, 'docs', 'release', 'content-release-checklist.json'),
      mode: 'release',
      evidencePath: evidence,
    });
    expect(result.diagnostics).toEqual([]);
    const text = await readFile(evidence, 'utf8');
    expect(text).toContain('original-helper');
    expect(text).toContain('approved');
    expect(text).not.toContain('SECRET BODY MUST NOT PRINT');
  });

  it('fails release mode for missing or incomplete checklist evidence', async () => {
    const missing = await workspace();
    const missingResult = await validateContentProvenance({
      manifestPath: missing.manifest,
      schemaPath: missing.schema,
      contentRoot: missing.content,
      publicRoot: missing.pub,
      checklistPath: join(missing.root, 'docs', 'release', 'content-release-checklist.json'),
      mode: 'release',
    });
    expect(missingResult.diagnostics.map((d) => d.code)).toContain('MISSING_RELEASE_CHECKLIST');
    const incomplete = await codes({
      checklistValue: checklist({
        status: 'pending',
        approvedBy: '',
        items: [{ id: 'review', status: 'todo', evidence: '' }],
      }),
    });
    expect(incomplete).toEqual(
      expect.arrayContaining([
        'CHECKLIST_NOT_APPROVED',
        'CHECKLIST_MISSING_APPROVER',
        'CHECKLIST_ITEM_INCOMPLETE',
        'CHECKLIST_ITEM_MISSING_EVIDENCE',
      ]),
    );
  });

  it('does not print protected content bodies and exits non-zero for blockers', async () => {
    const w = await workspace({
      entries: [
        entry({
          id: 'public-id',
          releaseStatus: 'review-required',
          notes: 'SECRET BODY MUST NOT PRINT',
        }),
      ],
      publicFiles: { 'bad.json': { manifestId: 'public-id', body: 'SECRET BODY MUST NOT PRINT' } },
    });
    const result = spawnSync(
      process.execPath,
      [
        './scripts/validate-content-manifest.mjs',
        '--manifest',
        w.manifest,
        '--schema',
        w.schema,
        '--content-root',
        w.content,
        '--public-root',
        w.pub,
      ],
      { cwd: process.cwd(), encoding: 'utf8' },
    );
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).not.toContain('SECRET BODY MUST NOT PRINT');
    expect(`${result.stdout}${result.stderr}`).toContain('PUBLIC_REFERENCE_NOT_RELEASE_ELIGIBLE');
  });
});
