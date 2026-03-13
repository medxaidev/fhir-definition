import { join } from 'node:path';
import { existsSync, readFileSync, statSync } from 'node:fs';
import type {
  DefinitionPackage,
  FhirDefinitionResource,
  FhirDefinitionResourceType,
  PackageLoadResult,
  LoadError,
  NamedPackageLoadOptions,
  LoadManyOptions,
  PackageCacheOptions,
  PackageRegistryClientOptions,
} from '../model/index.js';
import { LoadErrorCode } from '../model/index.js';
import { DirectoryLoader } from '../loader/index.js';
import { PackageCache } from './package-cache.js';
import { PackageRegistryClient } from './package-registry-client.js';

export interface PackageLoaderOptions extends PackageCacheOptions, PackageRegistryClientOptions { }

export class PackageLoader {
  private readonly directoryLoader: DirectoryLoader;
  private readonly cache: PackageCache;
  private readonly client: PackageRegistryClient;

  constructor(optionsOrLoader?: DirectoryLoader | PackageLoaderOptions) {
    if (optionsOrLoader instanceof DirectoryLoader) {
      // Legacy constructor: PackageLoader(directoryLoader?)
      this.directoryLoader = optionsOrLoader;
      this.cache = new PackageCache();
      this.client = new PackageRegistryClient();
    } else {
      this.directoryLoader = new DirectoryLoader();
      this.cache = new PackageCache(optionsOrLoader);
      this.client = new PackageRegistryClient(optionsOrLoader);
    }
  }

  // ─── Existing API (unchanged) ────────────────────────────────────────────

  loadPackage(
    pkg: DefinitionPackage,
    resourceTypes?: FhirDefinitionResourceType[],
  ): PackageLoadResult {
    const packageDir = join(pkg.path, 'package');

    // 检查 package/ 子目录是否存在
    try {
      const stat = statSync(packageDir);
      if (!stat.isDirectory()) {
        return this.errorResult(pkg, LoadErrorCode.FILE_NOT_FOUND,
          `"package/" is not a directory in: ${pkg.path}`);
      }
    } catch (err: unknown) {
      const nodeErr = err as NodeJS.ErrnoException;
      if (nodeErr.code === 'ENOENT') {
        return this.errorResult(pkg, LoadErrorCode.FILE_NOT_FOUND,
          `"package/" subdirectory not found in: ${pkg.path}`);
      }
      return this.errorResult(pkg, LoadErrorCode.IO_ERROR,
        `Failed to access package directory: ${packageDir}`);
    }

    const dirResult = this.directoryLoader.loadDirectory(packageDir);

    let resources: FhirDefinitionResource[] = dirResult.resources;
    if (resourceTypes && resourceTypes.length > 0) {
      const allowed = new Set<string>(resourceTypes);
      resources = resources.filter(r => allowed.has(r.resourceType));
    }

    const errors: LoadError[] = dirResult.errors;

    return {
      success: dirResult.success,
      package: {
        name: pkg.name,
        version: pkg.version,
        path: pkg.path,
        definitionCount: resources.length,
        loadedAt: new Date(),
      },
      resources,
      errors,
    };
  }

  // ─── Phase 2: Name-based loading ─────────────────────────────────────────

  /**
   * Load a package by name. Checks local cache first; downloads from
   * the FHIR package registry if not cached.
   *
   * @param name    Package name (e.g. 'hl7.fhir.r4.core')
   * @param options Version, auto-register into registry, etc.
   */
  async load(
    name: string,
    options?: NamedPackageLoadOptions,
  ): Promise<PackageLoadResult> {
    const version = options?.version ?? await this.resolveVersion(name);

    // 1. Check local cache
    let localPath = this.cache.getPath(name, version);

    // 2. Download if not cached
    if (!localPath) {
      try {
        const tarball = await this.client.download(name, version);
        localPath = this.cache.put(name, version, tarball);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return this.errorResultSimple(name, version, LoadErrorCode.DOWNLOAD_FAILED,
          `Failed to download ${name}@${version}: ${msg}`);
      }
    }

    // 3. Read package.json for dependency info
    const deps = this.readDependencies(localPath);

    // 4. Load using existing loadPackage()
    const pkg: DefinitionPackage = {
      name,
      version,
      path: localPath,
      dependencies: deps,
    };
    const result = this.loadPackage(pkg);

    // 5. Auto-register into registry if requested
    if (options?.into && result.success) {
      for (const resource of result.resources) {
        options.into.register(resource);
      }
      options.into.registerPackage(result.package);
    }

    return result;
  }

  /**
   * Load multiple packages by name. Sequential by default for dependency safety.
   *
   * @param packages Array of { name, version? } objects
   * @param options  Auto-register, parallel mode, etc.
   */
  async loadMany(
    packages: Array<{ name: string; version?: string }>,
    options?: LoadManyOptions,
  ): Promise<PackageLoadResult[]> {
    const results: PackageLoadResult[] = [];

    if (options?.parallel) {
      const promises = packages.map(pkg =>
        this.load(pkg.name, { version: pkg.version, into: options?.into }),
      );
      return Promise.all(promises);
    }

    // Sequential loading (default — dependency safe)
    for (const pkg of packages) {
      const result = await this.load(pkg.name, {
        version: pkg.version,
        into: options?.into,
      });
      results.push(result);
    }

    return results;
  }

  /** Get the underlying PackageCache instance. */
  getCache(): PackageCache {
    return this.cache;
  }

  /** Get the underlying PackageRegistryClient instance. */
  getClient(): PackageRegistryClient {
    return this.client;
  }

  // ─── Internal helpers ────────────────────────────────────────────────────

  private async resolveVersion(name: string): Promise<string> {
    return this.client.getLatestVersion(name);
  }

  private readDependencies(packagePath: string): Record<string, string> {
    const manifestPath = join(packagePath, 'package.json');
    if (!existsSync(manifestPath)) return {};
    try {
      const raw = readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(raw) as Record<string, unknown>;
      const deps = manifest['dependencies'];
      if (deps && typeof deps === 'object' && !Array.isArray(deps)) {
        return deps as Record<string, string>;
      }
      return {};
    } catch {
      return {};
    }
  }

  private errorResult(
    pkg: DefinitionPackage,
    code: LoadErrorCode,
    message: string,
  ): PackageLoadResult {
    return {
      success: false,
      package: {
        name: pkg.name,
        version: pkg.version,
        path: pkg.path,
        definitionCount: 0,
        loadedAt: new Date(),
      },
      resources: [],
      errors: [{ code, message, filePath: pkg.path }],
    };
  }

  private errorResultSimple(
    name: string,
    version: string,
    code: LoadErrorCode,
    message: string,
  ): PackageLoadResult {
    return {
      success: false,
      package: {
        name,
        version,
        path: '',
        definitionCount: 0,
        loadedAt: new Date(),
      },
      resources: [],
      errors: [{ code, message }],
    };
  }
}
