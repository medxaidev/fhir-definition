// ─── FHIR Definition Resource Types ─────────────────────────────────────────

export type FhirDefinitionResourceType =
  | 'StructureDefinition'
  | 'ValueSet'
  | 'CodeSystem'
  | 'SearchParameter';

export const SUPPORTED_RESOURCE_TYPES: ReadonlySet<string> = new Set<FhirDefinitionResourceType>([
  'StructureDefinition',
  'ValueSet',
  'CodeSystem',
  'SearchParameter',
]);

export interface FhirDefinitionResource {
  resourceType: FhirDefinitionResourceType;
  url: string;
  version?: string;
  name?: string;
  [key: string]: unknown;
}

// ─── Narrowed FHIR resource interfaces ──────────────────────────────────────

export interface StructureDefinition extends FhirDefinitionResource {
  resourceType: 'StructureDefinition';
  kind?: string;
  type?: string;
  baseDefinition?: string;
  snapshot?: { element: unknown[] };
  differential?: { element: unknown[] };
}

export interface ValueSet extends FhirDefinitionResource {
  resourceType: 'ValueSet';
  status?: string;
  compose?: {
    include?: Array<{
      system?: string;
      concept?: Array<{ code: string; display?: string }>;
      valueSet?: string[];
      filter?: unknown[];
    }>;
    exclude?: unknown[];
  };
  expansion?: unknown;
}

export interface CodeSystem extends FhirDefinitionResource {
  resourceType: 'CodeSystem';
  status?: string;
  content?: string;
  concept?: Array<{
    code: string;
    display?: string;
    definition?: string;
    concept?: unknown[];
  }>;
}

export interface SearchParameter extends FhirDefinitionResource {
  resourceType: 'SearchParameter';
  code?: string;
  base?: string[];
  type?: string;
  expression?: string;
  description?: string;
}

// ─── Resolver Types ────────────────────────────────────────────────────────

export interface ConceptInfo {
  code: string;
  display?: string;
  definition?: string;
  system: string;
}

// ─── Package Types ──────────────────────────────────────────────────────────

export interface DefinitionPackage {
  name: string;
  version: string;
  path: string;
  dependencies: Record<string, string>;
}

export interface PackageManifest {
  name: string;
  version: string;
  type?: string;
  description?: string;
  dependencies?: Record<string, string>;
  fhirVersions?: string[];
}

export interface LoadedPackage {
  name: string;
  version: string;
  path: string;
  definitionCount: number;
  loadedAt: Date;
}

// ─── Registry Statistics ────────────────────────────────────────────────────

export interface RegistryStatistics {
  structureDefinitionCount: number;
  valueSetCount: number;
  codeSystemCount: number;
  searchParameterCount: number;
  loadedPackages: number;
}

// ─── Load Results ───────────────────────────────────────────────────────────

export interface LoadFileResult {
  success: boolean;
  resource?: FhirDefinitionResource;
  resourceType?: string;
  url?: string;
  error?: LoadError;
}

export interface LoadDirectoryOptions {
  extensions?: string[];
}

export interface LoadDirectoryResult {
  success: boolean;
  resources: FhirDefinitionResource[];
  errors: LoadError[];
  totalFiles: number;
  loadedFiles: number;
}

export interface LoadPackagesResult {
  success: boolean;
  packages: LoadedPackage[];
  totalDefinitions: number;
  errors: LoadError[];
}

// ─── Package Scan & Load Options ───────────────────────────────────────────

export interface PackageScanOptions {
  recursive?: boolean;  // 默认 true
  maxDepth?: number;    // 默认 3
}

export interface DependencyResolutionResult {
  success: boolean;
  sorted: DefinitionPackage[];
  errors: LoadError[];      // CIRCULAR_DEPENDENCY
  warnings: LoadError[];    // MISSING_DEPENDENCY (non-fatal)
}

export interface PackageLoadResult {
  success: boolean;
  package: LoadedPackage;
  resources: FhirDefinitionResource[];
  errors: LoadError[];
}

export interface LoadPackagesOptions {
  resourceTypes?: FhirDefinitionResourceType[];
  scanOptions?: PackageScanOptions;
}

export interface LoadPackagesOutput {
  registry: import('../registry/definition-registry.js').DefinitionRegistry;
  result: LoadPackagesResult;
}

// ─── Package Registry & Cache Types (Phase 2) ──────────────────────────────

export interface PackageRegistryClientOptions {
  /** Registry base URL. Default: 'https://packages.fhir.org' */
  registryUrl?: string;
  /** HTTP timeout in ms. Default: 30000 */
  timeout?: number;
}

export interface PackageCacheOptions {
  /** Local cache directory. Default: ~/.fhir/packages */
  cacheDir?: string;
}

export interface PackageCacheEntry {
  name: string;
  version: string;
  path: string;
}

export interface NamedPackageLoadOptions {
  /** Specific version to load. If omitted, fetches latest. */
  version?: string;
  /** If provided, auto-register loaded resources into this registry. */
  into?: import('../registry/definition-registry.js').DefinitionRegistry;
}

export interface LoadManyOptions {
  /** If provided, auto-register loaded resources into this registry. */
  into?: import('../registry/definition-registry.js').DefinitionRegistry;
  /** Load packages in parallel. Default: false (sequential for dependency safety). */
  parallel?: boolean;
}

export interface LoadPackagesByNameOptions {
  /** If provided, register resources into this registry instead of creating a new one. */
  into?: import('../registry/definition-registry.js').DefinitionRegistry;
  /** Local cache directory. Default: ~/.fhir/packages */
  cacheDir?: string;
  /** Registry URL. Default: 'https://packages.fhir.org' */
  registryUrl?: string;
}

export interface LoadPackagesByNameOutput {
  registry: import('../registry/definition-registry.js').DefinitionRegistry;
  packages: LoadedPackage[];
}

// ─── Error Types ────────────────────────────────────────────────────────────

export enum LoadErrorCode {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_JSON = 'INVALID_JSON',
  NOT_FHIR_RESOURCE = 'NOT_FHIR_RESOURCE',
  UNSUPPORTED_RESOURCE_TYPE = 'UNSUPPORTED_RESOURCE_TYPE',
  IO_ERROR = 'IO_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  MISSING_DEPENDENCY = 'MISSING_DEPENDENCY',
  INVALID_MANIFEST = 'INVALID_MANIFEST',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  CACHE_ERROR = 'CACHE_ERROR',
  EXTRACT_ERROR = 'EXTRACT_ERROR',
}

export interface LoadError {
  code: LoadErrorCode;
  message: string;
  filePath?: string;
  details?: unknown;
}
