import type {
  LoadPackagesByNameOptions,
  LoadPackagesByNameOutput,
} from './model/index.js';
import { InMemoryDefinitionRegistry } from './registry/index.js';
import { PackageLoader } from './package/index.js';

/**
 * Load FHIR packages by name from the FHIR Package Registry (packages.fhir.org).
 *
 * Downloads packages if not locally cached, extracts them, and registers
 * all definitions into a DefinitionRegistry.
 *
 * @param packages  Array of { name, version? } to load
 * @param options   Cache directory, registry URL, target registry
 * @returns         { registry, packages } with loaded definitions
 *
 * @example
 * ```typescript
 * const { registry, packages } = await loadPackagesByName([
 *   { name: 'hl7.fhir.r4.core', version: '4.0.1' },
 *   { name: 'hl7.fhir.us.core', version: '6.1.0' },
 * ]);
 * ```
 */
export async function loadPackagesByName(
  packages: Array<{ name: string; version?: string }>,
  options?: LoadPackagesByNameOptions,
): Promise<LoadPackagesByNameOutput> {
  const registry = options?.into ?? new InMemoryDefinitionRegistry();

  const loader = new PackageLoader({
    cacheDir: options?.cacheDir,
    registryUrl: options?.registryUrl,
  });

  const results = await loader.loadMany(packages, { into: registry });

  const loadedPackages = results
    .filter(r => r.success)
    .map(r => r.package);

  return { registry, packages: loadedPackages };
}
