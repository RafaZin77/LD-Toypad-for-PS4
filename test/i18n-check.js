'use strict';
// Parte do painel LEGO Dimensions Toy Pad para PS4, criado por RafaZin77.
// Confere se as traduções estão completas e coerentes (nada depende de abrir o navegador).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const root = path.join(__dirname, '..');

const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'public', 'i18n.js'), 'utf8'), ctx);
const I = ctx.window.I18N; const LANGS = ['pt', 'en', 'es'];
let n = 0; const ok = (m) => console.log(`  ok ${++n}. ${m}`);
const vars = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

// 1) mesmas chaves nos três idiomas, nenhuma vazia
const base = Object.keys(I.pt);
for (const l of LANGS) {
  const k = Object.keys(I[l]);
  assert.deepEqual(k.filter((x) => !base.includes(x)), [], `${l}: chaves a mais`);
  assert.deepEqual(base.filter((x) => !k.includes(x)), [], `${l}: chaves faltando`);
  for (const key of k) assert(String(I[l][key]).trim().length > 0, `${l}.${key} vazio`);
}
ok(`dicionário do painel: ${base.length} chaves, idênticas e preenchidas em pt, en e es`);

// 2) os {marcadores} são os mesmos em cada idioma
for (const key of base) for (const l of ['en', 'es']) assert.equal(vars(I[l][key]), vars(I.pt[key]), `${l}.${key}: marcadores diferentes (${vars(I[l][key])} x ${vars(I.pt[key])})`);
ok('marcadores {n}, {name}, {s}… iguais nos três idiomas');

// 3) toda chave usada no HTML/JS existe, e toda chave do dicionário é usada
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const used = new Set();
for (const m of html.matchAll(/data-i18n(?:-ph|-aria)?="([\w]+)"/g)) used.add(m[1]);
const js = html.slice(html.indexOf('<script>\nconst $='));
for (const m of js.matchAll(/'([a-z][a-z0-9]*(?:_[a-z0-9]+)+)'/g)) used.add(m[1]);
for (const m of js.matchAll(/\bt\('([a-z0-9_]+)'/g)) used.add(m[1]);
for (const m of js.matchAll(/\btn\('([a-z_]+)'/g)) { used.add(m[1] + '_one'); used.add(m[1] + '_other'); }
const missing = [...used].filter((k) => !base.includes(k) && /^(tab|status|err|init|btn|trash|search|world|ability|chip|slot|kind|tag|sel|fav|toast|star|handle|count|unk|clear|empty|cleared|confirm|cfg|pwa|credits|about|look|col|pageink|pageauto|bg|font|scale|photos|photoinfo|p|f|warn|lang)_/.test(k));
assert.deepEqual(missing, [], 'chaves usadas e inexistentes: ' + missing.join(', '));
ok(`todas as ${used.size} referências de tradução no código existem no dicionário`);
const unusedKeys = base.filter((k) => !used.has(k) && !['lang_name'].includes(k));
assert.deepEqual(unusedKeys, [], 'chaves nunca usadas: ' + unusedKeys.join(', '));
ok('nenhuma chave do dicionário ficou sem uso');

// 4) mensagens do servidor
const { M, LANGS: SL } = require('../lib/messages');
for (const [key, v] of Object.entries(M)) for (const l of SL) { assert(v[l] && v[l].trim(), `servidor ${key}.${l} vazio`); assert.equal(vars(v[l]), vars(v.pt), `servidor ${key}.${l}: marcadores`); }
ok(`mensagens do servidor: ${Object.keys(M).length} chaves completas nos três idiomas`);

// 5) habilidades e créditos
const cat = require('../lib/tags').loadCatalog();
const ab = new Set(cat.flatMap((f) => String(f.abilities || '').split(',').map((x) => x.trim()).filter(Boolean)));
for (const f of ['abilities-pt.json', 'abilities-es.json']) {
  const d = JSON.parse(fs.readFileSync(path.join(root, 'catalog', f), 'utf8'));
  assert.deepEqual([...ab].filter((a) => !d[a]), [], `${f}: sem tradução`); assert.deepEqual(Object.keys(d).filter((a) => !ab.has(a)), [], `${f}: sobra`);
}
ok(`habilidades: as ${ab.size} têm tradução em português e em espanhol`);
const cr = JSON.parse(fs.readFileSync(path.join(root, 'credits.json'), 'utf8'));
const chk = (v, w) => { if (v && typeof v === 'object') for (const l of SL) assert(v[l] && v[l].trim(), `credits.json ${w}.${l}`); };
chk(cr.tagline, 'tagline'); chk(cr.legal, 'legal'); cr.credits.forEach((c, i) => { chk(c.role, `credits[${i}].role`); chk(c.name, `credits[${i}].name`); });
ok('credits.json completo nos três idiomas');

console.log(`\n${n} verificações de tradução passaram`);
