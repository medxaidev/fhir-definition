import type { LoadPackagesOptions, LoadPackagesOutput } from './model/index.js';
import { PackageManager } from './package/index.js';

/**
 * 从多包根目录加载 FHIR 定义包，返回就绪的 DefinitionRegistry 和加载结果。
 *
 * 扫描 rootPath 下所有含 package.json 的子目录，解析依赖关系，按拓扑顺序加载，
 * 注册到 InMemoryDefinitionRegistry 并返回。
 *
 * 支持 Hybrid 模式：npm 官方包 + 文件系统自定义包共用同一 pipeline。
 */
export function loadDefinitionPackages(
  rootPath: string,
  options?: LoadPackagesOptions,
): LoadPackagesOutput {
  const manager = new PackageManager();
  return manager.loadPackages(rootPath, options);
}
