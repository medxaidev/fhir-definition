import type {
  FhirDefinitionResource,
  StructureDefinition,
  ValueSet,
  CodeSystem,
  SearchParameter,
  LoadedPackage,
  RegistryStatistics,
} from '../model/index.js';

export interface DefinitionRegistry {
  // 写入
  register(resource: FhirDefinitionResource): void;

  // StructureDefinition
  getStructureDefinition(url: string): StructureDefinition | undefined;
  hasStructureDefinition(url: string): boolean;
  getStructureDefinitionByVersion(url: string, version: string): StructureDefinition | undefined;
  listStructureDefinitions(): string[];

  // ValueSet
  getValueSet(url: string): ValueSet | undefined;
  hasValueSet(url: string): boolean;
  listValueSets(): string[];

  // CodeSystem
  getCodeSystem(url: string): CodeSystem | undefined;
  hasCodeSystem(url: string): boolean;
  listCodeSystems(): string[];

  // SearchParameter
  getSearchParameters(resourceType: string): SearchParameter[];
  getSearchParameter(resourceType: string, name: string): SearchParameter | undefined;
  getSearchParameterByUrl(url: string): SearchParameter | undefined;

  // 元数据
  registerPackage(pkg: LoadedPackage): void;
  getLoadedPackages(): LoadedPackage[];
  getStatistics(): RegistryStatistics;
}
