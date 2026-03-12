# fhir-definition

> Pure FHIR Definition Store — Zero dependencies, filesystem-first, production-ready

[![npm version](https://img.shields.io/npm/v/fhir-definition.svg)](https://www.npmjs.com/package/fhir-definition)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-215%2F215-brightgreen.svg)](./devdocs/ROADMAP.md)

**fhir-definition** is a lightweight, zero-dependency TypeScript library for loading, managing, and querying FHIR definition resources (StructureDefinition, ValueSet, CodeSystem, SearchParameter). Designed for embedded FHIR stacks, it provides a clean separation between definition storage and runtime validation logic.

---

## Features

- ✅ **Zero Dependencies** — Pure TypeScript, no external runtime dependencies
- ✅ **Filesystem-First** — Load from directories, packages, or custom sources
- ✅ **Package System** — Multi-package loading with dependency resolution (Kahn's algorithm)
- ✅ **Version-Aware** — Dual SD index: main + versioned (`url|version` format support)
- ✅ **Resolver API** — High-level query interfaces for all resource types
- ✅ **Runtime Integration** — Structural typing compatibility with `fhir-runtime` via `DefinitionProvider`
- ✅ **Performance** — O(1) lookups, <200ms multi-package load, <0.01ms query
- ✅ **100% Test Coverage** — 215 tests across 20 test files
- ✅ **TypeScript Native** — Full type safety with ESM + CJS dual build

---

## Installation

```bash
npm install fhir-definition
```

**Requirements:**

- Node.js ≥18.0.0
- TypeScript ≥5.0 (for type definitions)

---

## Quick Start

### Load from Directory

```typescript
import { loadFromDirectory } from "fhir-definition";

const registry = loadFromDirectory("./definitions");

// Query resources
const patientSD = registry.getStructureDefinition(
  "http://hl7.org/fhir/StructureDefinition/Patient",
);
const genderVS = registry.getValueSet(
  "http://hl7.org/fhir/ValueSet/administrative-gender",
);
const patientSPs = registry.getSearchParameters("Patient");
```

### Load Multi-Package with Dependencies

```typescript
import { loadDefinitionPackages } from "fhir-definition";

// Directory structure:
// definitions/
//   hl7.fhir.r4.core/
//     package.json
//     package/
//       StructureDefinition-Patient.json
//   hl7.fhir.us.core/
//     package.json (depends on r4.core)
//     package/
//       StructureDefinition-us-core-patient.json

const { registry, result } = loadDefinitionPackages("./definitions");

console.log(result.loadedPackages); // [r4.core, us.core] (dependency order)
console.log(registry.getStatistics()); // { structureDefinitionCount: 4, ... }
```

### Use Resolvers (High-Level API)

```typescript
import {
  loadFromDirectory,
  StructureDefinitionResolver,
  CodeSystemResolver,
} from "fhir-definition";

const registry = loadFromDirectory("./definitions");
const sdResolver = new StructureDefinitionResolver(registry);
const csResolver = new CodeSystemResolver(registry);

// Resolve with version
const patient = sdResolver.resolveVersioned(
  "http://hl7.org/fhir/StructureDefinition/Patient|4.0.1",
);

// Lookup code in CodeSystem
const conceptInfo = csResolver.lookupCode(
  "http://terminology.hl7.org/CodeSystem/observation-category",
  "vital-signs",
);
console.log(conceptInfo); // { code: 'vital-signs', display: 'Vital Signs', system: '...' }
```

### Integration with fhir-runtime

```typescript
import { loadDefinitionPackages } from "fhir-definition";
import { FhirRuntime } from "fhir-runtime"; // hypothetical

const { registry } = loadDefinitionPackages("./definitions");

// registry satisfies DefinitionProvider interface (structural typing)
const runtime = new FhirRuntime({ definitions: registry });

// Runtime can now query definitions for validation
runtime.validate(
  patientResource,
  "http://hl7.org/fhir/StructureDefinition/Patient",
);
```

---

## API Overview

### Core Types

- `StructureDefinition`, `ValueSet`, `CodeSystem`, `SearchParameter` — FHIR resource types
- `DefinitionRegistry` — Central read/write interface
- `DefinitionProvider` — Minimal interface for runtime integration (4 methods)
- `ConceptInfo` — Code lookup result type

### Registry API

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
}
```

### Resolver API

```typescript
// StructureDefinitionResolver
resolve(url: string): StructureDefinition | undefined;
resolveVersioned(url: string, version?: string): StructureDefinition | undefined; // supports url|version
list(): string[];

// ValueSetResolver
resolve(url: string): ValueSet | undefined;
list(): string[];

// CodeSystemResolver
resolve(url: string): CodeSystem | undefined;
lookupCode(system: string, code: string): ConceptInfo | undefined; // recursive concept tree search
list(): string[];

// SearchParameterResolver
resolveByResourceType(resourceType: string): SearchParameter[];
resolveByName(resourceType: string, name: string): SearchParameter | undefined;
resolveByUrl(url: string): SearchParameter | undefined;
getAllResourceTypes(): string[];
listAll(): SearchParameter[]; // deduplicated
```

### Package System

```typescript
// Scan packages
const scanner = new PackageScanner();
const scanResult = scanner.scan("./definitions", {
  recursive: true,
  maxDepth: 3,
});

// Resolve dependencies (topological sort)
const resolver = new DependencyResolver();
const { sortedPackages, errors } = resolver.resolve(scanResult.packages);

// Load single package
const loader = new PackageLoader();
const loadResult = loader.loadPackage(pkg, {
  resourceTypes: ["StructureDefinition"],
});

// Full pipeline
const manager = new PackageManager();
const { registry, result } = manager.loadPackages("./definitions");
```

---

## Package Structure

FHIR packages follow the official HL7 structure:

```
my-package/
  package.json          # Manifest with name, version, dependencies
  package/              # Definition resources
    StructureDefinition-Patient.json
    ValueSet-gender.json
    CodeSystem-status.json
    SearchParameter-name.json
```

**package.json example:**

```json
{
  "name": "hl7.fhir.us.core",
  "version": "6.1.0",
  "type": "fhir-definition",
  "dependencies": {
    "hl7.fhir.r4.core": "4.0.1"
  }
}
```

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Application (fhir-runtime, fhir-persistence) │
└─────────────────┬───────────────────────────┘
                  │ DefinitionProvider interface
┌─────────────────▼───────────────────────────┐
│         fhir-definition (this package)       │
│  ┌──────────────────────────────────────┐   │
│  │  Resolvers (high-level query API)    │   │
│  └──────────────┬───────────────────────┘   │
│  ┌──────────────▼───────────────────────┐   │
│  │  DefinitionRegistry (core storage)   │   │
│  └──────────────┬───────────────────────┘   │
│  ┌──────────────▼───────────────────────┐   │
│  │  Package System (load, scan, resolve)│   │
│  └──────────────┬───────────────────────┘   │
│  ┌──────────────▼───────────────────────┐   │
│  │  Loaders (file, directory)           │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Design Principles:**

- No HTTP, no database, no validation logic
- Filesystem-first with future extensibility
- Dependency Inversion (runtime depends on abstract `DefinitionProvider`)
- Zero runtime dependencies

---

## Performance

Measured on fixture datasets (Phase 4 baseline tests):

| Operation                               | Time                    |
| --------------------------------------- | ----------------------- |
| `loadFromDirectory()` (15 files)        | <100ms                  |
| `loadDefinitionPackages()` (3 packages) | <200ms                  |
| `getStructureDefinition()` (Map.get)    | <0.01ms per query       |
| `getSearchParameters()`                 | <0.1ms per query        |
| `register()` throughput                 | 1000 resources in <50ms |

---

## Testing

- **215 tests** across 20 test files
- **100% pass rate** (vitest)
- **Zero TypeScript errors** (`tsc --noEmit`)
- Test categories: unit, integration, fixture-based, performance, contract

```bash
npm test  # Run all tests
```

---

## Documentation

- [CHANGELOG.md](./CHANGELOG.md) — Version history
- [ROADMAP.md](./devdocs/ROADMAP.md) — Development roadmap (Phase 1–4 complete)
- [ARCHITECTURE.md](./devdocs/ARCHITECTURE.md) — System design
- [v1.0-evaluation.md](./devdocs/v1.0-evaluation.md) — v1.0 readiness assessment
- [API Reference](./docs/api-reference.md) — Complete API documentation

---

## Version History

| Version | Status | Description                                         |
| ------- | ------ | --------------------------------------------------- |
| v0.1.0  | ✅     | Core registry + file loading                        |
| v0.2.0  | ✅     | Package system + dependency resolution              |
| v0.3.0  | ✅     | Resolvers + IG integration                          |
| v0.4.0  | ✅     | Runtime integration contract + performance baseline |
| v1.0.0  | ⏳     | Awaiting fhir-runtime/persistence integration       |

---

## License

MIT © 2026 MedXAI

---

## Contributing

Issues and PRs welcome at [github.com/medxaidev/fhir-definition](https://github.com/medxaidev/fhir-definition)
