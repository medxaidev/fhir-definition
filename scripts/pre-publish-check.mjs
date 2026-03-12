#!/usr/bin/env node

/**
 * Pre-publish verification script for fhir-definition v0.4.0
 * 
 * Checks:
 * 1. All tests pass
 * 2. TypeScript compiles without errors
 * 3. Build succeeds
 * 4. Package.json version is correct
 * 5. Required files exist
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';

const REQUIRED_VERSION = '0.4.0';
const REQUIRED_FILES = [
  'README.md',
  'CHANGELOG.md',
  'RELEASE-v0.4.0.md',
  'docs/api-reference.md',
  'docs/fhir-runtime-integration.md',
  'devdocs/v1.0-evaluation.md',
  'LICENSE',
];

let hasErrors = false;

function log(message, type = 'info') {
  const prefix = {
    info: '✓',
    warn: '⚠',
    error: '✗',
  }[type];
  console.log(`${prefix} ${message}`);
}

function error(message) {
  log(message, 'error');
  hasErrors = true;
}

function run(command, description) {
  try {
    log(`Checking: ${description}...`);
    execSync(command, { stdio: 'pipe' });
    log(`${description} passed`, 'info');
    return true;
  } catch (e) {
    error(`${description} failed`);
    console.error(e.stdout?.toString() || e.stderr?.toString() || e.message);
    return false;
  }
}

console.log('\n=== fhir-definition v0.4.0 Pre-Publish Verification ===\n');

// 1. Check package.json version
log('Checking package.json version...');
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
if (pkg.version === REQUIRED_VERSION) {
  log(`Version is ${REQUIRED_VERSION}`, 'info');
} else {
  error(`Version mismatch: expected ${REQUIRED_VERSION}, got ${pkg.version}`);
}

// 2. Check required files
log('Checking required files...');
for (const file of REQUIRED_FILES) {
  if (existsSync(file)) {
    log(`${file} exists`, 'info');
  } else {
    error(`Missing required file: ${file}`);
  }
}

// 3. Run tests
run('npx vitest run', 'Tests');

// 4. TypeScript compilation
run('npx tsc --noEmit', 'TypeScript compilation');

// 5. Build
run('npm run build', 'Build');

// 6. Check dist output
log('Checking build output...');
const distFiles = ['dist/esm/index.mjs', 'dist/cjs/index.cjs', 'dist/index.d.ts'];
for (const file of distFiles) {
  if (existsSync(file)) {
    log(`${file} exists`, 'info');
  } else {
    error(`Missing build output: ${file}`);
  }
}

// Summary
console.log('\n=== Summary ===\n');
if (hasErrors) {
  console.log('❌ Pre-publish checks FAILED. Please fix errors above.\n');
  process.exit(1);
} else {
  console.log('✅ All pre-publish checks PASSED!\n');
  console.log('Ready to publish:');
  console.log('  npm publish --dry-run  # Test publish');
  console.log('  npm publish            # Actual publish');
  console.log('\n');
  process.exit(0);
}
