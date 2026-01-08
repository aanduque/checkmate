/**
 * Validate OpenRPC schema against the OpenRPC meta-schema
 */

import * as fs from 'fs';
import * as path from 'path';
import { load } from 'js-yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import openRpcMetaSchema from '@open-rpc/meta-schema';

const SCHEMA_PATH = path.join(import.meta.dir, '..', 'openrpc.yaml');

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export function validateSchema(): ValidationResult {
  // Read and parse YAML
  const yamlContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  let schema: unknown;

  try {
    schema = load(yamlContent);
  } catch (error) {
    return {
      valid: false,
      errors: [`YAML parse error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }

  // Validate against OpenRPC meta-schema
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);

  const validate = ajv.compile(openRpcMetaSchema);
  const isValid = validate(schema);

  if (!isValid && validate.errors) {
    return {
      valid: false,
      errors: validate.errors.map(err =>
        `${err.instancePath || '/'}: ${err.message}`
      )
    };
  }

  return { valid: true };
}

// Run validation if executed directly
if (import.meta.main) {
  console.log('Validating OpenRPC schema...\n');

  const result = validateSchema();

  if (result.valid) {
    console.log('✓ OpenRPC schema is valid');
    process.exit(0);
  } else {
    console.error('✗ Schema validation failed:\n');
    result.errors?.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}
