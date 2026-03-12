import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { loadFromDirectory } from '../load-from-directory.js';

const FIXTURES = join(__dirname, 'fixtures');

describe('loadFromDirectory (end-to-end)', () => {
  it('should load all definitions from fixtures and return a registry', () => {
    const registry = loadFromDirectory(FIXTURES);
    const stats = registry.getStatistics();

    // We have: 5+ SDs, 3+ VSs, 3+ CSs, 4+ SPs
    expect(stats.structureDefinitionCount).toBeGreaterThanOrEqual(5);
    expect(stats.valueSetCount).toBeGreaterThanOrEqual(3);
    expect(stats.codeSystemCount).toBeGreaterThanOrEqual(3);
    expect(stats.searchParameterCount).toBeGreaterThanOrEqual(4);
  });

  it('should query StructureDefinition by URL', () => {
    const registry = loadFromDirectory(FIXTURES);
    const patient = registry.getStructureDefinition('http://hl7.org/fhir/StructureDefinition/Patient');
    expect(patient).toBeDefined();
    expect(patient?.resourceType).toBe('StructureDefinition');
    expect(patient?.name).toBe('Patient');
  });

  it('should query SD by version', () => {
    const registry = loadFromDirectory(FIXTURES);
    const v1 = registry.getStructureDefinitionByVersion(
      'http://hl7.org/fhir/StructureDefinition/Patient',
      '4.0.1',
    );
    const v2 = registry.getStructureDefinitionByVersion(
      'http://hl7.org/fhir/StructureDefinition/Patient',
      '5.0.0',
    );
    expect(v1).toBeDefined();
    expect(v2).toBeDefined();
    expect(v1?.version).toBe('4.0.1');
    expect(v2?.version).toBe('5.0.0');
  });

  it('should list all SD URLs', () => {
    const registry = loadFromDirectory(FIXTURES);
    const urls = registry.listStructureDefinitions();
    expect(urls).toContain('http://hl7.org/fhir/StructureDefinition/Patient');
    expect(urls).toContain('http://hl7.org/fhir/StructureDefinition/Observation');
  });

  it('should query ValueSet by URL', () => {
    const registry = loadFromDirectory(FIXTURES);
    const vs = registry.getValueSet('http://hl7.org/fhir/ValueSet/administrative-gender');
    expect(vs).toBeDefined();
    expect(vs?.name).toBe('AdministrativeGender');
  });

  it('should list all VS URLs', () => {
    const registry = loadFromDirectory(FIXTURES);
    const urls = registry.listValueSets();
    expect(urls).toContain('http://hl7.org/fhir/ValueSet/administrative-gender');
    expect(urls.length).toBeGreaterThanOrEqual(3);
  });

  it('should query CodeSystem by URL', () => {
    const registry = loadFromDirectory(FIXTURES);
    const cs = registry.getCodeSystem('http://terminology.hl7.org/CodeSystem/observation-category');
    expect(cs).toBeDefined();
    expect(cs?.name).toBe('ObservationCategoryCodes');
  });

  it('should list all CS URLs', () => {
    const registry = loadFromDirectory(FIXTURES);
    const urls = registry.listCodeSystems();
    expect(urls.length).toBeGreaterThanOrEqual(3);
  });

  it('should query SearchParameter by resourceType', () => {
    const registry = loadFromDirectory(FIXTURES);
    const patientSps = registry.getSearchParameters('Patient');
    expect(patientSps.length).toBeGreaterThanOrEqual(2);
  });

  it('should query SearchParameter by resourceType + name', () => {
    const registry = loadFromDirectory(FIXTURES);
    const sp = registry.getSearchParameter('Patient', 'name');
    expect(sp).toBeDefined();
    expect(sp?.expression).toBe('Patient.name');
  });

  it('should query SearchParameter by URL', () => {
    const registry = loadFromDirectory(FIXTURES);
    const sp = registry.getSearchParameterByUrl('http://hl7.org/fhir/SearchParameter/Patient-name');
    expect(sp).toBeDefined();
    expect(sp?.code).toBe('name');
  });

  it('should handle multi-base SearchParameter', () => {
    const registry = loadFromDirectory(FIXTURES);
    // clinical-date has base: [Condition, Encounter, Observation]
    const condSp = registry.getSearchParameter('Condition', 'date');
    const obsSp = registry.getSearchParameter('Observation', 'date');
    expect(condSp).toBeDefined();
    expect(obsSp).toBeDefined();
    expect(condSp).toBe(obsSp); // same SP object
  });

  it('should support hasStructureDefinition', () => {
    const registry = loadFromDirectory(FIXTURES);
    expect(registry.hasStructureDefinition('http://hl7.org/fhir/StructureDefinition/Patient')).toBe(true);
    expect(registry.hasStructureDefinition('http://nonexistent')).toBe(false);
  });

  it('should support hasValueSet', () => {
    const registry = loadFromDirectory(FIXTURES);
    expect(registry.hasValueSet('http://hl7.org/fhir/ValueSet/administrative-gender')).toBe(true);
    expect(registry.hasValueSet('http://nonexistent')).toBe(false);
  });

  it('should support hasCodeSystem', () => {
    const registry = loadFromDirectory(FIXTURES);
    expect(registry.hasCodeSystem('http://hl7.org/fhir/administrative-gender')).toBe(true);
    expect(registry.hasCodeSystem('http://nonexistent')).toBe(false);
  });
});
