'use strict';
// Parte do painel LEGO Dimensions Toy Pad para PS4, criado por RafaZin77.
// Importa uma pasta de imagens nomeadas pelo NOME da figura e copia para portraits/ já com o ID no nome.
//   node tools/import-photos.js <pasta-com-imagens> [--dry]
// Aceita .png .jpg .jpeg .webp .gif (inclusive em subpastas). Não apaga nada e não sobrescreve fotos existentes.
const fs = require('fs');
const path = require('path');
const tags = require('../lib/tags');

const norm = (s) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
const slug = (s) => s.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Nomes de arquivo com grafia diferente da do catálogo (nome normalizado do arquivo -> ID).
const ALIASES = {
  cloudcukkocar: 1090, delorean: 1012, ecto12: 1197, flyingfirebike: 1076, flyingtimetrain: 1100,
  flyingturretcarrier: 1086, g61555spyhunter: 1161, gadetomatic: 1204, homercraft: 1046, imfsportcar: 1215,
  jakemoblie: 1176, mysterytow: 1067, stealthlasershooter: 1094, submahomer: 1047, thedestroydozer: 1034,
  theinterdiver: 1162, thepainplane: 1187, travelingtimetrain: 1099,
};

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const src = args.find((a) => !a.startsWith('--'));
if (!src || !fs.existsSync(src)) { console.error('Uso: node tools/import-photos.js <pasta-com-imagens> [--dry]'); process.exit(2); }

const catalog = tags.loadCatalog().filter((f) => !/^unknown$/i.test(f.name) && !/unreleased/i.test(f.name));
const byName = new Map();
for (const f of catalog) byName.set(norm(f.name), [...(byName.get(norm(f.name)) || []), f]);
const byId = new Map(catalog.map((f) => [`${f.kind}${f.id}`, f]));

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
function match(file) {
  const base = path.basename(file, path.extname(file));
  const n = norm(base);
  if (byName.get(n) && byName.get(n).length === 1) return byName.get(n)[0];
  if (ALIASES[n]) return byId.get(`vehicle${ALIASES[n]}`) || null;
  const starts = catalog.filter((f) => norm(f.name).startsWith(n) && n.length >= 3);   // "Bart" -> "Bart Simpson"
  return starts.length === 1 ? starts[0] : null;
}

const out = path.join(__dirname, '..', 'portraits');
fs.mkdirSync(out, { recursive: true });
const done = new Set(); const skipped = []; const unmatched = []; let copied = 0;
for (const file of walk(src)) {
  const ext = path.extname(file).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) continue;
  const f = match(file);
  if (!f) { unmatched.push(path.basename(file)); continue; }
  const dest = path.join(out, `${f.kind === 'vehicle' ? 'v' : ''}${f.id}-${slug(f.name)}${ext === '.jpeg' ? '.jpg' : ext}`);
  done.add(`${f.kind}${f.id}`);
  if (fs.existsSync(dest)) { skipped.push(path.basename(dest)); continue; }
  if (!dry) fs.copyFileSync(file, dest);
  copied++;
}
// Falta de foto = nada em portraits/ para aquele ID (conta também o que já estava lá).
const have = new Set();
for (const name of fs.readdirSync(out)) {
  const m = /^(v?)(\d+)(?:[-_ ].*)?\.(png|jpe?g|webp|gif)$/i.exec(name);
  if (m) have.add(`${m[1] || Number(m[2]) >= 1000 ? 'vehicle' : 'character'}${Number(m[2])}`);
}
const missing = catalog.filter((f) => !have.has(`${f.kind}${f.id}`) && !done.has(`${f.kind}${f.id}`));
console.log(`${dry ? '[simulação] ' : ''}${copied} imagens ${dry ? 'seriam copiadas' : 'copiadas'} para portraits/` + (skipped.length ? `, ${skipped.length} já existiam` : ''));
if (unmatched.length) console.log(`Sem correspondência no catálogo (${unmatched.length}): ${unmatched.join(', ')}`);
console.log(`Figuras do catálogo ainda sem foto (considerando tudo em portraits/): ${missing.length}` + (missing.length && missing.length <= 25 ? ` (${missing.map((f) => f.name).join(', ')})` : ''));
