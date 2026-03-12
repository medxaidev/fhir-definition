import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { PackageManager } from '../package-manager.js';
import { LoadErrorCode } from '../../model/index.js';

const PACKAGES = join(__dirname, '..', '..', '__tests__', 'fixtures', 'packages');

describe('PackageManager', () => {
  describe('loadPackages — full pipeline', () => {
    it('should scan, resolve deps, load, and register all packages', () => {
      const manager = new PackageManager();
      const { registry, result } = manager.loadPackages(PACKAGES);

      // Should have loaded r4.core, us.core, custom-ig, nested-pkg, circular-a, circular-b
      // But circular packages will fail dep resolution partially
      expect(result.packages.length).toBeGreaterThanOrEqual(3);
      expect(result.totalDefinitions).toBeGreaterThanOrEqual(10);
    });

    it('should return a usable registry', () => {
      const manager = new PackageManager();
      const { registry } = manager.loadPackages(PACKAGES);

      const stats = registry.getStatistics();
      expect(stats.structureDefinitionCount).toBeGreaterThanOrEqual(3);
      expect(stats.valueSetCount).toBeGreaterThanOrEqual(1);
      expect(stats.codeSystemCount).toBeGreaterThanOrEqual(1);
      expect(stats.searchParameterCount).toBeGreaterThanOrEqual(1);
    });

    it('should be able to query loaded definitions', () => {
      const manager = new PackageManager();
      const { registry } = manager.loadPackages(PACKAGES);

      const patient = registry.getStructureDefinition('http://hl7.org/fhir/StructureDefinition/Patient');
      expect(patient).toBeDefined();
      expect(patient!.name).toBe('Patient');

      const usCore = registry.getStructureDefinition('http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient');
      expect(usCore).toBeDefined();
    });

    it('should record loaded packages metadata', () => {
      const manager = new PackageManager();
      const { registry, result } = manager.loadPackages(PACKAGES);

      const pkgs = registry.getLoadedPackages();
      expect(pkgs.length).toBeGreaterThanOrEqual(3);
      const pkgNames = pkgs.map(p => p.name);
      expect(pkgNames).toContain('hl7.fhir.r4.core');
      expect(pkgNames).toContain('hl7.fhir.us.core');
    });
  });

  describe('loading order', () => {
    it('should load r4.core before us.core', () => {
      const manager = new PackageManager();
      const { registry } = manager.loadPackages(PACKAGES);
      const pkgs = registry.getLoadedPackages();
      const r4Idx = pkgs.findIndex(p => p.name === 'hl7.fhir.r4.core');
      const usIdx = pkgs.findIndex(p => p.name === 'hl7.fhir.us.core');
      expect(r4Idx).toBeLessThan(usIdx);
    });

    it('should load us.core before custom-ig', () => {
      const manager = new PackageManager();
      const { registry } = manager.loadPackages(PACKAGES);
      const pkgs = registry.getLoadedPackages();
      const usIdx = pkgs.findIndex(p => p.name === 'hl7.fhir.us.core');
      const customIdx = pkgs.findIndex(p => p.name === 'custom-ig');
      expect(usIdx).toBeLessThan(customIdx);
    });

    it('should load r4.core → us.core → custom-ig in order', () => {
      const manager = new PackageManager();
      const { registry } = manager.loadPackages(PACKAGES);
      const pkgs = registry.getLoadedPackages();
      const names = pkgs.map(p => p.name);
      const r4Idx = names.indexOf('hl7.fhir.r4.core');
      const usIdx = names.indexOf('hl7.fhir.us.core');
      const customIdx = names.indexOf('custom-ig');
      expect(r4Idx).toBeLessThan(usIdx);
      expect(usIdx).toBeLessThan(customIdx);
    });
  });

  describe('getRegistry and getLoadedPackages', () => {
    it('getRegistry() should return same registry', () => {
      const manager = new PackageManager();
      manager.loadPackages(PACKAGES);
      const reg = manager.getRegistry();
      expect(reg.getStatistics().structureDefinitionCount).toBeGreaterThanOrEqual(3);
    });

    it('getLoadedPackages() should return loaded packages', () => {
      const manager = new PackageManager();
      manager.loadPackages(PACKAGES);
      const pkgs = manager.getLoadedPackages();
      expect(pkgs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('options', () => {
    it('should support scanOptions.maxDepth', () => {
      const manager = new PackageManager();
      const { result } = manager.loadPackages(PACKAGES, {
        scanOptions: { maxDepth: 1 },
      });
      const names = result.packages.map(p => p.name);
      // nested-pkg is at depth 3, should not be found
      expect(names).not.toContain('nested-pkg');
    });

    it('should support resourceTypes filter', () => {
      const manager = new PackageManager();
      const { registry } = manager.loadPackages(PACKAGES, {
        resourceTypes: ['StructureDefinition'],
      });
      const stats = registry.getStatistics();
      expect(stats.structureDefinitionCount).toBeGreaterThanOrEqual(3);
      // Should not have VS, CS, SP since we filtered
      expect(stats.valueSetCount).toBe(0);
      expect(stats.codeSystemCount).toBe(0);
      expect(stats.searchParameterCount).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle nonexistent root gracefully', () => {
      const manager = new PackageManager();
      const { result } = manager.loadPackages('/nonexistent/path');
      expect(result.packages).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it('should report circular dependencies in errors', () => {
      const manager = new PackageManager();
      const { result } = manager.loadPackages(PACKAGES);
      const circularErrors = result.errors.filter(
        e => e.code === LoadErrorCode.CIRCULAR_DEPENDENCY,
      );
      expect(circularErrors.length).toBeGreaterThanOrEqual(1);
    });
  });
});
