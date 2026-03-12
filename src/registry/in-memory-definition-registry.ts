import type {
  FhirDefinitionResource,
  StructureDefinition,
  ValueSet,
  CodeSystem,
  SearchParameter,
  LoadedPackage,
  RegistryStatistics,
} from '../model/index.js';
import type { DefinitionRegistry } from './definition-registry.js';

export class InMemoryDefinitionRegistry implements DefinitionRegistry {
  // SD 主索引：url → 最新版本
  private readonly sdByUrl = new Map<string, StructureDefinition>();
  // SD 版本索引：url → Map<version, SD>
  private readonly sdByVersion = new Map<string, Map<string, StructureDefinition>>();

  // VS 索引：url → VS
  private readonly vsByUrl = new Map<string, ValueSet>();

  // CS 索引：url → CS
  private readonly csByUrl = new Map<string, CodeSystem>();

  // SP 双重索引
  // 按 resourceType + name 查询
  private readonly spByTypeAndName = new Map<string, Map<string, SearchParameter>>();
  // 按 canonical URL 查询
  private readonly spByUrl = new Map<string, SearchParameter>();

  // 已加载包
  private readonly packages: LoadedPackage[] = [];

  // ─── 写入 ─────────────────────────────────────────────────────────────────

  register(resource: FhirDefinitionResource): void {
    switch (resource.resourceType) {
      case 'StructureDefinition':
        this.registerStructureDefinition(resource as StructureDefinition);
        break;
      case 'ValueSet':
        this.vsByUrl.set(resource.url, resource as ValueSet);
        break;
      case 'CodeSystem':
        this.csByUrl.set(resource.url, resource as CodeSystem);
        break;
      case 'SearchParameter':
        this.registerSearchParameter(resource as SearchParameter);
        break;
    }
  }

  private registerStructureDefinition(sd: StructureDefinition): void {
    // 主索引（最新版本覆盖）
    this.sdByUrl.set(sd.url, sd);

    // 版本索引
    if (sd.version) {
      let versionMap = this.sdByVersion.get(sd.url);
      if (!versionMap) {
        versionMap = new Map();
        this.sdByVersion.set(sd.url, versionMap);
      }
      versionMap.set(sd.version, sd);
    }
  }

  private registerSearchParameter(sp: SearchParameter): void {
    // URL 索引
    this.spByUrl.set(sp.url, sp);

    // resourceType + name 索引
    const bases = sp.base ?? [];
    const name = sp.code ?? sp.name ?? '';

    for (const base of bases) {
      let nameMap = this.spByTypeAndName.get(base);
      if (!nameMap) {
        nameMap = new Map();
        this.spByTypeAndName.set(base, nameMap);
      }
      if (name) {
        nameMap.set(name, sp);
      }
    }
  }

  // ─── StructureDefinition 查询 ─────────────────────────────────────────────

  getStructureDefinition(url: string): StructureDefinition | undefined {
    return this.sdByUrl.get(url);
  }

  hasStructureDefinition(url: string): boolean {
    return this.sdByUrl.has(url);
  }

  getStructureDefinitionByVersion(url: string, version: string): StructureDefinition | undefined {
    return this.sdByVersion.get(url)?.get(version);
  }

  listStructureDefinitions(): string[] {
    return Array.from(this.sdByUrl.keys());
  }

  // ─── ValueSet 查询 ────────────────────────────────────────────────────────

  getValueSet(url: string): ValueSet | undefined {
    return this.vsByUrl.get(url);
  }

  hasValueSet(url: string): boolean {
    return this.vsByUrl.has(url);
  }

  listValueSets(): string[] {
    return Array.from(this.vsByUrl.keys());
  }

  // ─── CodeSystem 查询 ──────────────────────────────────────────────────────

  getCodeSystem(url: string): CodeSystem | undefined {
    return this.csByUrl.get(url);
  }

  hasCodeSystem(url: string): boolean {
    return this.csByUrl.has(url);
  }

  listCodeSystems(): string[] {
    return Array.from(this.csByUrl.keys());
  }

  // ─── SearchParameter 查询 ─────────────────────────────────────────────────

  getSearchParameters(resourceType: string): SearchParameter[] {
    const nameMap = this.spByTypeAndName.get(resourceType);
    if (!nameMap) return [];
    return Array.from(nameMap.values());
  }

  getSearchParameter(resourceType: string, name: string): SearchParameter | undefined {
    return this.spByTypeAndName.get(resourceType)?.get(name);
  }

  getSearchParameterByUrl(url: string): SearchParameter | undefined {
    return this.spByUrl.get(url);
  }

  // ─── 元数据 ───────────────────────────────────────────────────────────────

  registerPackage(pkg: LoadedPackage): void {
    this.packages.push(pkg);
  }

  getLoadedPackages(): LoadedPackage[] {
    return [...this.packages];
  }

  getStatistics(): RegistryStatistics {
    return {
      structureDefinitionCount: this.sdByUrl.size,
      valueSetCount: this.vsByUrl.size,
      codeSystemCount: this.csByUrl.size,
      searchParameterCount: this.spByUrl.size,
      loadedPackages: this.packages.length,
    };
  }
}
