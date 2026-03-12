import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type {
  DefinitionPackage,
  PackageManifest,
  PackageScanOptions,
  LoadError,
} from '../model/index.js';
import { LoadErrorCode } from '../model/index.js';

export interface PackageScanResult {
  packages: DefinitionPackage[];
  errors: LoadError[];
}

export class PackageScanner {
  scan(rootPath: string, options?: PackageScanOptions): PackageScanResult {
    const recursive = options?.recursive ?? true;
    const maxDepth = options?.maxDepth ?? 3;

    const packages: DefinitionPackage[] = [];
    const errors: LoadError[] = [];

    // 验证根目录是否存在
    try {
      const stat = statSync(rootPath);
      if (!stat.isDirectory()) {
        errors.push({
          code: LoadErrorCode.FILE_NOT_FOUND,
          message: `Not a directory: ${rootPath}`,
          filePath: rootPath,
        });
        return { packages, errors };
      }
    } catch (err: unknown) {
      const nodeErr = err as NodeJS.ErrnoException;
      errors.push({
        code: nodeErr.code === 'ENOENT' ? LoadErrorCode.FILE_NOT_FOUND : LoadErrorCode.IO_ERROR,
        message: `Failed to scan directory: ${rootPath}`,
        filePath: rootPath,
        details: nodeErr.message,
      });
      return { packages, errors };
    }

    this.scanDirectory(rootPath, 0, maxDepth, recursive, packages, errors);

    return { packages, errors };
  }

  private scanDirectory(
    dirPath: string,
    currentDepth: number,
    maxDepth: number,
    recursive: boolean,
    packages: DefinitionPackage[],
    errors: LoadError[],
  ): void {
    if (currentDepth > maxDepth) return;

    const manifestPath = join(dirPath, 'package.json');
    const manifest = this.tryReadManifest(manifestPath);

    if (manifest) {
      if (this.isValidManifest(manifest)) {
        packages.push({
          name: manifest.name,
          version: manifest.version,
          path: dirPath,
          dependencies: manifest.dependencies ?? {},
        });
        // 找到包后不再递归其子目录
        return;
      } else {
        errors.push({
          code: LoadErrorCode.INVALID_MANIFEST,
          message: `Invalid manifest (missing name or version): ${manifestPath}`,
          filePath: manifestPath,
        });
        return;
      }
    }

    // 没有 package.json，递归子目录
    if (!recursive && currentDepth > 0) return;

    let entries: string[];
    try {
      entries = readdirSync(dirPath);
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryPath = join(dirPath, entry);
      try {
        const stat = statSync(entryPath);
        if (stat.isDirectory()) {
          this.scanDirectory(entryPath, currentDepth + 1, maxDepth, recursive, packages, errors);
        }
      } catch {
        // skip inaccessible entries
      }
    }
  }

  private tryReadManifest(manifestPath: string): PackageManifest | undefined {
    try {
      const raw = readFileSync(manifestPath, 'utf-8');
      return JSON.parse(raw) as PackageManifest;
    } catch {
      return undefined;
    }
  }

  private isValidManifest(manifest: PackageManifest): boolean {
    return (
      typeof manifest.name === 'string' &&
      manifest.name.length > 0 &&
      typeof manifest.version === 'string' &&
      manifest.version.length > 0
    );
  }
}
