import Ajv from 'ajv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ajv = new Ajv({ strict: false });

const tests = [
  {
    schema: 'schemas/foreshadowing.schema.json',
    template: 'templates/foreshadowing.template.json',
    name: 'Foreshadowing'
  },
  {
    schema: 'schemas/hooks.schema.json',
    template: 'templates/hook.template.json',
    name: 'Hooks'
  },
  {
    schema: 'schemas/character.schema.json',
    template: 'templates/character.template.json',
    name: 'Character'
  },
  {
    schema: 'schemas/chapter.schema.json',
    template: 'templates/chapter.template.json',
    name: 'Chapter'
  }
];

let allPassed = true;

for (const test of tests) {
  const schemaPath = join(__dirname, test.schema);
  const templatePath = join(__dirname, test.template);

  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
  const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

  const validate = ajv.compile(schema);
  const valid = validate(template);

  if (valid) {
    console.log(`✓ ${test.name} template is valid`);
  } else {
    console.log(`✗ ${test.name} template validation FAILED:`);
    console.log(JSON.stringify(validate.errors, null, 2));
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\n✓ All templates validated successfully');
  process.exit(0);
} else {
  console.log('\n✗ Some templates failed validation');
  process.exit(1);
}
