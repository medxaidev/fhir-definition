import { describe, it, expect } from 'vitest';
import { InMemoryDefinitionRegistry } from '../../registry/in-memory-definition-registry.js';
import type { DefinitionProvider } from '../definition-provider.js';

describe('DefinitionProvider contract', () => {
  describe('compile-time structural typing', () => {
    it('InMemoryDefinitionRegistry should satisfy DefinitionProvider interface', () => {
      // 编译时类型检查：如果 InMemoryDefinitionRegistry 不满足 DefinitionProvider，此行编译失败
      const registry = new InMemoryDefinitionRegistry();
      const provider: DefinitionProvider = registry;

      // 运行时验证所有方法存在
      expect(typeof provider.getStructureDefinition).toBe('function');
      expect(typeof provider.getValueSet).toBe('function');
      expect(typeof provider.getCodeSystem).toBe('function');
      expect(typeof provider.getSearchParameters).toBe('function');
    });

    it('DefinitionProvider methods should return correct types', () => {
      const registry = new InMemoryDefinitionRegistry();
      const provider: DefinitionProvider = registry;

      // 所有查询方法返回正确类型（空 registry 返回 undefined / []）
      expect(provider.getStructureDefinition('http://nonexistent')).toBeUndefined();
      expect(provider.getValueSet('http://nonexistent')).toBeUndefined();
      expect(provider.getCodeSystem('http://nonexistent')).toBeUndefined();
      expect(provider.getSearchParameters('NonExistent')).toEqual([]);
    });

    it('DefinitionProvider should work after registering resources', () => {
      const registry = new InMemoryDefinitionRegistry();
      registry.register({
        resourceType: 'StructureDefinition',
        url: 'http://test/SD/Patient',
        name: 'Patient',
      });
      registry.register({
        resourceType: 'ValueSet',
        url: 'http://test/VS/gender',
      });
      registry.register({
        resourceType: 'CodeSystem',
        url: 'http://test/CS/gender',
      });
      registry.register({
        resourceType: 'SearchParameter',
        url: 'http://test/SP/name',
        code: 'name',
        base: ['Patient'],
      });

      const provider: DefinitionProvider = registry;

      expect(provider.getStructureDefinition('http://test/SD/Patient')).toBeDefined();
      expect(provider.getValueSet('http://test/VS/gender')).toBeDefined();
      expect(provider.getCodeSystem('http://test/CS/gender')).toBeDefined();
      expect(provider.getSearchParameters('Patient')).toHaveLength(1);
    });
  });

  describe('interface compatibility matrix', () => {
    it('DefinitionProvider has exactly 4 required methods', () => {
      // 验证接口方法列表完整
      const provider: DefinitionProvider = new InMemoryDefinitionRegistry();
      const methods: (keyof DefinitionProvider)[] = [
        'getStructureDefinition',
        'getValueSet',
        'getCodeSystem',
        'getSearchParameters',
      ];
      for (const method of methods) {
        expect(typeof provider[method]).toBe('function');
      }
    });

    it('DefinitionRegistry is a superset of DefinitionProvider', () => {
      // DefinitionRegistry 有更多方法，但结构上兼容 DefinitionProvider
      const registry = new InMemoryDefinitionRegistry();

      // DefinitionRegistry-only methods (not in DefinitionProvider)
      expect(typeof registry.hasStructureDefinition).toBe('function');
      expect(typeof registry.hasValueSet).toBe('function');
      expect(typeof registry.hasCodeSystem).toBe('function');
      expect(typeof registry.getStructureDefinitionByVersion).toBe('function');
      expect(typeof registry.listStructureDefinitions).toBe('function');
      expect(typeof registry.listValueSets).toBe('function');
      expect(typeof registry.listCodeSystems).toBe('function');
      expect(typeof registry.getSearchParameter).toBe('function');
      expect(typeof registry.getSearchParameterByUrl).toBe('function');
      expect(typeof registry.register).toBe('function');
      expect(typeof registry.registerPackage).toBe('function');
      expect(typeof registry.getLoadedPackages).toBe('function');
      expect(typeof registry.getStatistics).toBe('function');

      // Still satisfies DefinitionProvider
      const provider: DefinitionProvider = registry;
      expect(provider).toBe(registry);
    });
  });
});
