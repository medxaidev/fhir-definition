import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { loadDefinitionPackages } from '../load-definition-packages.js';
import type { DefinitionProvider } from '../contract/definition-provider.js';

const PACKAGES = join(__dirname, 'fixtures', 'packages');

/**
 * 场景 B — 多包加载 + 模拟 fhir-runtime 消费
 *
 * 模拟流程：
 *   loadDefinitionPackages() → registry (as DefinitionProvider) → runtime.validate()
 */
describe('Scenario B: multi-package → DefinitionProvider → runtime simulation', () => {
  it('should load packages and satisfy DefinitionProvider', () => {
    const { registry } = loadDefinitionPackages(PACKAGES);
    const provider: DefinitionProvider = registry;
    expect(provider).toBeDefined();
  });

  it('runtime should get SD from base package (r4.core)', () => {
    const { registry } = loadDefinitionPackages(PACKAGES);
    const provider: DefinitionProvider = registry;
    const patient = provider.getStructureDefinition('http://hl7.org/fhir/StructureDefinition/Patient');
    expect(patient).toBeDefined();
    expect(patient!.name).toBe('Patient');
  });

  it('runtime should get SD from dependent package (us.core)', () => {
    const { registry } = loadDefinitionPackages(PACKAGES);
    const provider: DefinitionProvider = registry;
    const usCorePatient = provider.getStructureDefinition(
      'http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient',
    );
    expect(usCorePatient).toBeDefined();
    expect(usCorePatient!.name).toBe('USCorePatientProfile');
  });

  it('runtime should get SD from custom package', () => {
    const { registry } = loadDefinitionPackages(PACKAGES);
    const provider: DefinitionProvider = registry;
    const custom = provider.getStructureDefinition('http://example.com/StructureDefinition/CustomCondition');
    expect(custom).toBeDefined();
  });

  it('simulated validate flow: profile resolution across packages', () => {
    const { registry } = loadDefinitionPackages(PACKAGES);
    const provider: DefinitionProvider = registry;

    // 模拟：runtime 验证 US Core Patient 时需要 base Patient SD
    const usCorePatient = provider.getStructureDefinition(
      'http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient',
    );
    expect(usCorePatient).toBeDefined();

    // baseDefinition 指向 r4.core 的 Patient
    const baseUrl = (usCorePatient as any).baseDefinition;
    if (baseUrl) {
      const baseSd = provider.getStructureDefinition(baseUrl);
      expect(baseSd).toBeDefined();
      expect(baseSd!.name).toBe('Patient');
    }
  });

  it('simulated validate flow: terminology binding across packages', () => {
    const { registry } = loadDefinitionPackages(PACKAGES);
    const provider: DefinitionProvider = registry;

    // VS 和 CS 跨包可查询
    const vs = provider.getValueSet('http://hl7.org/fhir/ValueSet/administrative-gender');
    expect(vs).toBeDefined();
    const cs = provider.getCodeSystem('http://terminology.hl7.org/CodeSystem/observation-category');
    expect(cs).toBeDefined();
  });
});
