import type {
  DefinitionPackage,
  DependencyResolutionResult,
  LoadError,
} from '../model/index.js';
import { LoadErrorCode } from '../model/index.js';

export class DependencyResolver {
  resolve(packages: DefinitionPackage[]): DependencyResolutionResult {
    if (packages.length === 0) {
      return { success: true, sorted: [], errors: [], warnings: [] };
    }

    // 按 name 索引
    const byName = new Map<string, DefinitionPackage>();
    for (const pkg of packages) {
      byName.set(pkg.name, pkg);
    }

    // 构建 in-degree 和 adjacency
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>(); // dep → [packages that depend on it]
    const warnings: LoadError[] = [];

    for (const pkg of packages) {
      if (!inDegree.has(pkg.name)) {
        inDegree.set(pkg.name, 0);
      }
      if (!dependents.has(pkg.name)) {
        dependents.set(pkg.name, []);
      }

      for (const depName of Object.keys(pkg.dependencies)) {
        if (!byName.has(depName)) {
          // 缺失依赖（non-fatal warning）
          warnings.push({
            code: LoadErrorCode.MISSING_DEPENDENCY,
            message: `Package "${pkg.name}" depends on "${depName}" which was not found`,
            filePath: pkg.path,
          });
          continue;
        }

        // depName → pkg.name (pkg depends on depName)
        if (!dependents.has(depName)) {
          dependents.set(depName, []);
        }
        dependents.get(depName)!.push(pkg.name);
        inDegree.set(pkg.name, (inDegree.get(pkg.name) ?? 0) + 1);
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    for (const [name, degree] of inDegree) {
      if (degree === 0) {
        queue.push(name);
      }
    }

    const sorted: DefinitionPackage[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const pkg = byName.get(current);
      if (pkg) {
        sorted.push(pkg);
      }

      const deps = dependents.get(current) ?? [];
      for (const dep of deps) {
        const newDegree = (inDegree.get(dep) ?? 1) - 1;
        inDegree.set(dep, newDegree);
        if (newDegree === 0) {
          queue.push(dep);
        }
      }
    }

    // 循环依赖检测
    if (sorted.length < packages.length) {
      const sortedNames = new Set(sorted.map(p => p.name));
      const cyclicNames = packages
        .filter(p => !sortedNames.has(p.name))
        .map(p => p.name);

      return {
        success: false,
        sorted, // 返回已排序的部分
        errors: [{
          code: LoadErrorCode.CIRCULAR_DEPENDENCY,
          message: `Circular dependency detected among: ${cyclicNames.join(', ')}`,
          details: cyclicNames,
        }],
        warnings,
      };
    }

    return { success: true, sorted, errors: [], warnings };
  }
}
