/**
 * Generate TypeScript types from OpenRPC schema
 *
 * Pipeline: YAML → JSON → TypeScript
 */

import * as fs from 'fs';
import * as path from 'path';
import { load } from 'js-yaml';

const ROOT_DIR = path.join(import.meta.dir, '..');
const YAML_PATH = path.join(ROOT_DIR, 'openrpc.yaml');
const JSON_PATH = path.join(ROOT_DIR, 'openrpc.json');
const TYPES_PATH = path.join(ROOT_DIR, 'src', 'types.ts');

interface OpenRPCSchema {
  openrpc: string;
  info: { title: string; version: string };
  methods: OpenRPCMethod[];
  components?: { schemas?: Record<string, JSONSchema> };
}

interface OpenRPCMethod {
  name: string;
  summary?: string;
  description?: string;
  params: OpenRPCParam[];
  result: { name: string; schema: JSONSchema };
}

interface OpenRPCParam {
  name: string;
  description?: string;
  required?: boolean;
  schema: JSONSchema;
}

interface JSONSchema {
  type?: string;
  $ref?: string;
  enum?: (string | number)[];
  items?: JSONSchema;
  properties?: Record<string, JSONSchema>;
  additionalProperties?: JSONSchema | boolean;
  required?: string[];
  oneOf?: JSONSchema[];
  format?: string;
  minimum?: number;
  minLength?: number;
  pattern?: string;
  default?: unknown;
  description?: string;
}

// Convert YAML to JSON
function yamlToJson(): OpenRPCSchema {
  console.log('Reading OpenRPC YAML schema...');
  const yamlContent = fs.readFileSync(YAML_PATH, 'utf-8');
  const schema = load(yamlContent) as OpenRPCSchema;

  console.log('Writing OpenRPC JSON schema...');
  fs.writeFileSync(JSON_PATH, JSON.stringify(schema, null, 2));

  return schema;
}

// Convert JSON Schema type to TypeScript type
function jsonSchemaToTS(schema: JSONSchema, schemas: Record<string, JSONSchema>, indent = ''): string {
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop()!;
    return refName;
  }

  if (schema.oneOf) {
    const types = schema.oneOf.map(s => jsonSchemaToTS(s, schemas, indent));
    return types.join(' | ');
  }

  if (schema.enum) {
    return schema.enum.map(v => typeof v === 'string' ? `'${v}'` : v).join(' | ');
  }

  if (schema.type === 'array') {
    const itemType = schema.items ? jsonSchemaToTS(schema.items, schemas, indent) : 'unknown';
    return `${itemType}[]`;
  }

  if (schema.type === 'object') {
    if (schema.additionalProperties && typeof schema.additionalProperties !== 'boolean') {
      const valueType = jsonSchemaToTS(schema.additionalProperties, schemas, indent);
      return `Record<string, ${valueType}>`;
    }

    if (!schema.properties) {
      return 'Record<string, unknown>';
    }

    const required = new Set(schema.required || []);
    const props = Object.entries(schema.properties).map(([key, propSchema]) => {
      const optional = required.has(key) ? '' : '?';
      const propType = jsonSchemaToTS(propSchema, schemas, indent + '  ');
      return `${indent}  ${key}${optional}: ${propType};`;
    });

    return `{\n${props.join('\n')}\n${indent}}`;
  }

  if (schema.type === 'string') {
    if (schema.format === 'date-time' || schema.format === 'date') {
      return 'string';
    }
    return 'string';
  }

  if (schema.type === 'integer' || schema.type === 'number') {
    return 'number';
  }

  if (schema.type === 'boolean') {
    return 'boolean';
  }

  if (schema.type === 'null') {
    return 'null';
  }

  return 'unknown';
}

