import type { StructureDefinition } from '../model/index.js';
import type { DefinitionRegistry } from '../registry/definition-registry.js';

export class StructureDefinitionResolver {
  private readonly registry: DefinitionRegistry;

  constructor(registry: DefinitionRegistry) {
    this.registry = registry;
  }

  resolve(url: string): StructureDefinition | undefined {
    return this.registry.getStructureDefinition(url);
  }

  /**
   * 支持 `url|version` 格式解析。
   * - 如果 url 包含 `|`，自动拆分为 canonicalUrl 和 version
   * - 如果未提供 version 参数且 url 不含 `|`，返回主索引（最新版本）
   */
  resolveVersioned(url: string, version?: string): StructureDefinition | undefined {
    let canonicalUrl = url;
    let resolvedVersion = version;

    // 解析 url|version 格式
    const pipeIndex = url.indexOf('|');
    if (pipeIndex !== -1) {
      canonicalUrl = url.substring(0, pipeIndex);
      resolvedVersion = url.substring(pipeIndex + 1);
    }

    if (resolvedVersion) {
      return this.registry.getStructureDefinitionByVersion(canonicalUrl, resolvedVersion);
    }

    return this.registry.getStructureDefinition(canonicalUrl);
  }

  list(): string[] {
    return this.registry.listStructureDefinitions();
  }
}
