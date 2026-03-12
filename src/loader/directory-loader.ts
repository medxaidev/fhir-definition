import { readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { LoadDirectoryOptions, LoadDirectoryResult, LoadError, FhirDefinitionResource } from '../model/index.js';
import { LoadErrorCode } from '../model/index.js';
import { FileLoader } from './file-loader.js';

export class DirectoryLoader {
  private readonly fileLoader: FileLoader;

  constructor(fileLoader?: FileLoader) {
    this.fileLoader = fileLoader ?? new FileLoader();
  }

  loadDirectory(dirPath: string, options?: LoadDirectoryOptions): LoadDirectoryResult {
    const extensions = options?.extensions ?? ['.json'];

    let entries: string[];
    try {
      entries = readdirSync(dirPath);
    } catch (err: unknown) {
      const nodeErr = err as NodeJS.ErrnoException;
      if (nodeErr.code === 'ENOENT') {
        return {
          success: false,
          resources: [],
          errors: [{
            code: LoadErrorCode.FILE_NOT_FOUND,
            message: `Directory not found: ${dirPath}`,
            filePath: dirPath,
          }],
          totalFiles: 0,
          loadedFiles: 0,
        };
      }
      return {
        success: false,
        resources: [],
        errors: [{
          code: LoadErrorCode.IO_ERROR,
          message: `Failed to read directory: ${dirPath}`,
          filePath: dirPath,
          details: nodeErr.message,
        }],
        totalFiles: 0,
        loadedFiles: 0,
      };
    }

    const files = entries.filter(f => extensions.includes(extname(f).toLowerCase()));
    const resources: FhirDefinitionResource[] = [];
    const errors: LoadError[] = [];

    for (const file of files) {
      const filePath = join(dirPath, file);
      const result = this.fileLoader.loadFile(filePath);

      if (result.success && result.resource) {
        resources.push(result.resource);
      } else if (result.error) {
        errors.push(result.error);
      }
    }

    return {
      success: errors.length === 0,
      resources,
      errors,
      totalFiles: files.length,
      loadedFiles: resources.length,
    };
  }
}
