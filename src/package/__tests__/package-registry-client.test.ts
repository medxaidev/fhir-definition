import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PackageRegistryClient } from '../package-registry-client.js';

describe('PackageRegistryClient', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should use default registry URL', () => {
    const client = new PackageRegistryClient();
    expect(client.getRegistryUrl()).toBe('https://packages.fhir.org');
  });

  it('should accept custom registry URL', () => {
    const client = new PackageRegistryClient({ registryUrl: 'https://custom.registry.io' });
    expect(client.getRegistryUrl()).toBe('https://custom.registry.io');
  });

  it('should strip trailing slashes from registry URL', () => {
    const client = new PackageRegistryClient({ registryUrl: 'https://example.com///' });
    expect(client.getRegistryUrl()).toBe('https://example.com');
  });

  describe('download()', () => {
    it('should download a package tarball', async () => {
      const fakeData = new Uint8Array([0x1f, 0x8b, 0x08]).buffer;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(fakeData),
      });

      const client = new PackageRegistryClient();
      const result = await client.download('hl7.fhir.r4.core', '4.0.1');
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.byteLength).toBe(3);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://packages.fhir.org/hl7.fhir.r4.core/4.0.1',
        expect.objectContaining({ headers: { Accept: 'application/gzip' } }),
      );
    });

    it('should throw on HTTP error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const client = new PackageRegistryClient();
      await expect(client.download('nonexistent', '1.0.0'))
        .rejects.toThrow(/HTTP 404/);
    });
  });

  describe('getVersions()', () => {
    it('should return list of versions', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          versions: { '4.0.0': {}, '4.0.1': {} },
        }),
      });

      const client = new PackageRegistryClient();
      const versions = await client.getVersions('hl7.fhir.r4.core');
      expect(versions).toEqual(['4.0.0', '4.0.1']);
    });

    it('should return empty array if no versions field', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const client = new PackageRegistryClient();
      const versions = await client.getVersions('empty');
      expect(versions).toEqual([]);
    });

    it('should throw on HTTP error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const client = new PackageRegistryClient();
      await expect(client.getVersions('hl7.fhir.r4.core'))
        .rejects.toThrow(/HTTP 500/);
    });
  });

  describe('getLatestVersion()', () => {
    it('should return dist-tags.latest if available', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          'dist-tags': { latest: '4.0.1' },
          versions: { '4.0.0': {}, '4.0.1': {} },
        }),
      });

      const client = new PackageRegistryClient();
      const latest = await client.getLatestVersion('hl7.fhir.r4.core');
      expect(latest).toBe('4.0.1');
    });

    it('should fallback to last version key', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          versions: { '1.0.0': {}, '2.0.0': {} },
        }),
      });

      const client = new PackageRegistryClient();
      const latest = await client.getLatestVersion('some.package');
      expect(latest).toBe('2.0.0');
    });

    it('should throw if no versions found', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const client = new PackageRegistryClient();
      await expect(client.getLatestVersion('empty'))
        .rejects.toThrow(/No versions found/);
    });
  });
});
