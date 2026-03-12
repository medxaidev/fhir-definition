import type { ValueSet } from '../model/index.js';
import type { DefinitionRegistry } from '../registry/definition-registry.js';

export class ValueSetResolver {
  private readonly registry: DefinitionRegistry;

  constructor(registry: DefinitionRegistry) {
    this.registry = registry;
  }

  resolve(url: string): ValueSet | undefined {
    return this.registry.getValueSet(url);
  }

  list(): string[] {
    return this.registry.listValueSets();
  }
}