// Generate TypeScript interface from JSON Schema
function generateInterface(name: string, schema: JSONSchema, schemas: Record<string, JSONSchema>): string {
  // Handle enum types
  if (schema.enum) {
    const enumValues = schema.enum.map(v => typeof v === 'string' ? `'${v}'` : v).join(' | ');
    return `export type ${name} = ${enumValues};`;
  }

  // Handle oneOf types
  if (schema.oneOf) {
    const types = schema.oneOf.map(s => jsonSchemaToTS(s, schemas));
    return `export type ${name} = ${types.join(' | ')};`;
  }

  // Handle object types with additionalProperties only (Record types)
  if (schema.type === 'object' && schema.additionalProperties && !schema.properties) {
    const valueType = typeof schema.additionalProperties === 'boolean'
      ? 'unknown'
      : jsonSchemaToTS(schema.additionalProperties, schemas);
    return `export type ${name} = Record<string, ${valueType}>;`;
  }

  // Handle regular object types
  if (schema.type === 'object' && schema.properties) {
    const required = new Set(schema.required || []);
    const props = Object.entries(schema.properties).map(([key, propSchema]) => {
      const optional = required.has(key) ? '' : '?';
      const propType = jsonSchemaToTS(propSchema, schemas);
      const comment = propSchema.description ? `  /** ${propSchema.description} */\n` : '';
      return `${comment}  ${key}${optional}: ${propType};`;
    });

    return `export interface ${name} {\n${props.join('\n')}\n}`;
  }

  // Fallback for other types
  const tsType = jsonSchemaToTS(schema, schemas);
  return `export type ${name} = ${tsType};`;
}

// Generate method param and result types
function generateMethodTypes(method: OpenRPCMethod, schemas: Record<string, JSONSchema>): string[] {
  const lines: string[] = [];
  const methodName = method.name.replace(/\./g, '_');
  const pascalName = methodName.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');

  // Generate params interface
  if (method.params.length > 0) {
    const paramProps = method.params.map(param => {
      const optional = param.required === false ? '?' : '';
      const paramType = jsonSchemaToTS(param.schema, schemas);
      const comment = param.description ? `  /** ${param.description} */\n` : '';
      return `${comment}  ${param.name}${optional}: ${paramType};`;
    });

    lines.push(`export interface ${pascalName}Params {\n${paramProps.join('\n')}\n}`);
  } else {
    lines.push(`export type ${pascalName}Params = void;`);
  }

  // Generate result type
  const resultType = jsonSchemaToTS(method.result.schema, schemas);
  lines.push(`export type ${pascalName}Result = ${resultType};`);

  return lines;
}

// Main generation function
function generateTypes(schema: OpenRPCSchema): void {
  const schemas = schema.components?.schemas || {};
  const lines: string[] = [
    '/**',
    ' * Auto-generated TypeScript types from OpenRPC schema',
    ' * DO NOT EDIT MANUALLY - Run `bun run generate` to regenerate',
    ' */',
    '',
    '// =============================================================================',
    '// Core Schemas',
    '// =============================================================================',
    ''
  ];

  // Generate schema types
  for (const [name, schemaObj] of Object.entries(schemas)) {
    lines.push(generateInterface(name, schemaObj, schemas));
    lines.push('');
  }

  lines.push('// =============================================================================');
  lines.push('// Method Types');
  lines.push('// =============================================================================');
  lines.push('');

  // Generate method types
  for (const method of schema.methods) {
    const methodTypes = generateMethodTypes(method, schemas);
    lines.push(...methodTypes);
    lines.push('');
  }

  // Generate method name union type
  const methodNames = schema.methods.map(m => `'${m.name}'`).join(' | ');
  lines.push('// Method names union type');
  lines.push(`export type MethodName = ${methodNames};`);
  lines.push('');

  // Generate method map type
  lines.push('// Method handler map type');
  lines.push('export interface MethodHandlers {');
  for (const method of schema.methods) {
    const methodName = method.name.replace(/\./g, '_');
    const pascalName = methodName.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
    const paramsType = method.params.length > 0 ? `${pascalName}Params` : 'void';
    lines.push(`  '${method.name}': (params: ${paramsType}) => Promise<${pascalName}Result>;`);
  }
  lines.push('}');

  console.log('Writing TypeScript types...');
  fs.writeFileSync(TYPES_PATH, lines.join('\n'));
}

// Run generation
console.log('Starting OpenRPC type generation...\n');

try {
  const schema = yamlToJson();
  generateTypes(schema);
  console.log('\n✓ Generation complete');
  console.log(`  - JSON schema: ${JSON_PATH}`);
  console.log(`  - TypeScript types: ${TYPES_PATH}`);
} catch (error) {
  console.error('Generation failed:', error);
  process.exit(1);
}
