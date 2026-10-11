import { readFileSync, existsSync } from 'node:fs';

const htmlPath = 'public/institution-login.html';
const html = readFileSync(htmlPath, 'utf8');
const requiredLocalAssets = [
  'public/assets/fontawesome/css/all.min.css',
  'public/assets/css/institution-login-fonts.css',
  'public/assets/css/institution-login.css',
];
const remoteAssetPattern = /(?:src|href)\\s*=\\s*["']https?:\\/\\//i;
if (remoteAssetPattern.test(html)) {
  throw new Error('Institution login still references a remote script or stylesheet.');
}
for (const path of requiredLocalAssets) {
  if (!existsSync(path)) throw new Error('Missing locally bundled login asset: ' + path);
}
const tailwind = readFileSync('public/assets/css/institution-login.css', 'utf8');
for (const token of ['.bg-gradient-to-br', '.glass-card', '.rounded-3xl', '.font-sans']) {
  if (!tailwind.includes(token)) throw new Error('Generated login CSS is missing expected styling: ' + token);
}
console.log('Offline login asset checks passed.');
