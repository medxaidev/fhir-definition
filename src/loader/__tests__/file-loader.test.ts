import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { FileLoader } from '../file-loader.js';
import { LoadErrorCode } from '../../model/index.js';

const FIXTURES = join(__dirname, '..', '..', '__tests__', 'fixtures');

describe('FileLoader', () => {
  const loader = new FileLoader();

  describe('valid FHIR files', () => {
    it('should load a StructureDefinition', () => {
      const result = loader.loadFile(join(FIXTURES, 'StructureDefinition-Patient.json'));
      expect(result.success).toBe(true);
      expect(result.resourceType).toBe('StructureDefinition');
      expect(result.url).toBe('http://hl7.org/fhir/StructureDefinition/Patient');
      expect(result.resource).toBeDefined();
    });

    it('should load a ValueSet', () => {
      const result = loader.loadFile(join(FIXTURES, 'ValueSet-administrative-gender.json'));
      expect(result.success).toBe(true);
      expect(result.resourceType).toBe('ValueSet');
      expect(result.url).toBe('http://hl7.org/fhir/ValueSet/administrative-gender');
    });

    it('should load a CodeSystem', () => {
      const result = loader.loadFile(join(FIXTURES, 'CodeSystem-observation-category.json'));
      expect(result.success).toBe(true);
      expect(result.resourceType).toBe('CodeSystem');
      expect(result.url).toBe('http://terminology.hl7.org/CodeSystem/observation-category');
    });

    it('should load a SearchParameter', () => {
      const result = loader.loadFile(join(FIXTURES, 'SearchParameter-patient-name.json'));
      expect(result.success).toBe(true);
      expect(result.resourceType).toBe('SearchParameter');
      expect(result.url).toBe('http://hl7.org/fhir/SearchParameter/Patient-name');
    });
  });

  describe('error handling', () => {
    it('should return FILE_NOT_FOUND for missing file', () => {
      const result = loader.loadFile(join(FIXTURES, 'nonexistent.json'));
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(LoadErrorCode.FILE_NOT_FOUND);
    });

    it('should return INVALID_JSON for malformed JSON', () => {
      const result = loader.loadFile(join(FIXTURES, 'invalid.json'));
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(LoadErrorCode.INVALID_JSON);
    });

    it('should return NOT_FHIR_RESOURCE for non-FHIR JSON', () => {
      const result = loader.loadFile(join(FIXTURES, 'not-fhir.json'));
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(LoadErrorCode.NOT_FHIR_RESOURCE);
    });

    it('should return UNSUPPORTED_RESOURCE_TYPE for unsupported resources', () => {
      const result = loader.loadFile(join(FIXTURES, 'unsupported-resource.json'));
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(LoadErrorCode.UNSUPPORTED_RESOURCE_TYPE);
    });

    it('should never throw an exception (no-throw contract)', () => {
      expect(() => loader.loadFile('')).not.toThrow();
      expect(() => loader.loadFile('/definitely/not/a/real/path.json')).not.toThrow();
    });
  });
});
