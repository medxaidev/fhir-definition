// ─── Model types ────────────────────────────────────────────────────────────
export type {
  FhirDefinitionResourceType,
  FhirDefinitionResource,
  StructureDefinition,
  ValueSet,
  CodeSystem,
  SearchParameter,
  DefinitionPackage,
  PackageManifest,
  LoadedPackage,
  RegistryStatistics,
  LoadFileResult,
  LoadDirectoryOptions,
  LoadDirectoryResult,
  LoadPackagesResult,
  LoadError,
  PackageScanOptions,
  DependencyResolutionResult,
  PackageLoadResult,
  LoadPackagesOptions,
  LoadPackagesOutput,
  ConceptInfo,
} from './model/index.js';

export { LoadErrorCode, SUPPORTED_RESOURCE_TYPES } from './model/index.js';

// ─── Registry ───────────────────────────────────────────────────────────────
export type { DefinitionRegistry } from './registry/index.js';
export { InMemoryDefinitionRegistry } from './registry/index.js';

// ─── Loader ─────────────────────────────────────────────────────────────────
export { FileLoader } from './loader/index.js';
export { DirectoryLoader } from './loader/index.js';

// ─── Package ─────────────────────────────────────────────────────────────────
export { PackageScanner } from './package/index.js';
export type { PackageScanResult } from './package/index.js';
export { DependencyResolver } from './package/index.js';
export { PackageLoader } from './package/index.js';
export { PackageManager } from './package/index.js';

// ─── Contract ───────────────────────────────────────────────────────────────
export type { DefinitionProvider } from './contract/index.js';

// ─── Resolver ───────────────────────────────────────────────────────────────
export { StructureDefinitionResolver } from './resolver/index.js';
export { ValueSetResolver } from './resolver/index.js';
export { CodeSystemResolver } from './resolver/index.js';
export { SearchParameterResolver } from './resolver/index.js';

// ─── Convenience functions ──────────────────────────────────────────────
export { loadFromDirectory } from './load-from-directory.js';
export { loadDefinitionPackages } from './load-definition-packages.js';
