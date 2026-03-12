import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { DirectoryLoader } from '../directory-loader.js';
import { LoadErrorCode } from '../../model/index.js';

const FIXTURES = join(__dirname, '..', '..', '__tests__', 'fixtures');

describe('DirectoryLoader', () => {
  const loader = new DirectoryLoader();

  describe('loading fixtures directory', () => {
    it('should load all valid FHIR definitions from fixtures', () => {
      const result = loader.loadDirectory(FIXTURES);
      // We have 15 valid FHIR JSON + 3 edge-case files (invalid, not-fhir, unsupported)
      expect(result.loadedFiles).toBeGreaterThanOrEqual(15);
      expect(result.resources.length).toBe(result.loadedFiles);
    });

    it('should report errors for invalid/non-FHIR files', () => {
      const result = loader.loadDirectory(FIXTURES);
      // invalid.json, not-fhir.json, unsupported-resource.json
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('should count total JSON files scanned', () => {
      const result = loader.loadDirectory(FIXTURES);
      // All .json files in directory
      expect(result.totalFiles).toBeGreaterThanOrEqual(18);
    });

    it('should include StructureDefinitions in resources', () => {
      const result = loader.loadDirectory(FIXTURES);
      const sds = result.resources.filter(r => r.resourceType === 'StructureDefinition');
      expect(sds.length).toBeGreaterThanOrEqual(5);
    });

    it('should include ValueSets in resources', () => {
      const result = loader.loadDirectory(FIXTURES);
      const vss = result.resources.filter(r => r.resourceType === 'ValueSet');
      expect(vss.length).toBeGreaterThanOrEqual(3);
    });

    it('should include CodeSystems in resources', () => {
      const result = loader.loadDirectory(FIXTURES);
      const css = result.resources.filter(r => r.resourceType === 'CodeSystem');
      expect(css.length).toBeGreaterThanOrEqual(3);
    });

    it('should include SearchParameters in resources', () => {
      const result = loader.loadDirectory(FIXTURES);
      const sps = result.resources.filter(r => r.resourceType === 'SearchParameter');
      expect(sps.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('error handling', () => {
    it('should return FILE_NOT_FOUND for non-existent directory', () => {
      const result = loader.loadDirectory('/definitely/not/a/real/directory');
      expect(result.success).toBe(false);
      expect(result.errors[0]?.code).toBe(LoadErrorCode.FILE_NOT_FOUND);
      expect(result.resources).toHaveLength(0);
    });

    it('should never throw (no-throw contract)', () => {
      expect(() => loader.loadDirectory('')).not.toThrow();
      expect(() => loader.loadDirectory('/nonexistent')).not.toThrow();
    });
  });

  describe('options', () => {
    it('should only scan files with specified extensions', () => {
      const result = loader.loadDirectory(FIXTURES, { extensions: ['.json'] });
      expect(result.totalFiles).toBeGreaterThanOrEqual(1);
    });
  });
});
