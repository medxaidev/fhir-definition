import { describe, it, expect } from 'vitest';
import { DependencyResolver } from '../dependency-resolver.js';
import { LoadErrorCode } from '../../model/index.js';
import type { DefinitionPackage } from '../../model/index.js';

function pkg(name: string, deps: Record<string, string> = {}): DefinitionPackage {
  return { name, version: '1.0.0', path: `/fake/${name}`, dependencies: deps };
}

describe('DependencyResolver', () => {
  const resolver = new DependencyResolver();

  describe('no dependencies', () => {
    it('should return empty for empty input', () => {
      const result = resolver.resolve([]);
      expect(result.success).toBe(true);
      expect(result.sorted).toHaveLength(0);
    });

    it('should return single package as-is', () => {
      const result = resolver.resolve([pkg('a')]);
      expect(result.success).toBe(true);
      expect(result.sorted).toHaveLength(1);
      expect(result.sorted[0].name).toBe('a');
    });

    it('should return all packages when none have dependencies', () => {
      const result = resolver.resolve([pkg('a'), pkg('b'), pkg('c')]);
      expect(result.success).toBe(true);
      expect(result.sorted).toHaveLength(3);
    });
  });

  describe('linear dependencies', () => {
    it('should sort a → b (b depends on a)', () => {
      const result = resolver.resolve([
        pkg('b', { a: '1.0.0' }),
        pkg('a'),
      ]);
      expect(result.success).toBe(true);
      const names = result.sorted.map(p => p.name);
      expect(names.indexOf('a')).toBeLessThan(names.indexOf('b'));
    });

    it('should sort a → b → c (chain dependency)', () => {
      const result = resolver.resolve([
        pkg('c', { b: '1.0.0' }),
        pkg('a'),
        pkg('b', { a: '1.0.0' }),
      ]);
      expect(result.success).toBe(true);
      const names = result.sorted.map(p => p.name);
      expect(names.indexOf('a')).toBeLessThan(names.indexOf('b'));
      expect(names.indexOf('b')).toBeLessThan(names.indexOf('c'));
    });

    it('should sort r4.core → us.core → custom correctly', () => {
      const result = resolver.resolve([
        pkg('custom-ig', { 'hl7.fhir.us.core': '6.1.0' }),
        pkg('hl7.fhir.r4.core'),
        pkg('hl7.fhir.us.core', { 'hl7.fhir.r4.core': '4.0.1' }),
      ]);
      expect(result.success).toBe(true);
      const names = result.sorted.map(p => p.name);
      expect(names.indexOf('hl7.fhir.r4.core')).toBeLessThan(names.indexOf('hl7.fhir.us.core'));
      expect(names.indexOf('hl7.fhir.us.core')).toBeLessThan(names.indexOf('custom-ig'));
    });
  });

  describe('circular dependency detection', () => {
    it('should detect simple circular dependency (a ↔ b)', () => {
      const result = resolver.resolve([
        pkg('a', { b: '1.0.0' }),
        pkg('b', { a: '1.0.0' }),
      ]);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      expect(result.errors[0].code).toBe(LoadErrorCode.CIRCULAR_DEPENDENCY);
    });

    it('should detect 3-node circular dependency', () => {
      const result = resolver.resolve([
        pkg('a', { c: '1.0.0' }),
        pkg('b', { a: '1.0.0' }),
        pkg('c', { b: '1.0.0' }),
      ]);
      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe(LoadErrorCode.CIRCULAR_DEPENDENCY);
    });

    it('should still return non-cyclic packages in sorted array', () => {
      const result = resolver.resolve([
        pkg('ok'),
        pkg('a', { b: '1.0.0' }),
        pkg('b', { a: '1.0.0' }),
      ]);
      expect(result.success).toBe(false);
      // 'ok' has no deps, should still be in sorted
      const sortedNames = result.sorted.map(p => p.name);
      expect(sortedNames).toContain('ok');
    });
  });

  describe('missing dependencies', () => {
    it('should warn about missing dependency (non-fatal)', () => {
      const result = resolver.resolve([
        pkg('a', { 'nonexistent': '1.0.0' }),
      ]);
      // missing dep is a warning, not a failure
      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
      expect(result.warnings[0].code).toBe(LoadErrorCode.MISSING_DEPENDENCY);
    });

    it('should still sort packages despite missing dependencies', () => {
      const result = resolver.resolve([
        pkg('b', { a: '1.0.0', missing: '1.0.0' }),
        pkg('a'),
      ]);
      expect(result.success).toBe(true);
      expect(result.sorted).toHaveLength(2);
      const names = result.sorted.map(p => p.name);
      expect(names.indexOf('a')).toBeLessThan(names.indexOf('b'));
    });
  });

  describe('diamond dependencies', () => {
    it('should handle diamond: a ← b, a ← c, b+c ← d', () => {
      const result = resolver.resolve([
        pkg('d', { b: '1.0.0', c: '1.0.0' }),
        pkg('b', { a: '1.0.0' }),
        pkg('c', { a: '1.0.0' }),
        pkg('a'),
      ]);
      expect(result.success).toBe(true);
      const names = result.sorted.map(p => p.name);
      expect(names.indexOf('a')).toBeLessThan(names.indexOf('b'));
      expect(names.indexOf('a')).toBeLessThan(names.indexOf('c'));
      expect(names.indexOf('b')).toBeLessThan(names.indexOf('d'));
      expect(names.indexOf('c')).toBeLessThan(names.indexOf('d'));
    });
  });
});
