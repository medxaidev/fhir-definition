import type {
  LoadPackagesOptions,
  LoadPackagesOutput,
  LoadedPackage,
  LoadError,
} from '../model/index.js';
import type { DefinitionRegistry } from '../registry/definition-registry.js';
import { InMemoryDefinitionRegistry } from '../registry/in-memory-definition-registry.js';
import { PackageScanner } from './package-scanner.js';
import { DependencyResolver } from './dependency-resolver.js';
import { PackageLoader } from './package-loader.js';

export class PackageManager {
  private readonly registry: InMemoryDefinitionRegistry;
  private readonly scanner: PackageScanner;
  private readonly depResolver: DependencyResolver;
  private readonly pkgLoader: PackageLoader;

  constructor(registry?: InMemoryDefinitionRegistry) {
    this.registry = registry ?? new InMemoryDefinitionRegistry();
    this.scanner = new PackageScanner();
    this.depResolver = new DependencyResolver();
    this.pkgLoader = new PackageLoader();
  }

  loadPackages(rootPath: string, options?: LoadPackagesOptions): LoadPackagesOutput {
    const allErrors: LoadError[] = [];
    const allPackages: LoadedPackage[] = [];
    let totalDefinitions = 0;

    // Step 1: Scan
    const scanResult = this.scanner.scan(rootPath, options?.scanOptions);
    allErrors.push(...scanResult.errors);

    if (scanResult.packages.length === 0) {
      return {
        registry: this.registry,
        result: {
          success: scanResult.errors.length === 0,
          packages: [],
          totalDefinitions: 0,
          errors: allErrors,
        },
      };
    }

    // Step 2: Resolve dependencies
    const depResult = this.depResolver.resolve(scanResult.packages);
    allErrors.push(...depResult.errors);
    // warnings 也收集到 errors 中（用不同 code 区分）
    allErrors.push(...depResult.warnings);

    if (!depResult.success && depResult.sorted.length === 0) {
      return {
        registry: this.registry,
        result: {
          success: false,
          packages: [],
          totalDefinitions: 0,
          errors: allErrors,
        },
      };
    }

    // Step 3: Load each package in sorted order
    const resourceTypes = options?.resourceTypes;

    for (const pkg of depResult.sorted) {
      const loadResult = this.pkgLoader.loadPackage(pkg, resourceTypes);

      allErrors.push(...loadResult.errors);
      allPackages.push(loadResult.package);
      totalDefinitions += loadResult.resources.length;

      // Step 4: Register resources
      for (const resource of loadResult.resources) {
        this.registry.register(resource);
      }

      // Register package metadata
      this.registry.registerPackage(loadResult.package);
    }

    return {
      registry: this.registry,
      result: {
        success: allErrors.filter(e =>
          e.code !== 'MISSING_DEPENDENCY' &&
          e.code !== 'UNSUPPORTED_RESOURCE_TYPE' &&
          e.code !== 'NOT_FHIR_RESOURCE',
        ).length === 0,
        packages: allPackages,
        totalDefinitions,
        errors: allErrors,
      },
    };
  }

  getRegistry(): DefinitionRegistry {
    return this.registry;
  }

  getLoadedPackages(): LoadedPackage[] {
    return this.registry.getLoadedPackages();
  }
}
