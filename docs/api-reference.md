# API Reference — fhir-definition v0.6.0

Complete API documentation for all exported types, classes, and functions.

---

## Table of Contents

- [Types](#types)
  - [Core Types](#core-types)
  - [Package Registry & Cache (v0.5.0)](#package-registry--cache-v050)
- [Interfaces](#interfaces)
- [Classes](#classes)
  - [Core Classes](#core-classes)
  - [Package Registry & Cache (v0.5.0)](#package-registry--cache-classes-v050)
- [Functions](#functions)
- [Enums & Constants](#enums--constants)
- [Migration Guide](#migration-guide)

---

## Types

### Core Types

#### FhirDefinitionResourceType

```typescript
type FhirDefinitionResourceType =
  | "StructureDefinition"
  | "ValueSet"
  | "CodeSystem"
  | "SearchParameter";
```

Supported FHIR definition resource types.

---

#### FhirDefinitionResource

```typescript
interface FhirDefinitionResource {
  resourceType: FhirDefinitionResourceType;
  url: string;
  version?: string;
  name?: string;
  [key: string]: unknown;
}
```

Base interface for all FHIR definition resources.

---

#### StructureDefinition

```typescript
interface StructureDefinition extends FhirDefinitionResource {
  resourceType: "StructureDefinition";
  type?: string;
  kind?: "primitive-type" | "complex-type" | "resource" | "logical";
  baseDefinition?: string;
  snapshot?: unknown;
  differential?: unknown;
}
```

FHIR StructureDefinition resource (profiles, extensions, resources).

---

#### ValueSet

```typescript
interface ValueSet extends FhirDefinitionResource {
  resourceType: "ValueSet";
  status?: string;
  compose?: unknown;
  expansion?: unknown;
}
```

FHIR ValueSet resource. **Note:** `fhir-definition` does not perform expansion.

---

#### CodeSystem

```typescript
interface CodeSystem extends FhirDefinitionResource {
  resourceType: "CodeSystem";
  status?: string;
  content?: string;
  concept?: Array<{
    code: string;
    display?: string;
    definition?: string;
    concept?: unknown[];
  }>;
}
```

FHIR CodeSystem resource with hierarchical concept tree.

---

#### SearchParameter

```typescript
interface SearchParameter extends FhirDefinitionResource {
  resourceType: "SearchParameter";
  code?: string;
  base?: string[];
  type?: string;
  expression?: string;
  description?: string;
}
```

FHIR SearchParameter resource.

---

#### ConceptInfo

```typescript
interface ConceptInfo {
  code: string;
  display?: string;
  definition?: string;
  system: string;
}
```

Result type for `CodeSystemResolver.lookupCode()`.

---

#### DefinitionPackage

```typescript
interface DefinitionPackage {
  name: string;
  version: string;
  path: string;
  dependencies: Record<string, string>;
}
```

Parsed package manifest.

---

#### LoadedPackage

```typescript
interface LoadedPackage {
  name: string;
  version: string;
  path: string;
  definitionCount: number;
  loadedAt: Date;
}
```

Metadata for a successfully loaded package.

---

#### RegistryStatistics

```typescript
interface RegistryStatistics {
  structureDefinitionCount: number;
  valueSetCount: number;
  codeSystemCount: number;
  searchParameterCount: number;
  packageCount: number;
}
```

Registry content statistics.

---

#### LoadError

```typescript
interface LoadError {
  code: LoadErrorCode;
  message: string;
  path?: string;
  details?: unknown;
}
```

Error object returned by loaders (no-throw contract).

---

#### LoadPackagesOptions

```typescript
interface LoadPackagesOptions {
  scanOptions?: PackageScanOptions;
  resourceTypes?: FhirDefinitionResourceType[];
}
```

Options for `loadDefinitionPackages()` and `PackageManager.loadPackages()`.

---

#### LoadPackagesOutput

```typescript
interface LoadPackagesOutput {
  registry: DefinitionRegistry;
  result: LoadPackagesResult;
}
```

Return type for `loadDefinitionPackages()`.

---

### Package Registry & Cache (v0.5.0)

#### PackageRegistryClientOptions

```typescript
interface PackageRegistryClientOptions {
  registryUrl?: string;
  timeout?: number; // default: 30000 (ms)

  // v0.6.0
  retry?: {
    maxAttempts?: number; // default: 3
    delayMs?: number; // default: 1000 (exponential backoff base)
    timeout?: number; // default: 30000 (ms)
  };
  offline?: boolean; // default: false
}
```

Options for `PackageRegistryClient`. Default registry: `https://packages.fhir.org`

- `retry` — Configurable retry with exponential backoff (v0.6.0)
- `offline` — When `true`, skip network requests and use only cached packages (v0.6.0)

---

#### PackageCacheOptions

```typescript
interface PackageCacheOptions {
  cacheDir?: string;
}
```

Options for `PackageCache`. Default cache directory: `~/.fhir/packages`

---

#### PackageCacheEntry

```typescript
interface PackageCacheEntry {
  name: string;
  version: string;
  path: string;
}
```

Entry returned by `PackageCache.list()`.

---

#### NamedPackageLoadOptions

```typescript
interface NamedPackageLoadOptions {
  version?: string;
  into?: DefinitionRegistry;
}
```

Options for `PackageLoader.load()` name-based loading.

---

#### LoadManyOptions

```typescript
interface LoadManyOptions {
  into?: DefinitionRegistry;
  parallel?: boolean;
}
```

Options for `PackageLoader.loadMany()`. Default: sequential loading.

---

#### LoadPackagesByNameOptions

```typescript
interface LoadPackagesByNameOptions {
  cacheDir?: string;
  registryUrl?: string;
  into?: DefinitionRegistry;
}
```

Options for `loadPackagesByName()` convenience function.

---

#### LoadPackagesByNameOutput

```typescript
interface LoadPackagesByNameOutput {
  registry: DefinitionRegistry;
  packages: LoadedPackage[];
}
```

Return type for `loadPackagesByName()`.

---

#### PackageLoaderOptions

```typescript
interface PackageLoaderOptions
  extends PackageCacheOptions, PackageRegistryClientOptions {}
```

Combined options for enhanced `PackageLoader` constructor (v0.5.0).

---

## Interfaces

### DefinitionRegistry

Central read/write interface for FHIR definitions.

```typescript
interface DefinitionRegistry {
  // Write
  register(resource: FhirDefinitionResource): void;
  registerPackage(pkg: LoadedPackage): void;

  // StructureDefinition
  getStructureDefinition(url: string): StructureDefinition | undefined;
  getStructureDefinitionByVersion(
    url: string,
    version: string,
  ): StructureDefinition | undefined;
  hasStructureDefinition(url: string): boolean;
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
  getSearchParameter(
    resourceType: string,
    name: string,
  ): SearchParameter | undefined;
  getSearchParameterByUrl(url: string): SearchParameter | undefined;

  // Metadata
  getLoadedPackages(): LoadedPackage[];
  getStatistics(): RegistryStatistics;
  getLoadedFhirVersions(): string[]; // v0.6.0
}
```

**Implementation:** `InMemoryDefinitionRegistry`

**`getLoadedFhirVersions()` (v0.6.0):** Returns deduplicated FHIR version strings extracted from loaded packages' `fhirVersions` field. Returns empty array if no packages loaded.

---

#### DefinitionProvider

Minimal interface for `fhir-runtime` integration (structural typing).

```typescript
interface DefinitionProvider {
  getStructureDefinition(url: string): StructureDefinition | undefined;
  getValueSet(url: string): ValueSet | undefined;
  getCodeSystem(url: string): CodeSystem | undefined;
  getSearchParameters(resourceType: string): SearchParameter[];
}
```

**Note:** `InMemoryDefinitionRegistry` satisfies this interface without explicit `implements`.

---

## Classes

### Core Classes

#### InMemoryDefinitionRegistry

In-memory implementation of `DefinitionRegistry`.

```typescript
class InMemoryDefinitionRegistry implements DefinitionRegistry {
  constructor();

  // All DefinitionRegistry methods
  // See interface documentation above
}
```

**Index structures:**

- SD main index: `Map<url, StructureDefinition>`
- SD version index: `Map<url, Map<version, StructureDefinition>>`
- VS index: `Map<url, ValueSet>`
- CS index: `Map<url, CodeSystem>`
- SP dual index: `Map<resourceType, Map<name, SearchParameter>>` + `Map<url, SearchParameter>`

**Performance:** O(1) lookups for all queries.

---

#### FileLoader

Loads a single FHIR JSON file.

```typescript
class FileLoader {
  loadFile(filePath: string): LoadFileResult;
}
```

**Returns:** `{ resource?, error? }` (no-throw contract)

---

#### DirectoryLoader

Loads all JSON files from a directory.

```typescript
class DirectoryLoader {
  loadDirectory(
    dirPath: string,
    options?: LoadDirectoryOptions,
  ): LoadDirectoryResult;
}
```

**Options:**

- `extensions?: string[]` — File extensions to load (default: `['.json']`)

**Returns:** `{ resources: FhirDefinitionResource[], errors: LoadError[] }`

---

#### PackageScanner

Scans directories for FHIR packages.

```typescript
class PackageScanner {
  scan(rootPath: string, options?: PackageScanOptions): PackageScanResult;
}
```

**Options:**

- `recursive?: boolean` — Scan subdirectories (default: `true`)
- `maxDepth?: number` — Maximum recursion depth (default: `Infinity`)

**Returns:** `{ packages: DefinitionPackage[], errors: LoadError[] }`

---

#### DependencyResolver

Resolves package dependencies using topological sort (Kahn's algorithm).

```typescript
class DependencyResolver {
  resolve(packages: DefinitionPackage[]): DependencyResolutionResult;
}
```

**Returns:** `{ sortedPackages: DefinitionPackage[], errors: LoadError[], warnings: string[] }`

**Errors:**

- `CIRCULAR_DEPENDENCY` — Cycle detected
- `MISSING_DEPENDENCY` — Warning only (non-fatal)

---

#### PackageLoader

Loads definitions from a single package.

```typescript
class PackageLoader {
  loadPackage(
    pkg: DefinitionPackage,
    options?: { resourceTypes?: FhirDefinitionResourceType[] },
  ): PackageLoadResult;
}
```

**Returns:** `{ resources: FhirDefinitionResource[], errors: LoadError[] }`

---

#### PackageManager

Orchestrates full package loading pipeline.

```typescript
class PackageManager {
  constructor(registry?: InMemoryDefinitionRegistry);

  loadPackages(
    rootPath: string,
    options?: LoadPackagesOptions,
  ): LoadPackagesOutput;
  getRegistry(): DefinitionRegistry;
  getLoadedPackages(): LoadedPackage[];
}
```

**Pipeline:**

1. Scan packages (`PackageScanner`)
2. Resolve dependencies (`DependencyResolver`)
3. Load each package (`PackageLoader`)
4. Register resources (`registry.register()`)
5. Register package metadata (`registry.registerPackage()`)

---

#### StructureDefinitionResolver

High-level query API for StructureDefinitions.

```typescript
class StructureDefinitionResolver {
  constructor(registry: DefinitionRegistry);

  resolve(url: string): StructureDefinition | undefined;
  resolveVersioned(
    url: string,
    version?: string,
  ): StructureDefinition | undefined;
  list(): string[];
}
```

**`resolveVersioned()` supports `url|version` format:**

- `resolveVersioned('http://url|4.0.1')` → version `4.0.1`
- `resolveVersioned('http://url', '4.0.1')` → version `4.0.1`
- Pipe format takes precedence over explicit parameter

---

#### ValueSetResolver

High-level query API for ValueSets.

```typescript
class ValueSetResolver {
  constructor(registry: DefinitionRegistry);

  resolve(url: string): ValueSet | undefined;
  list(): string[];
}
```

**Note:** Does not perform expansion. Returns raw ValueSet.

---

#### CodeSystemResolver

High-level query API for CodeSystems.

```typescript
class CodeSystemResolver {
  constructor(registry: DefinitionRegistry);

  resolve(url: string): CodeSystem | undefined;
  lookupCode(system: string, code: string): ConceptInfo | undefined;
  list(): string[];
}
```

**`lookupCode()` performs recursive search** through nested concept trees.

---

#### SearchParameterResolver

High-level query API for SearchParameters.

```typescript
class SearchParameterResolver {
  constructor(registry: DefinitionRegistry);

  resolveByResourceType(resourceType: string): SearchParameter[];
  resolveByName(
    resourceType: string,
    name: string,
  ): SearchParameter | undefined;
  resolveByUrl(url: string): SearchParameter | undefined;
  getAllResourceTypes(): string[];
  listAll(): SearchParameter[];
}
```

**`listAll()` returns deduplicated** SearchParameters (multi-base SPs appear once).

---

### Package Registry & Cache Classes (v0.5.0)

#### PackageRegistryClient

HTTP client for downloading FHIR packages from packages.fhir.org.

```typescript
class PackageRegistryClient {
  constructor(options?: PackageRegistryClientOptions);

  download(name: string, version: string): Promise<Buffer>;
  getVersions(name: string): Promise<string[]>;
  getLatestVersion(name: string): Promise<string>;
  resolveVersion(name: string, range: string): Promise<string>; // v0.6.0
  getRegistryUrl(): string;
}
```

**Methods:**

- `download()` — Download package tarball (.tgz), with retry if configured
- `getVersions()` — List all available versions for a package
- `getLatestVersion()` — Get latest version (from dist-tags.latest or last version)
- `resolveVersion()` — **(v0.6.0)** Resolve semver range to concrete version (`^4.0.0` → `4.0.1`, `latest` → latest, exact passthrough)
- `getRegistryUrl()` — Get configured registry URL

**Example:**

```typescript
const client = new PackageRegistryClient();
const tarball = await client.download("hl7.fhir.r4.core", "4.0.1");
const versions = await client.getVersions("hl7.fhir.r4.core");

// v0.6.0: Resolve semver ranges
const resolved = await client.resolveVersion("hl7.fhir.r4.core", "^4.0.0");
console.log(resolved); // '4.0.1'

// v0.6.0: Retry & offline
const resilientClient = new PackageRegistryClient({
  retry: { maxAttempts: 3, delayMs: 1000 },
  offline: false,
});
```

---

#### PackageCache

Local disk cache for FHIR packages with native .tgz extraction.

```typescript
class PackageCache {
  constructor(options?: PackageCacheOptions);

  has(name: string, version: string): boolean;
  getPath(name: string, version: string): string | undefined;
  put(name: string, version: string, tarball: Buffer): string;
  list(): PackageCacheEntry[];
  getCacheDir(): string;
}
```

**Methods:**

- `has()` — Check if package is cached
- `getPath()` — Get path to cached package directory
- `put()` — Extract and cache a tarball, returns directory path
- `list()` — List all cached packages
- `getCacheDir()` — Get cache directory path

**Cache Layout:**

```
~/.fhir/packages/
  hl7.fhir.r4.core#4.0.1/
    package.json
    package/
      StructureDefinition-Patient.json
      ...
```

**Example:**

```typescript
const cache = new PackageCache();
if (!cache.has("hl7.fhir.r4.core", "4.0.1")) {
  const tarball = await client.download("hl7.fhir.r4.core", "4.0.1");
  cache.put("hl7.fhir.r4.core", "4.0.1", tarball);
}
const path = cache.getPath("hl7.fhir.r4.core", "4.0.1");
```

---

#### PackageLoader (Enhanced v0.5.0)

Updated with name-based loading methods.

```typescript
class PackageLoader {
  constructor(optionsOrLoader?: DirectoryLoader | PackageLoaderOptions);

  // Existing API (v0.1-v0.4)
  loadPackage(
    pkg: DefinitionPackage,
    options?: { resourceTypes?: FhirDefinitionResourceType[] },
  ): PackageLoadResult;

  // New API (v0.5.0)
  load(
    name: string,
    options?: NamedPackageLoadOptions,
  ): Promise<PackageLoadResult>;
  loadMany(
    packages: Array<{ name: string; version?: string }>,
    options?: LoadManyOptions,
  ): Promise<PackageLoadResult[]>;
  getCache(): PackageCache;
  getClient(): PackageRegistryClient;
}
```

**New Methods (v0.5.0):**

- `load()` — Load package by name (cache → download → register)
- `loadMany()` — Load multiple packages (sequential by default, parallel optional)
- `getCache()` — Access underlying PackageCache
- `getClient()` — Access underlying PackageRegistryClient

**Load Flow:**

```
loader.load('hl7.fhir.r4.core', { version: '4.0.1', into: registry })
  → PackageCache.has()? → yes: use local path
                        → no:  download → extract → cache
  → PackageLoader.loadPackage() → registry.register()
```

**Example:**

```typescript
const loader = new PackageLoader({
  cacheDir: "~/.fhir/packages",
  registryUrl: "https://packages.fhir.org",
});

// Load single package
await loader.load("hl7.fhir.r4.core", { version: "4.0.1", into: registry });

// Load multiple packages
await loader.loadMany(
  [
    { name: "hl7.fhir.r4.core", version: "4.0.1" },
    { name: "hl7.fhir.us.core", version: "6.1.0" },
  ],
  { into: registry },
);
```

---

## Functions

### loadFromDirectory

Convenience function to load all definitions from a directory.

```typescript
function loadFromDirectory(
  dirPath: string,
  options?: LoadDirectoryOptions,
): DefinitionRegistry;
```

**Returns:** `InMemoryDefinitionRegistry` with all loaded resources.

**Example:**

```typescript
const registry = loadFromDirectory("./definitions");
```

---

#### loadDefinitionPackages

Convenience function to load multi-package structure with dependency resolution.

```typescript
function loadDefinitionPackages(
  rootPath: string,
  options?: LoadPackagesOptions,
): LoadPackagesOutput;
```

**Returns:** `{ registry: DefinitionRegistry, result: LoadPackagesResult }`

**Example:**

```typescript
const { registry, result } = loadDefinitionPackages("./definitions");
console.log(result.loadedPackages); // [{ name: 'r4.core', ... }, ...]
```

---

### loadPackagesByName (v0.5.0)

Convenience function to load FHIR packages by name from packages.fhir.org.

```typescript
async function loadPackagesByName(
  packages: Array<{ name: string; version?: string }>,
  options?: LoadPackagesByNameOptions,
): Promise<LoadPackagesByNameOutput>;
```

**Returns:** `{ registry: DefinitionRegistry, packages: LoadedPackage[] }`

**Example:**

```typescript
const { registry, packages } = await loadPackagesByName([
  { name: "hl7.fhir.r4.core", version: "4.0.1" },
  { name: "hl7.fhir.us.core", version: "6.1.0" },
]);

console.log(packages.map((p) => p.name)); // ['hl7.fhir.r4.core', 'hl7.fhir.us.core']
```

---

## Enums & Constants

### LoadErrorCode

```typescript
enum LoadErrorCode {
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  INVALID_JSON = "INVALID_JSON",
  NOT_FHIR_RESOURCE = "NOT_FHIR_RESOURCE",
  UNSUPPORTED_RESOURCE_TYPE = "UNSUPPORTED_RESOURCE_TYPE",
  CIRCULAR_DEPENDENCY = "CIRCULAR_DEPENDENCY",
  MISSING_DEPENDENCY = "MISSING_DEPENDENCY",
  INVALID_MANIFEST = "INVALID_MANIFEST",
  IO_ERROR = "IO_ERROR",
  // v0.5.0 Package Registry & Cache
  DOWNLOAD_FAILED = "DOWNLOAD_FAILED",
  CACHE_ERROR = "CACHE_ERROR",
  EXTRACT_ERROR = "EXTRACT_ERROR",
  // v0.6.0 Semver & Offline
  VERSION_RESOLVE_FAILED = "VERSION_RESOLVE_FAILED",
  OFFLINE_NOT_CACHED = "OFFLINE_NOT_CACHED",
}
```

Error codes returned by loaders and package registry operations.

---

#### SUPPORTED_RESOURCE_TYPES

```typescript
const SUPPORTED_RESOURCE_TYPES: readonly FhirDefinitionResourceType[] = [
  "StructureDefinition",
  "ValueSet",
  "CodeSystem",
  "SearchParameter",
];
```

List of supported FHIR definition resource types.

---

## Usage Patterns

### Pattern 1: Simple Directory Loading

```typescript
import { loadFromDirectory } from "fhir-definition";

const registry = loadFromDirectory("./my-definitions");
const patient = registry.getStructureDefinition(
  "http://hl7.org/fhir/StructureDefinition/Patient",
);
```

### Pattern 2: Multi-Package with Dependencies

```typescript
import { loadDefinitionPackages } from "fhir-definition";

const { registry, result } = loadDefinitionPackages("./definitions");

// Check for errors
if (result.errors.length > 0) {
  console.error("Load errors:", result.errors);
}

// Query loaded packages
console.log(
  "Loaded packages:",
  result.loadedPackages.map((p) => p.name),
);
```

### Pattern 3: Runtime Integration

```typescript
import {
  loadDefinitionPackages,
  type DefinitionProvider,
} from "fhir-definition";

const { registry } = loadDefinitionPackages("./definitions");

// Pass to runtime (structural typing)
const provider: DefinitionProvider = registry;
const runtime = new FhirRuntime({ definitions: provider });
```

### Pattern 4: Advanced Queries with Resolvers

```typescript
import {
  loadFromDirectory,
  StructureDefinitionResolver,
  SearchParameterResolver,
} from "fhir-definition";

const registry = loadFromDirectory("./definitions");
const sdResolver = new StructureDefinitionResolver(registry);
const spResolver = new SearchParameterResolver(registry);

// Version-aware SD resolution
const patientV4 = sdResolver.resolveVersioned(
  "http://hl7.org/fhir/StructureDefinition/Patient|4.0.1",
);
const patientV5 = sdResolver.resolveVersioned(
  "http://hl7.org/fhir/StructureDefinition/Patient|5.0.0",
);

// Get all SPs for a resource type
const patientSPs = spResolver.resolveByResourceType("Patient");

// Get all resource types with SPs
const resourceTypes = spResolver.getAllResourceTypes();
```

### Pattern 5: Load by Name from Registry

```typescript
import { loadPackagesByName } from "fhir-definition";

// One-line convenience function
const { registry, packages } = await loadPackagesByName([
  { name: "hl7.fhir.r4.core", version: "4.0.1" },
  { name: "hl7.fhir.us.core", version: "6.1.0" },
]);

console.log(packages.map((p) => `${p.name}@${p.version}`));
// ['hl7.fhir.r4.core@4.0.1', 'hl7.fhir.us.core@6.1.0']
```

### Pattern 6: Advanced Package Loading

```typescript
import { PackageLoader, InMemoryDefinitionRegistry } from "fhir-definition";

const registry = new InMemoryDefinitionRegistry();
const loader = new PackageLoader({
  cacheDir: process.env.FHIR_CACHE ?? "~/.fhir/packages",
  registryUrl: "https://packages.fhir.org",
});

// Load with auto-registration
await loader.load("hl7.fhir.r4.core", {
  version: "4.0.1",
  into: registry,
});

// Load multiple packages in parallel
await loader.loadMany(
  [
    { name: "hl7.fhir.us.core", version: "6.1.0" },
    { name: "hl7.fhir.us.mcode", version: "3.0.0" },
  ],
  {
    into: registry,
    parallel: true,
  },
);

// Access cache
const cache = loader.getCache();
console.log(cache.list()); // All cached packages
```

---

## Performance Characteristics

| Operation                           | Complexity                 | Typical Time        |
| ----------------------------------- | -------------------------- | ------------------- |
| `register()`                        | O(1)                       | <0.01ms             |
| `getStructureDefinition()`          | O(1)                       | <0.01ms             |
| `getStructureDefinitionByVersion()` | O(1)                       | <0.01ms             |
| `getSearchParameters()`             | O(1)                       | <0.1ms              |
| `lookupCode()`                      | O(n) worst case            | <1ms (small trees)  |
| `loadFromDirectory()`               | O(n) files                 | <100ms (15 files)   |
| `loadDefinitionPackages()`          | O(n) packages + O(e) edges | <200ms (3 packages) |

Where:

- n = number of items
- e = number of dependency edges

---

## Error Handling

All loaders follow a **no-throw contract**:

```typescript
// ✅ Good: Check for errors
const result = loader.loadFile("./file.json");
if (result.error) {
  console.error("Load failed:", result.error.message);
} else {
  registry.register(result.resource!);
}

// ❌ Bad: Loaders never throw
try {
  loader.loadFile("./nonexistent.json"); // Returns { error: ... }, doesn't throw
} catch (e) {
  // This will never execute
}
```

---

## TypeScript Tips

### Narrow Resource Types

```typescript
const resource = registry.getStructureDefinition(url);
if (resource && resource.resourceType === "StructureDefinition") {
  // TypeScript knows resource is StructureDefinition
  console.log(resource.type);
}
```

### Use Type Guards

```typescript
function isStructureDefinition(
  r: FhirDefinitionResource,
): r is StructureDefinition {
  return r.resourceType === "StructureDefinition";
}

const resources = directoryLoader.loadDirectory("./defs").resources;
const sds = resources.filter(isStructureDefinition);
```

### Pattern 7: Semver Resolution (v0.6.0)

```typescript
import { PackageRegistryClient } from "fhir-definition";

const client = new PackageRegistryClient();

// Resolve caret range
const v1 = await client.resolveVersion("hl7.fhir.r4.core", "^4.0.0");
console.log(v1); // '4.0.1'

// Resolve 'latest'
const v2 = await client.resolveVersion("hl7.fhir.r4.core", "latest");

// Exact version passthrough
const v3 = await client.resolveVersion("hl7.fhir.r4.core", "4.0.1");
```

### Pattern 8: FHIR Version Introspection (v0.6.0)

```typescript
import { loadPackagesByName } from "fhir-definition";

const { registry } = await loadPackagesByName([
  { name: "hl7.fhir.r4.core", version: "4.0.1" },
  { name: "hl7.fhir.us.core", version: "6.1.0" },
]);

console.log(registry.getLoadedFhirVersions()); // ['4.0.1']
console.log(registry.getLoadedPackages().map((p) => p.name));
```

### Pattern 9: Resilient Network Loading (v0.6.0)

```typescript
import { PackageRegistryClient, PackageLoader } from "fhir-definition";

// Configure retry and offline fallback
const client = new PackageRegistryClient({
  retry: { maxAttempts: 5, delayMs: 2000, timeout: 60000 },
  offline: false,
});

// Offline mode: only use cached packages
const offlineClient = new PackageRegistryClient({ offline: true });
```

---

## Migration Guide

### From v0.5.0 to v0.6.0

**New exports:**

- `DefinitionRegistry.getLoadedFhirVersions()` method
- `PackageRegistryClient.resolveVersion()` method
- 2 new error codes: `VERSION_RESOLVE_FAILED`, `OFFLINE_NOT_CACHED`

**Enhanced APIs:**

- `PackageRegistryClientOptions` gains `retry` and `offline` fields (all optional)
- `InMemoryDefinitionRegistry` implements `getLoadedFhirVersions()` via `registerPackage()`
- All network calls in `PackageRegistryClient` now support configurable retry with exponential backoff
- Download failures automatically fall back to stale cached versions when available

**No breaking changes.** All v0.5.0 APIs remain unchanged.

**Migration steps:**

1. Update package: `npm install fhir-definition@0.6.0`
2. (Optional) Use FHIR version introspection:

   ```typescript
   const versions = registry.getLoadedFhirVersions();
   console.log(versions); // ['4.0.1']
   ```

3. (Optional) Use semver resolution:

   ```typescript
   const client = new PackageRegistryClient();
   const version = await client.resolveVersion("hl7.fhir.r4.core", "^4.0.0");
   ```

4. (Optional) Configure retry/offline:

   ```typescript
   const client = new PackageRegistryClient({
     retry: { maxAttempts: 3 },
     offline: false,
   });
   ```

---

### From v0.4.0 to v0.5.0

**New exports:**

- `PackageRegistryClient` class
- `PackageCache` class
- `loadPackagesByName()` function
- 7 new types: `PackageRegistryClientOptions`, `PackageCacheOptions`, `PackageCacheEntry`, `NamedPackageLoadOptions`, `LoadManyOptions`, `LoadPackagesByNameOptions`, `LoadPackagesByNameOutput`
- `PackageLoaderOptions` interface
- 3 new error codes: `DOWNLOAD_FAILED`, `CACHE_ERROR`, `EXTRACT_ERROR`

**Enhanced APIs:**

- `PackageLoader` constructor now accepts `PackageLoaderOptions` (backward compatible with `DirectoryLoader`)
- `PackageLoader` gains new methods: `load()`, `loadMany()`, `getCache()`, `getClient()`

**No breaking changes.** All v0.4.0 APIs remain unchanged.

**Migration steps:**

1. Update package: `npm install fhir-definition@0.5.0`
2. (Optional) Use new name-based loading:

   ```typescript
   // Old way (still works)
   const { registry } = loadDefinitionPackages("./local-packages");

   // New way (v0.5.0)
   const { registry } = await loadPackagesByName([
     { name: "hl7.fhir.r4.core", version: "4.0.1" },
   ]);
   ```

### From v0.3.0 to v0.4.0

**New exports:**

- `DefinitionProvider` interface
- `ConceptInfo` type

**No breaking changes.** All v0.3.0 APIs remain unchanged.

---

## See Also

- [README.md](../README.md) — Quick start guide
- [CHANGELOG.md](../CHANGELOG.md) — Version history
- [ARCHITECTURE.md](../devdocs/ARCHITECTURE.md) — System design
- [STAGE-A v0.6.0](../devdocs/all/stage/STAGE-A-fhir-definition-v0.6.md) — v0.6.0 task document
