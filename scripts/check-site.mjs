import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const excluded = new Set(['posts/layout.html', 'posts/post-template.html', 'static/social-card.html']);
const errors = [];

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

for (const file of walk(root).filter((candidate) => candidate.endsWith('.html'))) {
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
