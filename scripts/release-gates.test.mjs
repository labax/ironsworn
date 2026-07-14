import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const workflow = async (path) => readFile(path, 'utf8');
const releaseWorkflows = ['.github/workflows/deploy-uat-pages.yml', '.github/workflows/static.yml'];

describe('release workflow content gates', () => {
  it('uses the same canonical content validation command in package scripts', async () => {
    const pkg = JSON.parse(await readFile('package.json', 'utf8'));
    expect(pkg.scripts['validate:content']).toContain('scripts/validate-content-manifest.mjs');
    expect(pkg.scripts['validate:content:release']).toContain(
      'scripts/validate-content-manifest.mjs',
    );
    expect(pkg.scripts['validate:content:release']).toContain('--mode release');
    expect(pkg.scripts['validate:content:release']).toContain('--evidence');
  });

  it('runs the canonical gate in pull-request CI', async () => {
    const ci = await workflow('.github/workflows/ci.yml');
    expect(ci).toContain('pull_request:');
    expect(ci).toContain('npm run validate:content');
  });

  it('orders every public artifact upload after the release gate and retains evidence', async () => {
    for (const path of releaseWorkflows) {
      const yml = await workflow(path);
      const gate = yml.indexOf('npm run validate:content:release');
      const build = yml.indexOf('npm run build:uat');
      const evidence = yml.indexOf('content-provenance-release-evidence');
      const pages = yml.indexOf('actions/upload-pages-artifact');
      expect(gate, path).toBeGreaterThan(-1);
      expect(build, path).toBeGreaterThan(gate);
      expect(evidence, path).toBeGreaterThan(gate);
      expect(pages, path).toBeGreaterThan(gate);
      expect(yml).toContain('permissions:\n  contents: read\n  pages: write\n  id-token: write');
      expect(yml).not.toMatch(/continue-on-error:\s*true/);
    }
  });
});
