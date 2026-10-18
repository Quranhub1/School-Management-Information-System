import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const assets = [
  {
    source: 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
    target: 'public/assets/fonts/inter-latin-variable.woff2',
  },
  {
    source: 'node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2',
    target: 'public/assets/fonts/plus-jakarta-sans-latin-variable.woff2',
  },
];

for (const asset of assets) {
  const source = resolve(asset.source);
  const target = resolve(asset.target);
  if (!existsSync(source)) {
    throw new Error(`Required local font file not found: ${source}`);
  }
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  console.log(`Bundled local font: ${asset.target}`);
}
