import { describe, it, expect } from 'vitest';
import {
  LoadErrorCode,
  SUPPORTED_RESOURCE_TYPES,
} from '../types.js';
import type {
  FhirDefinitionResource,
  StructureDefinition,
  ValueSet,
  CodeSystem,
  SearchParameter,
  RegistryStatistics,
  LoadError,
  DefinitionPackage,
  PackageManifest,
  LoadedPackage,
} from '../types.js';

describe('model/types', () => {
  describe('SUPPORTED_RESOURCE_TYPES', () => {
    it('should contain StructureDefinition', () => {
      expect(SUPPORTED_RESOURCE_TYPES.has('StructureDefinition')).toBe(true);
    });

    it('should contain ValueSet', () => {
      expect(SUPPORTED_RESOURCE_TYPES.has('ValueSet')).toBe(true);
    });

    it('should contain CodeSystem', () => {
      expect(SUPPORTED_RESOURCE_TYPES.has('CodeSystem')).toBe(true);
    });

    it('should contain SearchParameter', () => {
      expect(SUPPORTED_RESOURCE_TYPES.has('SearchParameter')).toBe(true);
    });

    it('should not contain unsupported types', () => {
      expect(SUPPORTED_RESOURCE_TYPES.has('Patient')).toBe(false);
      expect(SUPPORTED_RESOURCE_TYPES.has('Observation')).toBe(false);
      expect(SUPPORTED_RESOURCE_TYPES.has('CapabilityStatement')).toBe(false);
    });

    it('should have exactly 4 entries', () => {
      expect(SUPPORTED_RESOURCE_TYPES.size).toBe(4);
    });
  });

  describe('LoadErrorCode', () => {
    it('should have all 6 error codes', () => {
      expect(LoadErrorCode.FILE_NOT_FOUND).toBe('FILE_NOT_FOUND');
      expect(LoadErrorCode.INVALID_JSON).toBe('INVALID_JSON');
      expect(LoadErrorCode.NOT_FHIR_RESOURCE).toBe('NOT_FHIR_RESOURCE');
      expect(LoadErrorCode.UNSUPPORTED_RESOURCE_TYPE).toBe('UNSUPPORTED_RESOURCE_TYPE');
      expect(LoadErrorCode.IO_ERROR).toBe('IO_ERROR');
      expect(LoadErrorCode.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
    });
  });

  describe('type structure validation', () => {
    it('FhirDefinitionResource should accept valid SD', () => {
      const sd: FhirDefinitionResource = {
        resourceType: 'StructureDefinition',
        url: 'http://example.com/sd',
        version: '1.0.0',
        name: 'TestSD',
      };
      expect(sd.resourceType).toBe('StructureDefinition');
      expect(sd.url).toBe('http://example.com/sd');
    });

    it('StructureDefinition should accept kind and type fields', () => {
      const sd: StructureDefinition = {
        resourceType: 'StructureDefinition',
        url: 'http://example.com/sd',
        kind: 'resource',
        type: 'Patient',
        baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource',
      };
      expect(sd.kind).toBe('resource');
      expect(sd.type).toBe('Patient');
    });

    it('ValueSet should accept compose field', () => {
      const vs: ValueSet = {
        resourceType: 'ValueSet',
        url: 'http://example.com/vs',
        status: 'active',
        compose: {
          include: [{ system: 'http://example.com/cs' }],
        },
      };
      expect(vs.compose?.include).toHaveLength(1);
    });

    it('CodeSystem should accept concept field', () => {
      const cs: CodeSystem = {
        resourceType: 'CodeSystem',
        url: 'http://example.com/cs',
        content: 'complete',
        concept: [
          { code: 'a', display: 'A' },
          { code: 'b', display: 'B' },
        ],
      };
      expect(cs.concept).toHaveLength(2);
    });

    it('SearchParameter should accept base and expression fields', () => {
      const sp: SearchParameter = {
        resourceType: 'SearchParameter',
        url: 'http://example.com/sp',
        code: 'name',
        base: ['Patient'],
        type: 'string',
        expression: 'Patient.name',
      };
      expect(sp.base).toEqual(['Patient']);
      expect(sp.expression).toBe('Patient.name');
    });

    it('RegistryStatistics should hold counts', () => {
      const stats: RegistryStatistics = {
        structureDefinitionCount: 10,
        valueSetCount: 5,
        codeSystemCount: 3,
        searchParameterCount: 20,
        loadedPackages: 2,
      };
      expect(stats.structureDefinitionCount).toBe(10);
      expect(stats.loadedPackages).toBe(2);
    });

    it('LoadError should hold code and message', () => {
      const err: LoadError = {
        code: LoadErrorCode.FILE_NOT_FOUND,
        message: 'File not found',
        filePath: '/path/to/file.json',
      };
      expect(err.code).toBe(LoadErrorCode.FILE_NOT_FOUND);
    });

    it('DefinitionPackage should hold package metadata', () => {
      const pkg: DefinitionPackage = {
        name: 'hl7.fhir.r4.core',
        version: '4.0.1',
        path: '/definitions/hl7.fhir.r4.core',
        dependencies: {},
      };
      expect(pkg.name).toBe('hl7.fhir.r4.core');
    });

    it('PackageManifest should accept optional fields', () => {
      const manifest: PackageManifest = {
        name: 'hl7.fhir.r4.core',
        version: '4.0.1',
        type: 'fhir-definition',
        fhirVersions: ['4.0.1'],
        dependencies: { 'some.dep': '1.0.0' },
      };
      expect(manifest.fhirVersions).toEqual(['4.0.1']);
    });

    it('LoadedPackage should hold definitionCount and loadedAt', () => {
      const loaded: LoadedPackage = {
        name: 'hl7.fhir.r4.core',
        version: '4.0.1',
        path: '/definitions/hl7.fhir.r4.core',
        definitionCount: 100,
        loadedAt: new Date(),
      };
      expect(loaded.definitionCount).toBe(100);
      expect(loaded.loadedAt).toBeInstanceOf(Date);
    });
  });
});
