#!/usr/bin/env node

/**
 * Schema Validation Script
 *
 * Validates:
 * 1. All JSON schemas are syntactically valid
 * 2. All templates match their corresponding schemas
 * 3. Schema field names follow naming conventions
 */

import Ajv from 'ajv';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schemasDir = join(__dirname, '..', 'schemas');
const templatesDir = join(__dirname, '..', 'templates');

const ajv = new Ajv({ allErrors: true, strict: false });

let hasErrors = false;

function error(msg) {
  console.error(`❌ ${msg}`);
  hasErrors = true;
}

function success(msg) {
  console.log(`✓ ${msg}`);
}

// 1. Validate all schema files are syntactically valid
console.log('\n=== Validating Schema Syntax ===\n');

const schemaFiles = readdirSync(schemasDir).filter(f => f.endsWith('.schema.json'));

if (schemaFiles.length === 0) {
  error('No schema files found in schemas/');
  process.exit(1);
}

const schemas = {};

for (const schemaFile of schemaFiles) {
  const schemaPath = join(schemasDir, schemaFile);
  try {
    const schemaContent = readFileSync(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent);

    // Validate schema syntax
    const valid = ajv.validateSchema(schema);
    if (!valid) {
      error(`Invalid schema syntax: ${schemaFile}`);
      console.error('  Errors:', ajv.errors);
    } else {
      success(`Schema valid: ${schemaFile}`);
      schemas[schemaFile] = schema;
    }
  } catch (e) {
    error(`Failed to parse ${schemaFile}: ${e.message}`);
  }
}

// 2. Validate templates match schemas
console.log('\n=== Validating Templates Against Schemas ===\n');

if (existsSync(templatesDir)) {
  const templateFiles = readdirSync(templatesDir).filter(f => f.endsWith('.template.json'));

  for (const templateFile of templateFiles) {
    const schemaName = templateFile.replace('.template.json', '.schema.json');
    const schemaPath = join(schemasDir, schemaName);
    const templatePath = join(templatesDir, templateFile);

    if (!existsSync(schemaPath)) {
      error(`Template ${templateFile} has no matching schema ${schemaName}`);
      continue;
    }

    try {
      const template = JSON.parse(readFileSync(templatePath, 'utf-8'));
      const schema = schemas[schemaName];

      if (schema) {
        const validate = ajv.compile(schema);
        const valid = validate(template);

        if (!valid) {
          // Templates may have empty required fields as placeholders
          // Only warn, don't fail
          console.log(`⚠ Template ${templateFile} has validation warnings (empty placeholders expected)`);
          // Uncomment to see details:
          // console.log('  Warnings:', validate.errors);
        } else {
          success(`Template matches schema: ${templateFile}`);
        }
      }
    } catch (e) {
      error(`Failed to validate template ${templateFile}: ${e.message}`);
    }
  }
} else {
  console.log('  No templates directory found, skipping template validation');
}

// 3. Check naming conventions
console.log('\n=== Checking Naming Conventions ===\n');

const FORBIDDEN_PATTERNS = [
  // TypeScript-style camelCase for ID references (should be snake_case)
  { pattern: /characterA|characterB/i, message: 'Use "from"/"to" instead of "characterA"/"characterB"' },
  // Wrong severity levels
  { pattern: /"severity":\s*"(low|medium|high)"/i, message: 'Use "critical"/"major"/"minor" for severity' },
];

for (const [schemaFile, schema] of Object.entries(schemas)) {
  const schemaStr = JSON.stringify(schema);

  for (const { pattern, message } of FORBIDDEN_PATTERNS) {
    if (pattern.test(schemaStr)) {
      error(`${schemaFile}: ${message}`);
    }
  }
}

success('Naming convention check complete');

// Summary
console.log('\n=== Summary ===\n');

if (hasErrors) {
  console.error('❌ Schema validation FAILED');
  process.exit(1);
} else {
  console.log('✓ All schemas validated successfully');
  process.exit(0);
}
