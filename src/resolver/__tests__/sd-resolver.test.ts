import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'node:path';
import { loadFromDirectory } from '../../load-from-directory.js';
import { StructureDefinitionResolver } from '../structure-definition-resolver.js';
import type { DefinitionRegistry } from '../../registry/definition-registry.js';

const FIXTURES = join(__dirname, '..', '..', '__tests__', 'fixtures');

describe('StructureDefinitionResolver', () => {
  let registry: DefinitionRegistry;
  let resolver: StructureDefinitionResolver;

  beforeAll(() => {
    registry = loadFromDirectory(FIXTURES);
    resolver = new StructureDefinitionResolver(registry);
  });

  describe('resolve', () => {
    it('should resolve Patient by URL', () => {
      const sd = resolver.resolve('http://hl7.org/fhir/StructureDefinition/Patient');
      expect(sd).toBeDefined();
      expect(sd!.name).toBe('Patient');
    });

    it('should resolve Observation by URL', () => {
      const sd = resolver.resolve('http://hl7.org/fhir/StructureDefinition/Observation');
      expect(sd).toBeDefined();
      expect(sd!.name).toBe('Observation');
    });

    it('should return undefined for unknown URL', () => {
      expect(resolver.resolve('http://unknown')).toBeUndefined();
    });
  });

  describe('resolveVersioned', () => {
    it('should resolve by explicit version parameter', () => {
      const sd = resolver.resolveVersioned('http://hl7.org/fhir/StructureDefinition/Patient', '4.0.1');
      expect(sd).toBeDefined();
      expect(sd!.version).toBe('4.0.1');
    });

    it('should resolve by url|version format', () => {
      const sd = resolver.resolveVersioned('http://hl7.org/fhir/StructureDefinition/Patient|4.0.1');
      expect(sd).toBeDefined();
      expect(sd!.version).toBe('4.0.1');
    });

    it('should resolve v2 by url|version format', () => {
      const sd = resolver.resolveVersioned('http://hl7.org/fhir/StructureDefinition/Patient|5.0.0');
      expect(sd).toBeDefined();
      expect(sd!.version).toBe('5.0.0');
    });

    it('should return main index when no version specified', () => {
      const sd = resolver.resolveVersioned('http://hl7.org/fhir/StructureDefinition/Patient');
      expect(sd).toBeDefined();
      // main index has the latest registered (5.0.0 overrides 4.0.1)
    });

    it('should return undefined for unknown version', () => {
      const sd = resolver.resolveVersioned('http://hl7.org/fhir/StructureDefinition/Patient|9.9.9');
      expect(sd).toBeUndefined();
    });

    it('should return undefined for unknown URL with version', () => {
      const sd = resolver.resolveVersioned('http://unknown|1.0.0');
      expect(sd).toBeUndefined();
    });

    it('should prefer url|version over explicit version parameter', () => {
      // url contains |4.0.1, explicit version is 5.0.0 — pipe takes precedence
      const sd = resolver.resolveVersioned('http://hl7.org/fhir/StructureDefinition/Patient|4.0.1', '5.0.0');
      expect(sd).toBeDefined();
      expect(sd!.version).toBe('4.0.1');
    });
  });

  describe('list', () => {
    it('should return all registered SD URLs', () => {
      const urls = resolver.list();
      expect(urls.length).toBeGreaterThanOrEqual(4);
      expect(urls).toContain('http://hl7.org/fhir/StructureDefinition/Patient');
      expect(urls).toContain('http://hl7.org/fhir/StructureDefinition/Observation');
    });
  });
});
