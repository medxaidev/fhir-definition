import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { PackageLoader } from '../package-loader.js';
import { LoadErrorCode } from '../../model/index.js';
import type { DefinitionPackage } from '../../model/index.js';

const PACKAGES = join(__dirname, '..', '..', '__tests__', 'fixtures', 'packages');

function makePkg(name: string, subdir: string): DefinitionPackage {
  return {
    name,
    version: '1.0.0',
    path: join(PACKAGES, subdir),
    dependencies: {},
  };
}

describe('PackageLoader', () => {
  const loader = new PackageLoader();

  describe('normal loading', () => {
    it('should load definitions from r4.core package', () => {
      const pkg = makePkg('hl7.fhir.r4.core', 'hl7.fhir.r4.core');
      pkg.version = '4.0.1';
      const result = loader.loadPackage(pkg);
      expect(result.success).toBe(true);
      expect(result.resources.length).toBeGreaterThanOrEqual(5);
      expect(result.package.definitionCount).toBe(result.resources.length);
    });

    it('should load definitions from us.core package', () => {
      const pkg = makePkg('hl7.fhir.us.core', 'hl7.fhir.us.core');
      const result = loader.loadPackage(pkg);
      expect(result.success).toBe(true);
      expect(result.resources.length).toBeGreaterThanOrEqual(3);
    });

    it('should load definitions from custom-ig package', () => {
      const pkg = makePkg('custom-ig', 'custom-ig');
      const result = loader.loadPackage(pkg);
      expect(result.success).toBe(true);
      expect(result.resources.length).toBeGreaterThanOrEqual(2);
    });

    it('should set correct LoadedPackage metadata', () => {
      const pkg = makePkg('hl7.fhir.r4.core', 'hl7.fhir.r4.core');
      pkg.version = '4.0.1';
      const result = loader.loadPackage(pkg);
      expect(result.package.name).toBe('hl7.fhir.r4.core');
      expect(result.package.version).toBe('4.0.1');
      expect(result.package.loadedAt).toBeInstanceOf(Date);
    });
  });

  describe('resourceType filtering', () => {
    it('should only return StructureDefinitions when filtered', () => {
      const pkg = makePkg('hl7.fhir.r4.core', 'hl7.fhir.r4.core');
      const result = loader.loadPackage(pkg, ['StructureDefinition']);
      for (const r of result.resources) {
        expect(r.resourceType).toBe('StructureDefinition');
      }
      expect(result.resources.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty when filtering for a type not in package', () => {
      const pkg = makePkg('custom-ig', 'custom-ig');
      const result = loader.loadPackage(pkg, ['SearchParameter']);
      expect(result.resources).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should return error when package/ subdirectory is missing', () => {
      // no-manifest has a package/ dir but the parent has no package.json;
      // let's test with a non-existent path
      const pkg: DefinitionPackage = {
        name: 'missing',
        version: '1.0.0',
        path: join(PACKAGES, 'nonexistent-pkg'),
        dependencies: {},
      };
      const result = loader.loadPackage(pkg);
      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe(LoadErrorCode.FILE_NOT_FOUND);
    });

    it('should never throw (no-throw contract)', () => {
      const pkg: DefinitionPackage = {
        name: 'bad',
        version: '1.0.0',
        path: '/absolutely/nonexistent',
        dependencies: {},
      };
      expect(() => loader.loadPackage(pkg)).not.toThrow();
    });
  });
});
