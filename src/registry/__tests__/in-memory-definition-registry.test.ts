import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDefinitionRegistry } from '../in-memory-definition-registry.js';
import type {
  StructureDefinition,
  ValueSet,
  CodeSystem,
  SearchParameter,
} from '../../model/index.js';

function makeSd(url: string, version?: string): StructureDefinition {
  return {
    resourceType: 'StructureDefinition',
    url,
    version,
    name: url.split('/').pop(),
    kind: 'resource',
    type: url.split('/').pop(),
  };
}

function makeVs(url: string): ValueSet {
  return { resourceType: 'ValueSet', url, status: 'active' };
}

function makeCs(url: string): CodeSystem {
  return { resourceType: 'CodeSystem', url, status: 'active', content: 'complete' };
}

function makeSp(url: string, code: string, bases: string[]): SearchParameter {
  return { resourceType: 'SearchParameter', url, code, base: bases, type: 'string', name: code };
}

describe('InMemoryDefinitionRegistry', () => {
  let registry: InMemoryDefinitionRegistry;

  beforeEach(() => {
    registry = new InMemoryDefinitionRegistry();
  });

  // ─── StructureDefinition ────────────────────────────────────────────────

  describe('StructureDefinition', () => {
    it('should register and retrieve a SD by URL', () => {
      const sd = makeSd('http://example.com/SD/Patient', '1.0.0');
      registry.register(sd);
      expect(registry.getStructureDefinition('http://example.com/SD/Patient')).toBe(sd);
    });

    it('should return undefined for unknown SD URL', () => {
      expect(registry.getStructureDefinition('http://unknown')).toBeUndefined();
    });

    it('hasStructureDefinition should return true/false', () => {
      const sd = makeSd('http://example.com/SD/A', '1.0.0');
      registry.register(sd);
      expect(registry.hasStructureDefinition('http://example.com/SD/A')).toBe(true);
      expect(registry.hasStructureDefinition('http://example.com/SD/B')).toBe(false);
    });

    it('should overwrite main index when same URL registered twice', () => {
      const sd1 = makeSd('http://example.com/SD/P', '1.0.0');
      const sd2 = makeSd('http://example.com/SD/P', '2.0.0');
      registry.register(sd1);
      registry.register(sd2);
      expect(registry.getStructureDefinition('http://example.com/SD/P')).toBe(sd2);
    });

    it('listStructureDefinitions should return all registered URLs', () => {
      registry.register(makeSd('http://a', '1'));
      registry.register(makeSd('http://b', '1'));
      registry.register(makeSd('http://c', '1'));
      const urls = registry.listStructureDefinitions();
      expect(urls).toHaveLength(3);
      expect(urls).toContain('http://a');
      expect(urls).toContain('http://b');
      expect(urls).toContain('http://c');
    });
  });

  // ─── SD Version Index ───────────────────────────────────────────────────

  describe('SD version index', () => {
    it('should retrieve SD by version', () => {
      const sd1 = makeSd('http://example.com/SD/P', '4.0.1');
      const sd2 = makeSd('http://example.com/SD/P', '5.0.0');
      registry.register(sd1);
      registry.register(sd2);
      expect(registry.getStructureDefinitionByVersion('http://example.com/SD/P', '4.0.1')).toBe(sd1);
      expect(registry.getStructureDefinitionByVersion('http://example.com/SD/P', '5.0.0')).toBe(sd2);
    });

    it('should return undefined for unknown version', () => {
      registry.register(makeSd('http://example.com/SD/P', '4.0.1'));
      expect(registry.getStructureDefinitionByVersion('http://example.com/SD/P', '9.9.9')).toBeUndefined();
    });

    it('should return undefined for unknown URL in version query', () => {
      expect(registry.getStructureDefinitionByVersion('http://unknown', '1.0.0')).toBeUndefined();
    });

    it('should keep both versions independently in version index', () => {
      const sd1 = makeSd('http://x', '1.0');
      const sd2 = makeSd('http://x', '2.0');
      registry.register(sd1);
      registry.register(sd2);
      // Main index has latest
      expect(registry.getStructureDefinition('http://x')).toBe(sd2);
      // Version index has both
      expect(registry.getStructureDefinitionByVersion('http://x', '1.0')).toBe(sd1);
      expect(registry.getStructureDefinitionByVersion('http://x', '2.0')).toBe(sd2);
    });

    it('should handle SD without version gracefully', () => {
      const sd = makeSd('http://no-version');
      registry.register(sd);
      expect(registry.getStructureDefinition('http://no-version')).toBe(sd);
      // Version index should have no entries for this URL
      expect(registry.getStructureDefinitionByVersion('http://no-version', '')).toBeUndefined();
    });
  });

  // ─── ValueSet ───────────────────────────────────────────────────────────

  describe('ValueSet', () => {
    it('should register and retrieve a VS', () => {
      const vs = makeVs('http://example.com/VS/gender');
      registry.register(vs);
      expect(registry.getValueSet('http://example.com/VS/gender')).toBe(vs);
    });

    it('should return undefined for unknown VS', () => {
      expect(registry.getValueSet('http://unknown')).toBeUndefined();
    });

    it('hasValueSet should work', () => {
      registry.register(makeVs('http://a'));
      expect(registry.hasValueSet('http://a')).toBe(true);
      expect(registry.hasValueSet('http://b')).toBe(false);
    });

    it('listValueSets should return all URLs', () => {
      registry.register(makeVs('http://vs1'));
      registry.register(makeVs('http://vs2'));
      expect(registry.listValueSets()).toEqual(expect.arrayContaining(['http://vs1', 'http://vs2']));
      expect(registry.listValueSets()).toHaveLength(2);
    });
  });

  // ─── CodeSystem ─────────────────────────────────────────────────────────

  describe('CodeSystem', () => {
    it('should register and retrieve a CS', () => {
      const cs = makeCs('http://example.com/CS/gender');
      registry.register(cs);
      expect(registry.getCodeSystem('http://example.com/CS/gender')).toBe(cs);
    });

    it('should return undefined for unknown CS', () => {
      expect(registry.getCodeSystem('http://unknown')).toBeUndefined();
    });

    it('hasCodeSystem should work', () => {
      registry.register(makeCs('http://a'));
      expect(registry.hasCodeSystem('http://a')).toBe(true);
      expect(registry.hasCodeSystem('http://b')).toBe(false);
    });

    it('listCodeSystems should return all URLs', () => {
      registry.register(makeCs('http://cs1'));
      registry.register(makeCs('http://cs2'));
      registry.register(makeCs('http://cs3'));
      expect(registry.listCodeSystems()).toHaveLength(3);
    });
  });

  // ─── SearchParameter ───────────────────────────────────────────────────

  describe('SearchParameter', () => {
    it('should retrieve SPs by resourceType', () => {
      registry.register(makeSp('http://sp1', 'name', ['Patient']));
      registry.register(makeSp('http://sp2', 'gender', ['Patient']));
      const sps = registry.getSearchParameters('Patient');
      expect(sps).toHaveLength(2);
    });

    it('should return empty array for unknown resourceType', () => {
      expect(registry.getSearchParameters('Unknown')).toEqual([]);
    });

    it('should retrieve SP by resourceType + name', () => {
      const sp = makeSp('http://sp1', 'name', ['Patient']);
      registry.register(sp);
      expect(registry.getSearchParameter('Patient', 'name')).toBe(sp);
    });

    it('should return undefined for unknown name', () => {
      registry.register(makeSp('http://sp1', 'name', ['Patient']));
      expect(registry.getSearchParameter('Patient', 'xyz')).toBeUndefined();
    });

    it('should retrieve SP by canonical URL', () => {
      const sp = makeSp('http://hl7.org/fhir/SearchParameter/Patient-name', 'name', ['Patient']);
      registry.register(sp);
      expect(registry.getSearchParameterByUrl('http://hl7.org/fhir/SearchParameter/Patient-name')).toBe(sp);
    });

    it('should return undefined for unknown SP URL', () => {
      expect(registry.getSearchParameterByUrl('http://unknown')).toBeUndefined();
    });

    it('should register multi-base SP across multiple resource types', () => {
      const sp = makeSp('http://sp-date', 'date', ['Condition', 'Encounter', 'Observation']);
      registry.register(sp);
      expect(registry.getSearchParameter('Condition', 'date')).toBe(sp);
      expect(registry.getSearchParameter('Encounter', 'date')).toBe(sp);
      expect(registry.getSearchParameter('Observation', 'date')).toBe(sp);
    });
  });

  // ─── Metadata ─────────────────────────────────────────────────────────

  describe('metadata', () => {
    it('getStatistics should return correct counts', () => {
      registry.register(makeSd('http://sd1', '1'));
      registry.register(makeSd('http://sd2', '1'));
      registry.register(makeVs('http://vs1'));
      registry.register(makeCs('http://cs1'));
      registry.register(makeSp('http://sp1', 'name', ['Patient']));

      const stats = registry.getStatistics();
      expect(stats.structureDefinitionCount).toBe(2);
      expect(stats.valueSetCount).toBe(1);
      expect(stats.codeSystemCount).toBe(1);
      expect(stats.searchParameterCount).toBe(1);
      expect(stats.loadedPackages).toBe(0);
    });

    it('registerPackage and getLoadedPackages should work', () => {
      registry.registerPackage({
        name: 'hl7.fhir.r4.core',
        version: '4.0.1',
        path: '/defs/r4',
        definitionCount: 100,
        loadedAt: new Date(),
      });
      const pkgs = registry.getLoadedPackages();
      expect(pkgs).toHaveLength(1);
      expect(pkgs[0].name).toBe('hl7.fhir.r4.core');
    });

    it('getLoadedPackages should return a copy', () => {
      registry.registerPackage({
        name: 'test',
        version: '1.0',
        path: '/test',
        definitionCount: 1,
        loadedAt: new Date(),
      });
      const pkgs1 = registry.getLoadedPackages();
      const pkgs2 = registry.getLoadedPackages();
      expect(pkgs1).not.toBe(pkgs2);
      expect(pkgs1).toEqual(pkgs2);
    });

    it('getStatistics should count loadedPackages', () => {
      registry.registerPackage({
        name: 'pkg1',
        version: '1.0',
        path: '/p1',
        definitionCount: 0,
        loadedAt: new Date(),
      });
      registry.registerPackage({
        name: 'pkg2',
        version: '1.0',
        path: '/p2',
        definitionCount: 0,
        loadedAt: new Date(),
      });
      expect(registry.getStatistics().loadedPackages).toBe(2);
    });
  });

  // ─── Empty registry ───────────────────────────────────────────────────

  describe('empty registry', () => {
    it('should return empty statistics', () => {
      const stats = registry.getStatistics();
      expect(stats.structureDefinitionCount).toBe(0);
      expect(stats.valueSetCount).toBe(0);
      expect(stats.codeSystemCount).toBe(0);
      expect(stats.searchParameterCount).toBe(0);
      expect(stats.loadedPackages).toBe(0);
    });

    it('should return empty lists', () => {
      expect(registry.listStructureDefinitions()).toEqual([]);
      expect(registry.listValueSets()).toEqual([]);
      expect(registry.listCodeSystems()).toEqual([]);
    });
  });
});
