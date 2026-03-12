import type { DefinitionRegistry } from './registry/index.js';
import { InMemoryDefinitionRegistry } from './registry/index.js';
import { DirectoryLoader } from './loader/index.js';

/**
 * 从单个目录加载所有 FHIR 定义文件，返回一个就绪的 DefinitionRegistry。
 *
 * 扫描 dirPath 下的所有 .json 文件，识别 StructureDefinition / ValueSet / CodeSystem / SearchParameter，
 * 注册到 InMemoryDefinitionRegistry 并返回。
 */
export function loadFromDirectory(dirPath: string): DefinitionRegistry {
  const loader = new DirectoryLoader();
  const result = loader.loadDirectory(dirPath);

  const registry = new InMemoryDefinitionRegistry();

  for (const resource of result.resources) {
    registry.register(resource);
  }

  return registry;
}
