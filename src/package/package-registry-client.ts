import type { PackageRegistryClientOptions } from '../model/index.js';

const DEFAULT_REGISTRY_URL = 'https://packages.fhir.org';
const DEFAULT_TIMEOUT = 30_000;

/**
 * HTTP client for the FHIR Package Registry (packages.fhir.org).
 *
 * Downloads FHIR packages as tarballs and queries available versions.
 * Uses Node 18+ native fetch (no external dependencies).
 */
export class PackageRegistryClient {
  private readonly registryUrl: string;
  private readonly timeout: number;

  constructor(options?: PackageRegistryClientOptions) {
    this.registryUrl = (options?.registryUrl ?? DEFAULT_REGISTRY_URL).replace(/\/+$/, '');
    this.timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  }

  /**
   * Download a specific package version as a tarball Buffer.
   *
   * @param name    Package name (e.g. 'hl7.fhir.r4.core')
   * @param version Package version (e.g. '4.0.1')
   * @returns       Buffer containing the .tgz tarball
   * @throws        Error if download fails
   */
  async download(name: string, version: string): Promise<Buffer> {
    const url = `${this.registryUrl}/${encodeURIComponent(name)}/${encodeURIComponent(version)}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/gzip' },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to download ${name}@${version}: HTTP ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * List available versions for a package.
   *
   * @param name Package name
   * @returns    Array of version strings
   */
  async getVersions(name: string): Promise<string[]> {
    const url = `${this.registryUrl}/${encodeURIComponent(name)}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get versions for ${name}: HTTP ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as Record<string, unknown>;
    const versions = data['versions'] as Record<string, unknown> | undefined;
    if (!versions || typeof versions !== 'object') {
      return [];
    }
    return Object.keys(versions);
  }

  /**
   * Get the latest version string for a package.
   *
   * @param name Package name
   * @returns    Latest version string
   * @throws    Error if no versions found
   */
  async getLatestVersion(name: string): Promise<string> {
    const url = `${this.registryUrl}/${encodeURIComponent(name)}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get latest version for ${name}: HTTP ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as Record<string, unknown>;
    const distTags = data['dist-tags'] as Record<string, string> | undefined;
    if (distTags?.['latest']) {
      return distTags['latest'];
    }

    // Fallback: pick last key from versions
    const versions = data['versions'] as Record<string, unknown> | undefined;
    if (versions && typeof versions === 'object') {
      const keys = Object.keys(versions);
      if (keys.length > 0) {
        return keys[keys.length - 1];
      }
    }

    throw new Error(`No versions found for package: ${name}`);
  }

  /** Get the configured registry URL. */
  getRegistryUrl(): string {
    return this.registryUrl;
  }
}
