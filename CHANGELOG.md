# Changelog

All notable changes to `fhir-definition` will be documented in this file.

## [0.5.0] — Package Registry & Cache

### Added

- `PackageRegistryClient` — HTTP client for packages.fhir.org (download, getVersions, getLatestVersion)
- `PackageCache` — Local disk cache with native .tgz extraction (zero external deps)
- `PackageLoader.load(name, options?)` — Load packages by name (cache → download → register)
- `PackageLoader.loadMany(packages[], options?)` — Load multiple packages sequentially or in parallel
- `loadPackagesByName()` — Top-level convenience function for name-based loading
- 7 new types: `PackageRegistryClientOptions`, `PackageCacheOptions`, `PackageCacheEntry`, `NamedPackageLoadOptions`, `LoadManyOptions`, `LoadPackagesByNameOptions`, `LoadPackagesByNameOutput`
- 3 new error codes: `DOWNLOAD_FAILED`, `CACHE_ERROR`, `EXTRACT_ERROR`
- `PackageLoaderOptions` interface for enhanced constructor

### Cache Directory Layout

```
~/.fhir/packages/
  hl7.fhir.r4.core#4.0.1/
    package.json
    package/
      StructureDefinition-Patient.json
      ...
```

### Load Flow

```
loader.load('hl7.fhir.r4.core', { version: '4.0.1', into: registry })
  → PackageCache.has()? → yes: use local path
                        → no:  download → extract → cache
  → PackageLoader.loadPackage() → registry.register()
```

### Backward Compatibility

- All v0.4.0 APIs remain unchanged
- `PackageLoader` constructor accepts legacy `DirectoryLoader` or new `PackageLoaderOptions`
- Zero new runtime dependencies (uses Node 18+ native fetch + node:zlib)

---

## [0.4.0] — Runtime Integration Contract

### Added

- `DefinitionProvider` interface (`src/contract/`) — mirrors fhir-runtime's provider interface
- Compile-time structural typing verification: `InMemoryDefinitionRegistry` satisfies `DefinitionProvider`
- Integration scenario tests (Scenarios A/B/C)
- Performance baseline tests (load, query, register throughput)

### API Compatibility Matrix

| DefinitionProvider method           | DefinitionRegistry method           | Status        |
| ----------------------------------- | ----------------------------------- | ------------- |
| `getStructureDefinition(url)`       | `getStructureDefinition(url)`       | ✅ Compatible |
| `getValueSet(url)`                  | `getValueSet(url)`                  | ✅ Compatible |
| `getCodeSystem(url)`                | `getCodeSystem(url)`                | ✅ Compatible |
| `getSearchParameters(resourceType)` | `getSearchParameters(resourceType)` | ✅ Compatible |

`DefinitionRegistry` is a **superset** of `DefinitionProvider` — all provider methods exist with identical signatures.

---

## [0.3.0] — Resolvers & IG Integration

### Added

- `StructureDefinitionResolver` — `resolve()`, `resolveVersioned()` (url|version format), `list()`
- `ValueSetResolver` — `resolve()` (no expansion), `list()`
- `CodeSystemResolver` — `resolve()`, `lookupCode()` (recursive concept tree), `list()`
- `SearchParameterResolver` — `resolveByResourceType()`, `resolveByName()`, `resolveByUrl()`, `getAllResourceTypes()`, `listAll()` (deduplicated)
- `ConceptInfo` type for code lookup results
- Resolver integration tests (package-based)

---

## [0.2.0] — Package System

### Added

- `PackageScanner` — recursive directory scanning with `maxDepth`
- `DependencyResolver` — Kahn's algorithm topological sort, circular dependency detection
- `PackageLoader` — single package loading with `resourceType` filtering
- `PackageManager` — full pipeline: scan → resolve → load → register
- `loadDefinitionPackages()` convenience function
- `PackageScanOptions`, `LoadPackagesOptions`, `LoadPackagesOutput` types
- 3 new error codes: `CIRCULAR_DEPENDENCY`, `MISSING_DEPENDENCY`, `INVALID_MANIFEST`
- Hybrid package loading (ADR: adr-package.md)

---

## [0.1.0] — Core Registry & File Loading

### Added

- `model/` — FHIR definition type system (18 interfaces/types/enums)
- `FileLoader` — single JSON file loading, no-throw contract
- `DirectoryLoader` — directory scanning and batch loading
- `DefinitionRegistry` interface — full read/write API with version-aware SD index
- `InMemoryDefinitionRegistry` — in-memory implementation with 5 index structures
- `loadFromDirectory()` convenience function
- SD version index (`Map<url, Map<version, SD>>`)
- SP dual index (by resourceType+name and by canonical URL)
- List APIs: `listStructureDefinitions()`, `listValueSets()`, `listCodeSystems()`
