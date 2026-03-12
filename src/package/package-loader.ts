import { join } from 'node:path';
import { statSync } from 'node:fs';
import type {
  DefinitionPackage,
  FhirDefinitionResource,
  FhirDefinitionResourceType,
  PackageLoadResult,
  LoadError,
} from '../model/index.js';
import { LoadErrorCode } from '../model/index.js';
import { DirectoryLoader } from '../loader/index.js';

export class PackageLoader {
  private readonly directoryLoader: DirectoryLoader;

  constructor(directoryLoader?: DirectoryLoader) {
    this.directoryLoader = directoryLoader ?? new DirectoryLoader();
  }

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
}
