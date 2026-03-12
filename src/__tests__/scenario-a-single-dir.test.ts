import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { loadFromDirectory } from '../load-from-directory.js';
import type { DefinitionProvider } from '../contract/definition-provider.js';

const FIXTURES = join(__dirname, 'fixtures');

/**
 * 场景 A — 单目录加载 + 模拟 fhir-runtime 消费
 *
 * 模拟流程：
 *   loadFromDirectory() → registry (as DefinitionProvider) → runtime.validate()
 */
describe('Scenario A: single directory → DefinitionProvider → runtime simulation', () => {
  it('should load from directory and satisfy DefinitionProvider', () => {
    const registry = loadFromDirectory(FIXTURES);
    const provider: DefinitionProvider = registry;
    expect(provider).toBeDefined();
  });

  it('runtime should be able to get StructureDefinition for validation', () => {
    const provider: DefinitionProvider = loadFromDirectory(FIXTURES);
    const patientSd = provider.getStructureDefinition('http://hl7.org/fhir/StructureDefinition/Patient');
    expect(patientSd).toBeDefined();
    expect(patientSd!.resourceType).toBe('StructureDefinition');
    expect(patientSd!.type).toBe('Patient');
  });

  it('runtime should be able to get ValueSet for terminology binding', () => {
    const provider: DefinitionProvider = loadFromDirectory(FIXTURES);
    const genderVs = provider.getValueSet('http://hl7.org/fhir/ValueSet/administrative-gender');
    expect(genderVs).toBeDefined();
    expect(genderVs!.resourceType).toBe('ValueSet');
  });

  it('runtime should be able to get CodeSystem for terminology validation', () => {
    const provider: DefinitionProvider = loadFromDirectory(FIXTURES);
    const genderCs = provider.getCodeSystem('http://hl7.org/fhir/administrative-gender');
    expect(genderCs).toBeDefined();
    expect(genderCs!.resourceType).toBe('CodeSystem');
  });

  it('runtime should be able to get SearchParameters for a resource type', () => {
    const provider: DefinitionProvider = loadFromDirectory(FIXTURES);
    const patientSps = provider.getSearchParameters('Patient');
    expect(patientSps.length).toBeGreaterThanOrEqual(2);
    for (const sp of patientSps) {
      expect(sp.resourceType).toBe('SearchParameter');
      expect(sp.base).toContain('Patient');
    }
  });

  it('simulated validate flow: get SD → check elements exist', () => {
    const provider: DefinitionProvider = loadFromDirectory(FIXTURES);
    const sd = provider.getStructureDefinition('http://hl7.org/fhir/StructureDefinition/Patient');
    expect(sd).toBeDefined();
    // 模拟 runtime.validate：检查 SD 有 snapshot 或 differential
    expect(sd!.snapshot || sd!.differential).toBeDefined();
  });
});
