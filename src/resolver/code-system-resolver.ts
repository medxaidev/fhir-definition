import type { CodeSystem, ConceptInfo } from '../model/index.js';
import type { DefinitionRegistry } from '../registry/definition-registry.js';

export class CodeSystemResolver {
  private readonly registry: DefinitionRegistry;

  constructor(registry: DefinitionRegistry) {
    this.registry = registry;
  }

  resolve(url: string): CodeSystem | undefined {
    return this.registry.getCodeSystem(url);
  }

  /**
   * 在指定 CodeSystem 中查找 code，支持嵌套 concept 递归查找。
   */
  lookupCode(system: string, code: string): ConceptInfo | undefined {
    const cs = this.registry.getCodeSystem(system);
    if (!cs?.concept) return undefined;

    return this.findConcept(cs.concept, code, system);
  }

  list(): string[] {
    return this.registry.listCodeSystems();
  }

  private findConcept(
    concepts: Array<{ code: string; display?: string; definition?: string; concept?: unknown[] }>,
    targetCode: string,
    system: string,
  ): ConceptInfo | undefined {
    for (const concept of concepts) {
      if (concept.code === targetCode) {
        return {
          code: concept.code,
          display: concept.display,
          definition: concept.definition,
          system,
        };
      }

      // 递归查找嵌套 concept
      if (concept.concept && Array.isArray(concept.concept)) {
        const nested = concept.concept as Array<{
          code: string;
          display?: string;
          definition?: string;
          concept?: unknown[];
        }>;
        const found = this.findConcept(nested, targetCode, system);
        if (found) return found;
      }
    }

    return undefined;
  }
}
