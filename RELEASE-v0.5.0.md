# Release Notes — fhir-definition v0.5.0

**Release Date:** 2026-03-13  
**Status:** Production-ready  
**Breaking Changes:** None

---

## Highlights

**fhir-definition v0.5.0** adds name-based package loading from the FHIR Package Registry (packages.fhir.org) with local disk caching — zero new runtime dependencies.

- **PackageRegistryClient** — Download packages from packages.fhir.org
- **PackageCache** — Local ~/.fhir/packages/ cache with native .tgz extraction
- **PackageLoader.load()** — Load by name: cache-first, download on miss
- **loadPackagesByName()** — One-line convenience for multi-package loading
- **236 Tests** — 100% pass rate, 22 test files

---

## What's New

### 1. Package Registry Client

```typescript
import { PackageRegistryClient } from 'fhir-definition';

const client = new PackageRegistryClient();

// Download a package tarball
const tarball = await client.download('hl7.fhir.r4.core', '4.0.1');

// List available versions
const versions = await client.getVersions('hl7.fhir.r4.core');

// Get latest version
const latest = await client.getLatestVersion('hl7.fhir.r4.core');
```

### 2. Local Package Cache

```typescript
import { PackageCache } from 'fhir-definition';

const cache = new PackageCache({ cacheDir: '~/.fhir/packages' });

cache.has('hl7.fhir.r4.core', '4.0.1');    // boolean
cache.getPath('hl7.fhir.r4.core', '4.0.1'); // string | undefined
cache.put('hl7.fhir.r4.core', '4.0.1', tarball); // extract .tgz → local dir
cache.list(); // [{ name, version, path }]
```

Cache layout:
```
~/.fhir/packages/
  hl7.fhir.r4.core#4.0.1/
    package.json
    package/
      StructureDefinition-Patient.json
      ...
```

### 3. Name-Based Package Loading

```typescript
import { PackageLoader } from 'fhir-definition';

const loader = new PackageLoader({
  cacheDir: '~/.fhir/packages',
  registryUrl: 'https://packages.fhir.org',
});

// Load single package (cache → download → register)
const result = await loader.load('hl7.fhir.r4.core', {
  version: '4.0.1',
  into: registry,
});

// Load multiple packages (sequential by default)
const results = await loader.loadMany([
  { name: 'hl7.fhir.r4.core', version: '4.0.1' },
  { name: 'hl7.fhir.us.core', version: '6.1.0' },
], { into: registry });
```

### 4. Top-Level Convenience Function

```typescript
import { loadPackagesByName } from 'fhir-definition';

const { registry, packages } = await loadPackagesByName([
  { name: 'hl7.fhir.r4.core', version: '4.0.1' },
  { name: 'hl7.fhir.us.core', version: '6.1.0' },
]);
```

---

## New Exports

### Types (7 new)
- `PackageRegistryClientOptions`
- `PackageCacheOptions`
- `PackageCacheEntry`
- `NamedPackageLoadOptions`
- `LoadManyOptions`
- `LoadPackagesByNameOptions`
- `LoadPackagesByNameOutput`
- `PackageLoaderOptions`

### Classes (2 new)
- `PackageRegistryClient`
- `PackageCache`

### Functions (1 new)
- `loadPackagesByName()`

### Error Codes (3 new)
- `DOWNLOAD_FAILED`
- `CACHE_ERROR`
- `EXTRACT_ERROR`

---

## Test Coverage

| Phase | Tests | Status |
|-------|-------|--------|
| Phase 1–4 (v0.1–v0.4) | 215 | All pass |
| v0.5.0 new tests | +21 | All pass |
| **Total** | **236** | **22 files, 100%** |

New test files:
- `package-registry-client.test.ts` — 11 tests (mock fetch)
- `package-cache.test.ts` — 10 tests (.tgz extraction, cache operations)

---

## fhir-engine Integration

Updated `PackageSourceConfig` for fhir-engine Phase 2:

```typescript
const engine = await createFhirEngine({
  database: { type: 'postgres', url: process.env.DATABASE_URL! },
  packages: {
    packages: [
      { name: 'hl7.fhir.r4.core', version: '4.0.1' },
      { name: 'hl7.fhir.us.core', version: '6.1.0' },
    ],
    cacheDir: process.env.FHIR_CACHE ?? '~/.fhir/packages',
  },
});
```

---

## Backward Compatibility

- All v0.4.0 APIs remain unchanged
- `PackageLoader` constructor accepts both legacy `DirectoryLoader` and new `PackageLoaderOptions`
- Zero new runtime dependencies (Node 18+ native `fetch` + `node:zlib`)
- Native .tgz extraction (no `tar` package needed)

---

## Migration from v0.4.0

**No breaking changes.** Upgrade directly:

```bash
npm install fhir-definition@0.5.0
```

New imports available:
```typescript
import {
  PackageRegistryClient,
  PackageCache,
  loadPackagesByName,
} from 'fhir-definition';
```

---

## Release Checklist

- [x] All 236 tests pass
- [x] `tsc --noEmit` zero errors
- [x] README.md updated
- [x] CHANGELOG.md updated
- [x] package.json version 0.5.0
- [ ] npm publish dry-run
- [ ] Git tag v0.5.0
- [ ] GitHub release
- [ ] npm publish

---

**License:** MIT © 2026 MedXAI
