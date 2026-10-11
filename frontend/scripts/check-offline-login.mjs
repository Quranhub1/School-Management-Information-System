import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync('public/institution-login.html', 'utf8');
const requiredLocalAssets = [
  'public/assets/fontawesome/css/all.min.css',
  'public/assets/css/institution-login-fonts.css',
  'public/assets/css/institution-login.css',
];
if (html.includes('https://') || html.includes('http://')) {
  throw new Error('Institution login still contains a remote URL dependency.');
}
for (const path of requiredLocalAssets) {
  if (!existsSync(path)) throw new Error('Missing locally bundled login asset: ' + path);
}
const tailwind = readFileSync('public/assets/css/institution-login.css', 'utf8');
for (const token of ['.bg-gradient-to-br', '.rounded-3xl', '.font-sans']) {
  if (!tailwind.includes(token)) throw new Error('Generated login CSS is missing expected styling: ' + token);
}
console.log('Offline login asset checks passed.');
