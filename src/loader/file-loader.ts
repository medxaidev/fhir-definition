import { readFileSync } from 'node:fs';
import type { FhirDefinitionResource, LoadFileResult } from '../model/index.js';
import { LoadErrorCode, SUPPORTED_RESOURCE_TYPES } from '../model/index.js';

export class FileLoader {
  loadFile(filePath: string): LoadFileResult {
    let raw: string;
    try {
      raw = readFileSync(filePath, 'utf-8');
    } catch (err: unknown) {
      const nodeErr = err as NodeJS.ErrnoException;
      if (nodeErr.code === 'ENOENT') {
        return {
          success: false,
          error: {
            code: LoadErrorCode.FILE_NOT_FOUND,
            message: `File not found: ${filePath}`,
            filePath,
          },
        };
      }
      return {
        success: false,
        error: {
          code: LoadErrorCode.IO_ERROR,
          message: `Failed to read file: ${filePath}`,
          filePath,
          details: nodeErr.message,
        },
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        success: false,
        error: {
          code: LoadErrorCode.INVALID_JSON,
          message: `Invalid JSON in file: ${filePath}`,
          filePath,
        },
      };
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('resourceType' in parsed) ||
      !('url' in parsed)
    ) {
      return {
        success: false,
        error: {
          code: LoadErrorCode.NOT_FHIR_RESOURCE,
          message: `Not a FHIR resource (missing resourceType or url): ${filePath}`,
          filePath,
        },
      };
    }

    const obj = parsed as Record<string, unknown>;
    const resourceType = obj['resourceType'] as string;

    if (!SUPPORTED_RESOURCE_TYPES.has(resourceType)) {
      return {
        success: false,
        error: {
          code: LoadErrorCode.UNSUPPORTED_RESOURCE_TYPE,
          message: `Unsupported resourceType "${resourceType}" in: ${filePath}`,
          filePath,
        },
      };
    }

    const resource = obj as unknown as FhirDefinitionResource;

    return {
      success: true,
      resource,
      resourceType: resource.resourceType,
      url: resource.url,
    };
  }
}
