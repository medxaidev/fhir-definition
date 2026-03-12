import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { loadFromDirectory } from '../load-from-directory.js';
import { loadDefinitionPackages } from '../load-definition-packages.js';
import { InMemoryDefinitionRegistry } from '../registry/in-memory-definition-registry.js';

const FIXTURES = join(__dirname, 'fixtures');
const PACKAGES = join(__dirname, 'fixtures', 'packages');

describe('Performance baseline', () => {
  describe('loadFromDirectory', () => {
    it('should load fixture directory in < 100ms', () => {
      const start = performance.now();
      const registry = loadFromDirectory(FIXTURES);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
      expect(registry.getStatistics().structureDefinitionCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe('loadDefinitionPackages', () => {
    it('should load multi-package fixtures in < 200ms', () => {
      const start = performance.now();
      const { registry } = loadDefinitionPackages(PACKAGES);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(200);
      expect(registry.getStatistics().structureDefinitionCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe('getStructureDefinition (O(1) lookup)', () => {
    it('should query SD in < 1ms (Map.get)', () => {
      const registry = loadFromDirectory(FIXTURES);
      const url = 'http://hl7.org/fhir/StructureDefinition/Patient';

      // 预热
      registry.getStructureDefinition(url);

      const iterations = 1000;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        registry.getStructureDefinition(url);
      }
      const elapsed = performance.now() - start;
      const avgMs = elapsed / iterations;

      // 平均每次查询应 < 0.01ms（Map.get 是 O(1)）
      expect(avgMs).toBeLessThan(0.1);
    });
  });

  describe('getSearchParameters (O(1) lookup)', () => {
    it('should query SPs by resourceType in < 1ms', () => {
      const registry = loadFromDirectory(FIXTURES);

      // 预热
      registry.getSearchParameters('Patient');

      const iterations = 1000;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        registry.getSearchParameters('Patient');
      }
      const elapsed = performance.now() - start;
      const avgMs = elapsed / iterations;

      expect(avgMs).toBeLessThan(0.1);
    });
  });

  describe('register throughput', () => {
    it('should register 1000 resources in < 50ms', () => {
      const registry = new InMemoryDefinitionRegistry();

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        registry.register({
          resourceType: 'StructureDefinition',
          url: `http://test/SD/${i}`,
          version: '1.0.0',
          name: `SD${i}`,
        });
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
      expect(registry.getStatistics().structureDefinitionCount).toBe(1000);
    });
  });
});
