import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { PackageCache } from '../package-cache.js';
import { tmpdir } from 'node:os';

/** Build a minimal .tar containing file entries using Uint8Array. */
function buildTar(files: Array<{ name: string; content: string }>): Uint8Array {
  const blocks: Uint8Array[] = [];

  for (const file of files) {
    const encoder = new TextEncoder();
    const contentBytes = encoder.encode(file.content);

    // 512-byte header
    const header = new Uint8Array(512);
    // Write filename
    const nameBytes = encoder.encode(file.name);
    header.set(nameBytes.subarray(0, Math.min(nameBytes.length, 100)), 0);
    // mode (100..107)
    header.set(encoder.encode('0000644\0'), 100);
    // uid (108..115)
    header.set(encoder.encode('0000000\0'), 108);
    // gid (116..123)
    header.set(encoder.encode('0000000\0'), 116);
    // size (124..135)
    const sizeOctal = contentBytes.length.toString(8).padStart(11, '0') + '\0';
    header.set(encoder.encode(sizeOctal), 124);
    // mtime (136..147)
    header.set(encoder.encode('00000000000\0'), 136);
    // type flag (156) — '0' = regular file
    header[156] = 48;
    // checksum: blank with spaces first
    header.fill(0x20, 148, 156);
    let chksum = 0;
    for (let i = 0; i < 512; i++) chksum += header[i];
    const chksumStr = chksum.toString(8).padStart(6, '0') + '\0 ';
    header.set(encoder.encode(chksumStr), 148);

    blocks.push(header);
    blocks.push(contentBytes);
    // Pad to 512-byte boundary
    const remainder = contentBytes.length % 512;
    if (remainder > 0) {
      blocks.push(new Uint8Array(512 - remainder));
    }
  }

  // End-of-archive: two 512-byte zero blocks
  blocks.push(new Uint8Array(1024));

  // Concatenate all blocks
  const total = blocks.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const block of blocks) {
    result.set(block, offset);
    offset += block.length;
  }
  return result;
}

/** Build a .tgz (gzipped tar) from file entries. */
function buildTgz(files: Array<{ name: string; content: string }>): Buffer {
  const tar = buildTar(files);
  return Buffer.from(gzipSync(tar));
}

describe('PackageCache', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `fhir-cache-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should create cache directory on construction', () => {
    const cacheDir = join(tempDir, 'new-cache');
    new PackageCache({ cacheDir });
    expect(existsSync(cacheDir)).toBe(true);
  });

  it('should return getCacheDir()', () => {
    const cache = new PackageCache({ cacheDir: tempDir });
    expect(cache.getCacheDir()).toBe(tempDir);
  });

  describe('has()', () => {
    it('should return false for non-existent package', () => {
      const cache = new PackageCache({ cacheDir: tempDir });
      expect(cache.has('test.pkg', '1.0.0')).toBe(false);
    });

    it('should return true for cached package with package/ subdir', () => {
      const pkgDir = join(tempDir, 'test.pkg#1.0.0', 'package');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(join(pkgDir, 'test.json'), '{}');

      const cache = new PackageCache({ cacheDir: tempDir });
      expect(cache.has('test.pkg', '1.0.0')).toBe(true);
    });
  });

  describe('getPath()', () => {
    it('should return undefined for non-existent package', () => {
      const cache = new PackageCache({ cacheDir: tempDir });
      expect(cache.getPath('test.pkg', '1.0.0')).toBeUndefined();
    });

    it('should return path for cached package', () => {
      const pkgDir = join(tempDir, 'test.pkg#1.0.0', 'package');
      mkdirSync(pkgDir, { recursive: true });

      const cache = new PackageCache({ cacheDir: tempDir });
      expect(cache.getPath('test.pkg', '1.0.0')).toBe(join(tempDir, 'test.pkg#1.0.0'));
    });
  });

  describe('put()', () => {
    it('should extract a .tgz and store in cache', () => {
      const tgz = buildTgz([
        { name: 'package/package.json', content: '{"name":"my.pkg","version":"1.0.0"}' },
        { name: 'package/StructureDefinition-Patient.json', content: '{"resourceType":"StructureDefinition","url":"http://test/Patient"}' },
      ]);

      const cache = new PackageCache({ cacheDir: tempDir });
      const path = cache.put('my.pkg', '1.0.0', tgz);

      expect(existsSync(path)).toBe(true);
      expect(existsSync(join(path, 'package', 'package.json'))).toBe(true);
      expect(existsSync(join(path, 'package', 'StructureDefinition-Patient.json'))).toBe(true);
      expect(cache.has('my.pkg', '1.0.0')).toBe(true);
    });

    it('should copy package.json to root if only in package/ subdir', () => {
      const tgz = buildTgz([
        { name: 'package/package.json', content: '{"name":"copy.test","version":"2.0.0"}' },
      ]);

      const cache = new PackageCache({ cacheDir: tempDir });
      const path = cache.put('copy.test', '2.0.0', tgz);

      expect(existsSync(join(path, 'package.json'))).toBe(true);
    });
  });

  describe('list()', () => {
    it('should return empty array for empty cache', () => {
      const cache = new PackageCache({ cacheDir: tempDir });
      expect(cache.list()).toEqual([]);
    });

    it('should list cached packages', () => {
      mkdirSync(join(tempDir, 'pkg.a#1.0.0'), { recursive: true });
      mkdirSync(join(tempDir, 'pkg.b#2.0.0'), { recursive: true });
      // Non-matching entry (no # separator)
      mkdirSync(join(tempDir, 'invalid'), { recursive: true });

      const cache = new PackageCache({ cacheDir: tempDir });
      const entries = cache.list();

      expect(entries.length).toBe(2);
      expect(entries).toContainEqual(expect.objectContaining({ name: 'pkg.a', version: '1.0.0' }));
      expect(entries).toContainEqual(expect.objectContaining({ name: 'pkg.b', version: '2.0.0' }));
    });
  });
});
