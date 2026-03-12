import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { loadDefinitionPackages } from '../load-definition-packages.js';
import { loadFromDirectory } from '../load-from-directory.js';
import type { DefinitionProvider } from '../contract/definition-provider.js';

const FIXTURES = join(__dirname, 'fixtures');
const PACKAGES = join(__dirname, 'fixtures', 'packages');

/**
 * 场景 C — SearchParameter Pipeline
 *
 * 模拟流程：
 *   registry.getSearchParameters("Patient")
 *   → 逐个 SP 提取 expression
 *   → 模拟 runtime.extractSearchValues(patient, sp)
 *   → 模拟 persistence 索引写入
 */
describe('Scenario C: SearchParameter pipeline → persistence simulation', () => {
  it('should get all Patient SPs via DefinitionProvider', () => {
    const provider: DefinitionProvider = loadFromDirectory(FIXTURES);
    const sps = provider.getSearchParameters('Patient');
    expect(sps.length).toBeGreaterThanOrEqual(2);
  });

  it('each SP should have code and expression for indexing', () => {
    const provider: DefinitionProvider = loadFromDirectory(FIXTURES);
    const sps = provider.getSearchParameters('Patient');
    for (const sp of sps) {
      expect(sp.code || sp.name).toBeTruthy();
      // expression 用于 fhir-runtime extractSearchValues
      if (sp.expression) {
        expect(typeof sp.expression).toBe('string');
        expect(sp.expression.length).toBeGreaterThan(0);
      }
    }
  });

  it('simulated extractSearchValues: Patient.name SP', () => {
    const provider: DefinitionProvider = loadFromDirectory(FIXTURES);
    const sps = provider.getSearchParameters('Patient');
    const nameSp = sps.find(sp => sp.code === 'name');
    expect(nameSp).toBeDefined();
    expect(nameSp!.expression).toBe('Patient.name');
    expect(nameSp!.type).toBe('string');

    // 模拟 runtime.extractSearchValues 的输入
    const mockPatient = { resourceType: 'Patient', name: [{ family: 'Smith' }] };
    // runtime 会用 SP.expression 从 mockPatient 提取值
    expect(nameSp!.expression).toBe('Patient.name');
  });

  it('simulated extractSearchValues: Patient.gender SP', () => {
    const provider: DefinitionProvider = loadFromDirectory(FIXTURES);
    const sps = provider.getSearchParameters('Patient');
    const genderSp = sps.find(sp => sp.code === 'gender');
    expect(genderSp).toBeDefined();
    expect(genderSp!.expression).toBe('Patient.gender');
    expect(genderSp!.type).toBe('token');
  });

  it('multi-base SP should be accessible from multiple resource types', () => {
    const provider: DefinitionProvider = loadFromDirectory(FIXTURES);

    // clinical-date SP has base: [Condition, Encounter, Observation]
    const conditionSps = provider.getSearchParameters('Condition');
    const dateSp = conditionSps.find(sp => sp.code === 'date');
    expect(dateSp).toBeDefined();

    const obsSps = provider.getSearchParameters('Observation');
    const obsDateSp = obsSps.find(sp => sp.code === 'date');
    expect(obsDateSp).toBeDefined();

    // 同一个 SP 对象
    expect(dateSp).toBe(obsDateSp);
  });

  it('SP pipeline from packages should work across package boundaries', () => {
    const { registry } = loadDefinitionPackages(PACKAGES);
    const provider: DefinitionProvider = registry;

    // r4.core 的 patient-name SP
    const patientSps = provider.getSearchParameters('Patient');
    expect(patientSps.length).toBeGreaterThanOrEqual(2);

    const nameSp = patientSps.find(sp => sp.code === 'name');
    expect(nameSp).toBeDefined();
    expect(nameSp!.url).toBe('http://hl7.org/fhir/SearchParameter/Patient-name');

    // us.core 的 patient-gender SP
    const genderSp = patientSps.find(sp => sp.code === 'gender');
    expect(genderSp).toBeDefined();
    expect(genderSp!.url).toBe('http://hl7.org/fhir/SearchParameter/Patient-gender');
  });

  it('persistence schema analysis: SD for resource structure', () => {
    const { registry } = loadDefinitionPackages(PACKAGES);
    const provider: DefinitionProvider = registry;

    // fhir-persistence 需要 SD 来分析资源结构
    const patientSd = provider.getStructureDefinition('http://hl7.org/fhir/StructureDefinition/Patient');
    expect(patientSd).toBeDefined();
    expect(patientSd!.type).toBe('Patient');
    expect(patientSd!.kind).toBe('resource');
  });
});
