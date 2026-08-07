import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const excluded = new Set(['posts/layout.html', 'posts/post-template.html', 'static/social-card.html']);
const errors = [];
const publicTextExtensions = new Set(['.html', '.md', '.json', '.yaml', '.yml', '.xml', '.txt']);
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const contactLinkPattern = /\b(?:mailto|tel):/i;
const labelledPrivateDataPattern = /\b(?:phone|telephone|mobile(?: number)?|home address|postal address|postcode|passport(?: number)?|national insurance(?: number)?|cpf|ssn|date of birth|dob)\s*[:=]/i;
const postalAddressPattern = /\b\d{1,5}\s+[A-ZÀ-Þ][A-ZÀ-ÿ' .-]{2,40}\s(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Way|Close|Court|Ct|Square|Place|Rua|Avenida|Alameda|Travessa|Utca|Út|Tér|Köz)\b/;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git' || entry.name === '.vscode') return [];
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function localTarget(fromFile, reference) {
  const clean = reference.split('#')[0].split('?')[0];
  if (!clean || /^(?:https?:|mailto:|tel:|data:|javascript:)/.test(clean)) return null;
  const target = clean.startsWith('/')
    ? path.join(root, clean.slice(1))
    : path.resolve(path.dirname(fromFile), clean);
  return clean.endsWith('/') ? path.join(target, 'index.html') : target;
}

const files = walk(root);

for (const file of files.filter((candidate) => publicTextExtensions.has(path.extname(candidate).toLowerCase()))) {
  const relative = path.relative(root, file);
  const content = fs.readFileSync(file, 'utf8');
  if (emailPattern.test(content)) errors.push(`${relative}: public email address detected`);
  if (contactLinkPattern.test(content)) errors.push(`${relative}: direct email or telephone link detected`);
  if (labelledPrivateDataPattern.test(content)) errors.push(`${relative}: labelled private contact or identity data detected`);
  if (postalAddressPattern.test(content)) errors.push(`${relative}: possible postal address detected`);
}

for (const file of files.filter((candidate) => candidate.endsWith('.html'))) {
  const relative = path.relative(root, file);
  if (excluded.has(relative)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const titleCount = (html.match(/<title(?:\s[^>]*)?>/gi) || []).length;
  const h1Count = (html.match(/<h1(?:\s[^>]*)?>/gi) || []).length;
  if (titleCount !== 1) errors.push(`${relative}: expected one title, found ${titleCount}`);
  if (h1Count !== 1) errors.push(`${relative}: expected one h1, found ${h1Count}`);

  for (const match of html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)) {
    try { JSON.parse(match[1]); }
    catch (error) { errors.push(`${relative}: invalid JSON-LD (${error.message})`); }
  }

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = localTarget(file, match[1]);
    if (target && !fs.existsSync(target)) errors.push(`${relative}: missing ${match[1]}`);
  }
}

const cssFile = path.join(root, 'static/css/ai-lead.css');
const css = fs.readFileSync(cssFile, 'utf8');
for (const match of css.matchAll(/url\("([^"#]+)"\)/g)) {
  const target = path.resolve(path.dirname(cssFile), match[1]);
  if (!fs.existsSync(target)) errors.push(`static/css/ai-lead.css: missing ${match[1]}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Site checks passed.');
