import type { SearchParameter } from '../model/index.js';
import type { DefinitionRegistry } from '../registry/definition-registry.js';

export class SearchParameterResolver {
  private readonly registry: DefinitionRegistry;

  constructor(registry: DefinitionRegistry) {
    this.registry = registry;
  }

  resolveByResourceType(resourceType: string): SearchParameter[] {
    return this.registry.getSearchParameters(resourceType);
  }

  resolveByName(resourceType: string, name: string): SearchParameter | undefined {
    return this.registry.getSearchParameter(resourceType, name);
  }

  resolveByUrl(url: string): SearchParameter | undefined {
    return this.registry.getSearchParameterByUrl(url);
  }

  /**
   * 列举所有有 SearchParameter 的资源类型。
   * 遍历所有 SP，收集其 base 字段中的资源类型。
   */
  getAllResourceTypes(): string[] {
    const all = this.listAll();
    const types = new Set<string>();
    for (const sp of all) {
      if (sp.base) {
        for (const base of sp.base) {
          types.add(base);
        }
      }
    }
    return Array.from(types);
  }

  /**
   * 返回所有已注册的 SearchParameter（去重，按 URL）。
   */
  listAll(): SearchParameter[] {
    // 收集所有资源类型的 SP，用 url 去重
    const seen = new Map<string, SearchParameter>();
    const resourceTypes = this.getAllResourceTypesFromRegistry();

    for (const rt of resourceTypes) {
      const sps = this.registry.getSearchParameters(rt);
      for (const sp of sps) {
        if (!seen.has(sp.url)) {
          seen.set(sp.url, sp);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * 内部方法：从 registry 中获取所有资源类型。
   * 遍历所有 SP 来发现资源类型（因为 registry 没有直接列举 SP resourceType 的方法）。
   */
  private getAllResourceTypesFromRegistry(): string[] {
    // 利用 listAll 可能造成递归，所以这里直接查已知常见资源类型
    // 但更好的方式是从 registry 获取所有 SD 并提取 type
    const sdUrls = this.registry.listStructureDefinitions();
    const types = new Set<string>();

    for (const url of sdUrls) {
      const sd = this.registry.getStructureDefinition(url);
      if (sd?.type && sd.kind === 'resource') {
        types.add(sd.type);
      }
    }

    // 如果没有 SD（比如只加载了 SP），尝试从 SP 的 base 提取
    if (types.size === 0) {
      // 无法高效遍历，返回空
      return [];
    }

    return Array.from(types);
  }
}
