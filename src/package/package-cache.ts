import { join, dirname } from 'node:path';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
  copyFileSync,
} from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { homedir } from 'node:os';
import type { PackageCacheOptions, PackageCacheEntry } from '../model/index.js';

const DEFAULT_CACHE_DIR = join(homedir(), '.fhir', 'packages');

/**
 * Local disk cache for FHIR packages.
 *
 * Cache directory layout: `{cacheDir}/{name}#{version}/`
 *
 * Each cached package directory contains:
 * - `package.json` — Package manifest
 * - `package/`     — FHIR definition JSON files
 */
export class PackageCache {
  private readonly cacheDir: string;

  constructor(options?: PackageCacheOptions) {
    this.cacheDir = options?.cacheDir ?? DEFAULT_CACHE_DIR;
    // Ensure cache directory exists
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Check if a package version is already cached locally.
   */
  has(name: string, version: string): boolean {
    const dir = this.getPackageDir(name, version);
    return existsSync(dir) && existsSync(join(dir, 'package'));
  }

  /**
   * Get path to cached package directory (or undefined if not cached).
   */
  getPath(name: string, version: string): string | undefined {
    if (this.has(name, version)) {
      return this.getPackageDir(name, version);
    }
    return undefined;
  }

  /**
   * Save a downloaded tarball to cache, extract it, return the directory path.
   *
   * FHIR .tgz packages from packages.fhir.org have the structure:
   * ```
   * package/
   *   package.json
   *   StructureDefinition-Patient.json
   *   ...
   * ```
   *
   * After extraction the cache directory becomes:
   * ```
   * {cacheDir}/{name}#{version}/
   *   package.json     ← copied from package/package.json
   *   package/
   *     StructureDefinition-Patient.json
   *     ...
   * ```
   */
  put(name: string, version: string, tarball: Buffer): string {
    const destDir = this.getPackageDir(name, version);
    mkdirSync(destDir, { recursive: true });

    // Extract .tgz natively (gunzip + tar parsing — zero external deps)
    this.extractTarball(tarball, destDir);

    // FHIR packages extract with a top-level `package/` directory.
    const packageSubDir = join(destDir, 'package');
    if (!existsSync(packageSubDir)) {
      const manifestPath = join(destDir, 'package.json');
      if (!existsSync(manifestPath)) {
        throw new Error(
          `Extracted tarball for ${name}@${version} does not contain expected structure`,
        );
      }
    }

    // Copy package.json from package/ subdirectory to root if needed
    const rootManifest = join(destDir, 'package.json');
    const nestedManifest = join(destDir, 'package', 'package.json');
    if (!existsSync(rootManifest) && existsSync(nestedManifest)) {
      copyFileSync(nestedManifest, rootManifest);
    }

    return destDir;
  }

  /**
   * List all cached packages.
   */
  list(): PackageCacheEntry[] {
    if (!existsSync(this.cacheDir)) {
      return [];
    }

    const entries: PackageCacheEntry[] = [];
    const dirs = readdirSync(this.cacheDir);

    for (const dir of dirs) {
      const fullPath = join(this.cacheDir, dir);
      try {
        if (!statSync(fullPath).isDirectory()) continue;
      } catch {
        continue;
      }

      // Parse directory name: {name}#{version}
      const hashIndex = dir.lastIndexOf('#');
      if (hashIndex === -1) continue;

      const name = dir.substring(0, hashIndex);
      const version = dir.substring(hashIndex + 1);
      if (name && version) {
        entries.push({ name, version, path: fullPath });
      }
    }

    return entries;
  }

  /** Get the cache directory path. */
  getCacheDir(): string {
    return this.cacheDir;
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────

  private getPackageDir(name: string, version: string): string {
    return join(this.cacheDir, `${name}#${version}`);
  }

  /**
   * Extract a .tgz tarball using native node:zlib (gunzip) + manual .tar parsing.
   * Zero external dependencies. Handles standard FHIR package tarballs.
   */
  private extractTarball(tarball: Buffer, destDir: string): void {
    // Decompress gzip → raw tar data
    // Cast needed: @types/node 25.x returns NonSharedBuffer which lacks indexed access
    const decompressed = gunzipSync(tarball);
    const tarUint8 = new Uint8Array(decompressed as unknown as ArrayBuffer);

    // Parse tar format (512-byte blocks)
    let offset = 0;
    while (offset + 512 <= tarUint8.length) {
      // Read header (512 bytes)
      const header = tarUint8.subarray(offset, offset + 512);
      offset += 512;

      // Check for end-of-archive (all zeros in header)
      let allZero = true;
      for (let i = 0; i < 512; i++) {
        if (header[i] !== 0) { allZero = false; break; }
      }
      if (allZero) break;

      // Parse filename (first 100 bytes, null-terminated)
      let nameEnd = 100;
      for (let i = 0; i < 100; i++) {
        if (header[i] === 0) { nameEnd = i; break; }
      }
      const rawName = Buffer.from(header.subarray(0, nameEnd)).toString('utf8');

      // Parse file size (octal, bytes 124-135)
      const sizeBytes = Buffer.from(header.subarray(124, 136)).toString('utf8').trim().replace(/\0/g, '');
      const size = parseInt(sizeBytes, 8) || 0;

      // Parse type flag (byte 156): '0' (48) = regular file, '5' (53) = directory
      const typeFlag = header[156];

      // Calculate padding to next 512-byte boundary
      const paddedSize = Math.ceil(size / 512) * 512;

      if ((typeFlag === 48 || typeFlag === 0) && size > 0 && rawName) {
        // Regular file
        const filePath = join(destDir, rawName);
        mkdirSync(dirname(filePath), { recursive: true });
        const fileData = Buffer.from(tarUint8.subarray(offset, offset + size));
        writeFileSync(filePath, fileData);
      } else if (typeFlag === 53 && rawName) {
        // Directory entry
        mkdirSync(join(destDir, rawName), { recursive: true });
      }

      offset += paddedSize;
    }
  }
}
