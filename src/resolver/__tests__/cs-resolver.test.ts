import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'node:path';
import { loadFromDirectory } from '../../load-from-directory.js';
import { CodeSystemResolver } from '../code-system-resolver.js';
import type { DefinitionRegistry } from '../../registry/definition-registry.js';

const FIXTURES = join(__dirname, '..', '..', '__tests__', 'fixtures');

describe('CodeSystemResolver', () => {
  let registry: DefinitionRegistry;
  let resolver: CodeSystemResolver;

  beforeAll(() => {
    registry = loadFromDirectory(FIXTURES);
    resolver = new CodeSystemResolver(registry);
  });

  describe('resolve', () => {
    it('should resolve observation-category CS', () => {
      const cs = resolver.resolve('http://terminology.hl7.org/CodeSystem/observation-category');
      expect(cs).toBeDefined();
      expect(cs!.name).toBe('ObservationCategoryCodes');
    });

    it('should resolve condition-clinical CS', () => {
      const cs = resolver.resolve('http://terminology.hl7.org/CodeSystem/condition-clinical');
      expect(cs).toBeDefined();
    });

    it('should resolve administrative-gender CS', () => {
      const cs = resolver.resolve('http://hl7.org/fhir/administrative-gender');
      expect(cs).toBeDefined();
    });

    it('should return undefined for unknown URL', () => {
      expect(resolver.resolve('http://unknown')).toBeUndefined();
    });
  });

  describe('lookupCode', () => {
    it('should find a code in observation-category', () => {
      const info = resolver.lookupCode(
        'http://terminology.hl7.org/CodeSystem/observation-category',
        'vital-signs',
      );
      expect(info).toBeDefined();
      expect(info!.code).toBe('vital-signs');
      expect(info!.display).toBe('Vital Signs');
      expect(info!.system).toBe('http://terminology.hl7.org/CodeSystem/observation-category');
    });

    it('should find laboratory code', () => {
      const info = resolver.lookupCode(
        'http://terminology.hl7.org/CodeSystem/observation-category',
        'laboratory',
      );
      expect(info).toBeDefined();
      expect(info!.code).toBe('laboratory');
      expect(info!.display).toBe('Laboratory');
    });

    it('should find code in condition-clinical CS', () => {
      const info = resolver.lookupCode(
        'http://terminology.hl7.org/CodeSystem/condition-clinical',
        'active',
      );
      expect(info).toBeDefined();
      expect(info!.code).toBe('active');
      expect(info!.display).toBe('Active');
    });

    it('should find code in administrative-gender CS', () => {
      const info = resolver.lookupCode(
        'http://hl7.org/fhir/administrative-gender',
        'male',
      );
      expect(info).toBeDefined();
      expect(info!.code).toBe('male');
    });

    it('should return undefined for unknown code', () => {
      const info = resolver.lookupCode(
        'http://terminology.hl7.org/CodeSystem/observation-category',
        'nonexistent',
      );
      expect(info).toBeUndefined();
    });

    it('should return undefined for unknown system', () => {
      const info = resolver.lookupCode('http://unknown', 'code');
      expect(info).toBeUndefined();
    });
  });

  describe('list', () => {
    it('should return all registered CS URLs', () => {
      const urls = resolver.list();
      expect(urls.length).toBeGreaterThanOrEqual(3);
      expect(urls).toContain('http://terminology.hl7.org/CodeSystem/observation-category');
    });
  });
});
