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

// ─── Error Types ────────────────────────────────────────────────────────────

export enum LoadErrorCode {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_JSON = 'INVALID_JSON',
  NOT_FHIR_RESOURCE = 'NOT_FHIR_RESOURCE',
  UNSUPPORTED_RESOURCE_TYPE = 'UNSUPPORTED_RESOURCE_TYPE',
  IO_ERROR = 'IO_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface LoadError {
  code: LoadErrorCode;
  message: string;
  filePath?: string;
  details?: unknown;
}
