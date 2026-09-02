const fs = require('fs');

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: node scripts/generate-types.cjs <schema.json> <output.ts>');

const schema = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const databasePrefix = 'Database["buzzerhood"]["Enums"]';

function valueType(column) {
  if (schema.enums[column.udt_name]) return `${databasePrefix}[${JSON.stringify(column.udt_name)}]`;
  if (['uuid', 'text', 'varchar', 'bpchar', 'timestamptz', 'timestamp', 'date'].includes(column.udt_name)) return 'string';
  if (['int2', 'int4', 'int8', 'numeric', 'float4', 'float8'].includes(column.udt_name)) return 'number';
  if (column.udt_name === 'bool') return 'boolean';
  if (['json', 'jsonb'].includes(column.udt_name)) return 'Json';
  return 'unknown';
}

const tables = new Map();
for (const column of schema.tables) {
  const columns = tables.get(column.table_name) ?? [];
  columns.push(column);
  tables.set(column.table_name, columns);
}

let output = '/* Generated from live self-hosted PostgreSQL schema buzzerhood. Do not edit manually. */\n\n';
output += 'export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];\n\n';
output += 'export type Database = {\n  buzzerhood: {\n    Tables: {\n';
for (const [tableName, columns] of tables) {
  output += `      ${JSON.stringify(tableName)}: {\n        Row: {\n`;
  for (const column of columns) output += `          ${column.column_name}: ${valueType(column)}${column.is_nullable === 'YES' ? ' | null' : ''};\n`;
  output += '        };\n        Insert: {\n';
  for (const column of columns) {
    const optional = column.is_nullable === 'YES' || column.column_default !== null;
    output += `          ${column.column_name}${optional ? '?' : ''}: ${valueType(column)}${column.is_nullable === 'YES' ? ' | null' : ''};\n`;
  }
  output += '        };\n        Update: {\n';
  for (const column of columns) output += `          ${column.column_name}?: ${valueType(column)}${column.is_nullable === 'YES' ? ' | null' : ''};\n`;
  output += '        };\n        Relationships: [];\n      };\n';
}
output += '    };\n    Views: Record<string, never>;\n    Functions: Record<string, never>;\n    Enums: {\n';
for (const [enumName, labels] of Object.entries(schema.enums)) output += `      ${enumName}: ${labels.map((label) => JSON.stringify(label)).join(' | ')};\n`;
output += '    };\n    CompositeTypes: Record<string, never>;\n  };\n};\n';
fs.writeFileSync(outputPath, output);
