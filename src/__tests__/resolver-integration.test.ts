import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'node:path';
import { loadDefinitionPackages } from '../load-definition-packages.js';
import { StructureDefinitionResolver } from '../resolver/structure-definition-resolver.js';
import { ValueSetResolver } from '../resolver/value-set-resolver.js';
import { CodeSystemResolver } from '../resolver/code-system-resolver.js';
import { SearchParameterResolver } from '../resolver/search-parameter-resolver.js';
import type { DefinitionRegistry } from '../registry/definition-registry.js';

const PACKAGES = join(__dirname, 'fixtures', 'packages');

describe('Resolver integration (package-based)', () => {
  let registry: DefinitionRegistry;
  let sdResolver: StructureDefinitionResolver;
  let vsResolver: ValueSetResolver;
  let csResolver: CodeSystemResolver;
  let spResolver: SearchParameterResolver;

  beforeAll(() => {
    const { registry: reg } = loadDefinitionPackages(PACKAGES);
    registry = reg;
    sdResolver = new StructureDefinitionResolver(registry);
    vsResolver = new ValueSetResolver(registry);
    csResolver = new CodeSystemResolver(registry);
    spResolver = new SearchParameterResolver(registry);
  });

  describe('StructureDefinitionResolver with packages', () => {
    it('should resolve SD from r4.core package', () => {
      const sd = sdResolver.resolve('http://hl7.org/fhir/StructureDefinition/Patient');
      expect(sd).toBeDefined();
      expect(sd!.name).toBe('Patient');
    });

    it('should resolve SD from us.core package', () => {
      const sd = sdResolver.resolve('http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient');
      expect(sd).toBeDefined();
      expect(sd!.name).toBe('USCorePatientProfile');
    });

    it('should resolve SD from custom-ig package', () => {
      const sd = sdResolver.resolve('http://example.com/StructureDefinition/CustomCondition');
      expect(sd).toBeDefined();
    });

    it('should list SDs from all packages', () => {
      const urls = sdResolver.list();
      expect(urls.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('ValueSetResolver with packages', () => {
    it('should resolve VS from r4.core package', () => {
      const vs = vsResolver.resolve('http://hl7.org/fhir/ValueSet/administrative-gender');
      expect(vs).toBeDefined();
    });

    it('should resolve VS from us.core package', () => {
      const vs = vsResolver.resolve('http://hl7.org/fhir/ValueSet/condition-clinical');
      expect(vs).toBeDefined();
    });

    it('should list all VS URLs', () => {
      const urls = vsResolver.list();
      expect(urls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('CodeSystemResolver with packages', () => {
    it('should resolve CS from r4.core', () => {
      const cs = csResolver.resolve('http://terminology.hl7.org/CodeSystem/observation-category');
      expect(cs).toBeDefined();
    });

    it('should resolve CS from custom-ig', () => {
      const cs = csResolver.resolve('http://terminology.hl7.org/CodeSystem/condition-clinical');
      expect(cs).toBeDefined();
    });
  });

  describe('SearchParameterResolver with packages', () => {
    it('should resolve SP from r4.core', () => {
      const sp = spResolver.resolveByUrl('http://hl7.org/fhir/SearchParameter/Patient-name');
      expect(sp).toBeDefined();
    });

    it('should resolve SP from us.core', () => {
      const sp = spResolver.resolveByUrl('http://hl7.org/fhir/SearchParameter/Patient-gender');
      expect(sp).toBeDefined();
    });

    it('should resolve Patient SPs across packages', () => {
      const sps = spResolver.resolveByResourceType('Patient');
      expect(sps.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('cross-package queries', () => {
    it('all four resolver types should have data', () => {
      const stats = registry.getStatistics();
      expect(stats.structureDefinitionCount).toBeGreaterThanOrEqual(4);
      expect(stats.valueSetCount).toBeGreaterThanOrEqual(2);
      expect(stats.codeSystemCount).toBeGreaterThanOrEqual(2);
      expect(stats.searchParameterCount).toBeGreaterThanOrEqual(2);
    });
  });
});
