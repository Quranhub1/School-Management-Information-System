import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync('public/institution-login.html', 'utf8');
const requiredLocalAssets = [
  'public/assets/fontawesome/css/all.min.css',
  'public/assets/css/institution-login-fonts.css',
  'public/assets/css/institution-login.css',
  'public/assets/fonts/inter-latin-variable.woff2',
  'public/assets/fonts/plus-jakarta-sans-latin-variable.woff2',
];
if (/https?:\/\//i.test(html)) {
  throw new Error('Institution login still contains a remote URL dependency.');
}
for (const path of requiredLocalAssets) {
  if (!existsSync(path)) throw new Error('Missing locally bundled login asset: ' + path);
}
const loginFonts = readFileSync('public/assets/css/institution-login-fonts.css', 'utf8');
if (/fonts\.googleapis\.com|fonts\.gstatic\.com|https?:\/\//i.test(loginFonts)) {
  throw new Error('Login font stylesheet contains a remote font dependency.');
}
for (const token of ['Inter Variable', 'Plus Jakarta Sans Variable', 'inter-latin-variable.woff2', 'plus-jakarta-sans-latin-variable.woff2']) {
  if (!loginFonts.includes(token)) throw new Error('Login font stylesheet is missing: ' + token);
}
const tailwind = readFileSync('public/assets/css/institution-login.css', 'utf8');
for (const token of ['.bg-gradient-to-br', '.rounded-3xl', '.font-sans']) {
  if (!tailwind.includes(token)) throw new Error('Generated login CSS is missing expected styling: ' + token);
}
console.log('Offline login assets and bundled font checks passed.');
