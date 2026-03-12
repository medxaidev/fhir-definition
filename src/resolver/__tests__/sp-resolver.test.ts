import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'node:path';
import { loadFromDirectory } from '../../load-from-directory.js';
import { SearchParameterResolver } from '../search-parameter-resolver.js';
import type { DefinitionRegistry } from '../../registry/definition-registry.js';

const FIXTURES = join(__dirname, '..', '..', '__tests__', 'fixtures');

describe('SearchParameterResolver', () => {
  let registry: DefinitionRegistry;
  let resolver: SearchParameterResolver;

  beforeAll(() => {
    registry = loadFromDirectory(FIXTURES);
    resolver = new SearchParameterResolver(registry);
  });

  describe('resolveByResourceType', () => {
    it('should return Patient search parameters', () => {
      const sps = resolver.resolveByResourceType('Patient');
      expect(sps.length).toBeGreaterThanOrEqual(2);
    });

    it('should return Observation search parameters', () => {
      const sps = resolver.resolveByResourceType('Observation');
      expect(sps.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty for unknown resource type', () => {
      expect(resolver.resolveByResourceType('Unknown')).toEqual([]);
    });
  });

  describe('resolveByName', () => {
    it('should find Patient name SP', () => {
      const sp = resolver.resolveByName('Patient', 'name');
      expect(sp).toBeDefined();
      expect(sp!.expression).toBe('Patient.name');
    });

    it('should find Patient gender SP', () => {
      const sp = resolver.resolveByName('Patient', 'gender');
      expect(sp).toBeDefined();
      expect(sp!.expression).toBe('Patient.gender');
    });

    it('should return undefined for unknown name', () => {
      expect(resolver.resolveByName('Patient', 'nonexistent')).toBeUndefined();
    });
  });

  describe('resolveByUrl', () => {
    it('should find SP by canonical URL', () => {
      const sp = resolver.resolveByUrl('http://hl7.org/fhir/SearchParameter/Patient-name');
      expect(sp).toBeDefined();
      expect(sp!.code).toBe('name');
    });

    it('should return undefined for unknown URL', () => {
      expect(resolver.resolveByUrl('http://unknown')).toBeUndefined();
    });
  });

  describe('getAllResourceTypes', () => {
    it('should return resource types that have SPs', () => {
      const types = resolver.getAllResourceTypes();
      expect(types.length).toBeGreaterThanOrEqual(1);
      expect(types).toContain('Patient');
    });
  });

  describe('listAll', () => {
    it('should return all registered SPs (deduplicated)', () => {
      const all = resolver.listAll();
      expect(all.length).toBeGreaterThanOrEqual(4);
      // Verify deduplication: clinical-date has 3 bases but should appear once
      const dateParams = all.filter(sp => sp.url === 'http://hl7.org/fhir/SearchParameter/clinical-date');
      expect(dateParams).toHaveLength(1);
    });

    it('should include multi-base SP', () => {
      const all = resolver.listAll();
      const clinicalDate = all.find(sp => sp.url === 'http://hl7.org/fhir/SearchParameter/clinical-date');
      expect(clinicalDate).toBeDefined();
      expect(clinicalDate!.base).toContain('Condition');
      expect(clinicalDate!.base).toContain('Observation');
    });
  });
});
