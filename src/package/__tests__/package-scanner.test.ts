import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { PackageScanner } from '../package-scanner.js';
import { LoadErrorCode } from '../../model/index.js';

const PACKAGES = join(__dirname, '..', '..', '__tests__', 'fixtures', 'packages');

describe('PackageScanner', () => {
  const scanner = new PackageScanner();

  describe('basic scanning', () => {
    it('should find packages with package.json in direct subdirectories', () => {
      const result = scanner.scan(PACKAGES);
      const names = result.packages.map(p => p.name);
      expect(names).toContain('hl7.fhir.r4.core');
      expect(names).toContain('hl7.fhir.us.core');
      expect(names).toContain('custom-ig');
    });

    it('should parse package manifest fields correctly', () => {
      const result = scanner.scan(PACKAGES);
      const r4 = result.packages.find(p => p.name === 'hl7.fhir.r4.core');
      expect(r4).toBeDefined();
      expect(r4!.version).toBe('4.0.1');
      expect(r4!.dependencies).toEqual({});
    });

    it('should parse dependencies from manifest', () => {
      const result = scanner.scan(PACKAGES);
      const usCore = result.packages.find(p => p.name === 'hl7.fhir.us.core');
      expect(usCore).toBeDefined();
      expect(usCore!.dependencies).toEqual({ 'hl7.fhir.r4.core': '4.0.1' });
    });

    it('should set path correctly for each package', () => {
      const result = scanner.scan(PACKAGES);
      const r4 = result.packages.find(p => p.name === 'hl7.fhir.r4.core');
      expect(r4!.path).toBe(join(PACKAGES, 'hl7.fhir.r4.core'));
    });
  });

  describe('recursive scanning', () => {
    it('should find nested packages with recursive=true (default)', () => {
      const result = scanner.scan(PACKAGES);
      const names = result.packages.map(p => p.name);
      expect(names).toContain('nested-pkg');
    });

    it('should find nested packages at depth > 1', () => {
      const result = scanner.scan(PACKAGES, { recursive: true });
      const nested = result.packages.find(p => p.name === 'nested-pkg');
      expect(nested).toBeDefined();
      expect(nested!.path).toContain('nested');
    });

    it('should respect maxDepth limit', () => {
      // nested-pkg is at depth 3 (packages/nested/r4/nested-pkg)
      const shallow = scanner.scan(PACKAGES, { maxDepth: 1 });
      const names = shallow.packages.map(p => p.name);
      expect(names).not.toContain('nested-pkg');
    });

    it('should find nested packages within maxDepth', () => {
      // nested-pkg is at depth 3
      const deep = scanner.scan(PACKAGES, { maxDepth: 3 });
      const names = deep.packages.map(p => p.name);
      expect(names).toContain('nested-pkg');
    });
  });

  describe('error handling', () => {
    it('should report INVALID_MANIFEST for package.json without name/version', () => {
      const result = scanner.scan(PACKAGES);
      const invalidErrors = result.errors.filter(e => e.code === LoadErrorCode.INVALID_MANIFEST);
      expect(invalidErrors.length).toBeGreaterThanOrEqual(1);
    });

    it('should skip directories without package.json (no-manifest)', () => {
      const result = scanner.scan(PACKAGES);
      const names = result.packages.map(p => p.name);
      // no-manifest has no package.json, so it should not appear
      expect(names).not.toContain('no-manifest');
    });

    it('should return FILE_NOT_FOUND for nonexistent root', () => {
      const result = scanner.scan('/definitely/not/a/real/path');
      expect(result.packages).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it('should never throw (no-throw contract)', () => {
      expect(() => scanner.scan('')).not.toThrow();
      expect(() => scanner.scan('/nonexistent')).not.toThrow();
    });
  });

  describe('non-recursive mode', () => {
    it('should only scan direct subdirectories with recursive=false', () => {
      const result = scanner.scan(PACKAGES, { recursive: false });
      const names = result.packages.map(p => p.name);
      // Direct children should be found
      expect(names).toContain('hl7.fhir.r4.core');
      // Nested should NOT be found
      expect(names).not.toContain('nested-pkg');
    });
  });
});
