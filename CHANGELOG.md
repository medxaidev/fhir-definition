# Changelog

All notable changes to `fhir-definition` will be documented in this file.

## [0.4.0] — Runtime Integration Contract

### Added
- `DefinitionProvider` interface (`src/contract/`) — mirrors fhir-runtime's provider interface
- Compile-time structural typing verification: `InMemoryDefinitionRegistry` satisfies `DefinitionProvider`
- Integration scenario tests (Scenarios A/B/C)
- Performance baseline tests (load, query, register throughput)

### API Compatibility Matrix

| DefinitionProvider method | DefinitionRegistry method | Status |
|--------------------------|--------------------------|--------|
| `getStructureDefinition(url)` | `getStructureDefinition(url)` | ✅ Compatible |
| `getValueSet(url)` | `getValueSet(url)` | ✅ Compatible |
| `getCodeSystem(url)` | `getCodeSystem(url)` | ✅ Compatible |
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
