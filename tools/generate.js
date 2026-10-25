'use strict';
// Parte do painel LEGO Dimensions Toy Pad para PS4, criado por RafaZin77.
// Gera dumps .bin de todas as figuras. Uso:
//   node tools/generate.js            -> preenche library/ (usado pelo painel)
//   node tools/generate.js --pasta X  -> cria X/Characters e X/Vehicles com nomes legíveis
//                                        (mesma estrutura que o app Lego-Patcher importa)
const fs = require('fs');
const path = require('path');
const tags = require('../lib/tags');

const i = process.argv.indexOf('--pasta');
const out = i > 0 ? path.resolve(process.argv[i + 1] || 'dimensions') : null;
const cat = tags.loadCatalog();
const safe = (n) => n.replace(/[\\/:*?"<>|]/g, '').trim();

if (out) {
  for (const sub of ['Characters', 'Vehicles']) fs.mkdirSync(path.join(out, sub), { recursive: true });
  for (const f of cat) {
    const dir = f.kind === 'character' ? 'Characters' : 'Vehicles';
    fs.writeFileSync(path.join(out, dir, `${safe(f.name)}${f.kind === 'vehicle' ? ` (${f.id})` : ''}.bin`), tags.makeFor(f));
  }
  console.log(`${cat.length} dumps gerados em ${out}`);
} else {
  const lib = path.join(__dirname, '..', 'library');
  fs.mkdirSync(lib, { recursive: true });
  let n = 0;
  for (const f of cat) {
    const p = path.join(lib, `${f.kind === 'character' ? 'c' : 'v'}${f.id}.bin`);
    if (!fs.existsSync(p)) { fs.writeFileSync(p, tags.makeFor(f)); n++; }
  }
  console.log(`${n} novos dumps em library/ (${cat.length} figuras no total)`);
}
