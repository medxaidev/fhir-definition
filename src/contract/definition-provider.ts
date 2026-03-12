import type {
  StructureDefinition,
  ValueSet,
  CodeSystem,
  SearchParameter,
} from '../model/index.js';

/**
 * 镜像 fhir-runtime 的 DefinitionProvider 接口（ADR-002）。
 *
 * fhir-runtime 定义此接口用于 Dependency Inversion：
 * runtime 依赖此抽象接口，而不直接依赖 fhir-definition 的具体实现。
 *
 * InMemoryDefinitionRegistry 通过 TypeScript structural typing 自动满足此接口，
 * 无需显式 `implements`。
 */
export interface DefinitionProvider {
  getStructureDefinition(url: string): StructureDefinition | undefined;
  getValueSet(url: string): ValueSet | undefined;
  getCodeSystem(url: string): CodeSystem | undefined;
  getSearchParameters(resourceType: string): SearchParameter[];
}
