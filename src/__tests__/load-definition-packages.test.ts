import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { loadDefinitionPackages } from '../load-definition-packages.js';

const PACKAGES = join(__dirname, 'fixtures', 'packages');

describe('loadDefinitionPackages (end-to-end)', () => {
  it('should load all packages and return registry + result', () => {
    const { registry, result } = loadDefinitionPackages(PACKAGES);
    expect(result.packages.length).toBeGreaterThanOrEqual(3);
    expect(result.totalDefinitions).toBeGreaterThanOrEqual(10);

    const stats = registry.getStatistics();
    expect(stats.structureDefinitionCount).toBeGreaterThanOrEqual(3);
  });

  it('should query definitions from loaded packages', () => {
    const { registry } = loadDefinitionPackages(PACKAGES);
    const patient = registry.getStructureDefinition('http://hl7.org/fhir/StructureDefinition/Patient');
    expect(patient).toBeDefined();
    expect(patient!.name).toBe('Patient');
  });

  it('should maintain correct loading order', () => {
    const { registry } = loadDefinitionPackages(PACKAGES);
    const pkgs = registry.getLoadedPackages();
    const names = pkgs.map(p => p.name);
    const r4Idx = names.indexOf('hl7.fhir.r4.core');
    const usIdx = names.indexOf('hl7.fhir.us.core');
    expect(r4Idx).toBeLessThan(usIdx);
  });

  it('should support resourceTypes filtering', () => {
    const { registry } = loadDefinitionPackages(PACKAGES, {
      resourceTypes: ['ValueSet'],
    });
    const stats = registry.getStatistics();
    expect(stats.valueSetCount).toBeGreaterThanOrEqual(1);
    expect(stats.structureDefinitionCount).toBe(0);
  });

  it('should support scanOptions', () => {
    const { result } = loadDefinitionPackages(PACKAGES, {
      scanOptions: { maxDepth: 1 },
    });
    const names = result.packages.map(p => p.name);
    expect(names).not.toContain('nested-pkg');
  });

  it('should handle nonexistent path gracefully', () => {
    const { result } = loadDefinitionPackages('/nonexistent');
    expect(result.packages).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });
});
