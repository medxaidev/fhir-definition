import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'node:path';
import { loadFromDirectory } from '../../load-from-directory.js';
import { ValueSetResolver } from '../value-set-resolver.js';
import type { DefinitionRegistry } from '../../registry/definition-registry.js';

const FIXTURES = join(__dirname, '..', '..', '__tests__', 'fixtures');

describe('ValueSetResolver', () => {
  let registry: DefinitionRegistry;
  let resolver: ValueSetResolver;

  beforeAll(() => {
    registry = loadFromDirectory(FIXTURES);
    resolver = new ValueSetResolver(registry);
  });

  describe('resolve', () => {
    it('should resolve administrative-gender VS', () => {
      const vs = resolver.resolve('http://hl7.org/fhir/ValueSet/administrative-gender');
      expect(vs).toBeDefined();
      expect(vs!.name).toBe('AdministrativeGender');
    });

    it('should resolve observation-status VS', () => {
      const vs = resolver.resolve('http://hl7.org/fhir/ValueSet/observation-status');
      expect(vs).toBeDefined();
      expect(vs!.name).toBe('ObservationStatus');
    });

    it('should resolve condition-clinical VS', () => {
      const vs = resolver.resolve('http://hl7.org/fhir/ValueSet/condition-clinical');
      expect(vs).toBeDefined();
    });

    it('should return undefined for unknown URL', () => {
      expect(resolver.resolve('http://unknown')).toBeUndefined();
    });

    it('should not do expansion (returns raw ValueSet)', () => {
      const vs = resolver.resolve('http://hl7.org/fhir/ValueSet/administrative-gender');
      expect(vs).toBeDefined();
      expect(vs!.resourceType).toBe('ValueSet');
      // compose should exist, expansion should be absent or raw
      expect(vs!.compose).toBeDefined();
    });
  });

  describe('list', () => {
    it('should return all registered VS URLs', () => {
      const urls = resolver.list();
      expect(urls.length).toBeGreaterThanOrEqual(3);
      expect(urls).toContain('http://hl7.org/fhir/ValueSet/administrative-gender');
    });
  });
});
