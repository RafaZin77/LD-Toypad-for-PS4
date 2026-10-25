'use strict';
// Parte do painel LEGO Dimensions Toy Pad para PS4, criado por RafaZin77.
// Teste de ponta a ponta contra um FTP falso (FTP_ROOT = pasta que representa o PS4).
//   python3 -m pyftpdlib -p 2121 -w -d <FTP_ROOT>   (em outro terminal)
//   FTP_ROOT=<pasta> node test/selftest.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const tags = require('../lib/tags');
const { app, ps4 } = require('../server');

const ROOT = process.env.FTP_ROOT;
if (!ROOT) { console.error('Defina FTP_ROOT'); process.exit(2); }
const srv = app.listen(0);
const base = `http://127.0.0.1:${srv.address().port}/api/`;
const call = async (p, body) => {
  const r = await fetch(base + p, body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json() };
};
const fig = (n) => path.join(ROOT, 'data/toypad_emu', n);
let n = 0; const ok = (m) => console.log(`  ok ${++n}. ${m}`);

(async () => {
  // plugins.ini (lógica pura)
  const a = ps4.addToIni('[CUSA00001]\n/data/GoldHEN/plugins/outro.prx\n', 'CUSA00935');
  assert(a.changed && a.ini.includes('[CUSA00935]\n/data/GoldHEN/plugins/toypad_emu.prx'));
  assert(a.ini.includes('outro.prx'));
  const b = ps4.addToIni('[CUSA00935]\n/data/GoldHEN/plugins/x.prx\n', 'CUSA00935');
  assert(b.ini.indexOf('toypad_emu.prx') > b.ini.indexOf('[CUSA00935]') && b.ini.includes('x.prx'));
  assert(!ps4.addToIni(a.ini, 'CUSA00935').changed);
  ok('plugins.ini: cria seção, preserva outros plugins, é idempotente');

  assert.equal((await call('config', { host: '127.0.0.1', port: 2121, titleId: 'CUSA00935' })).status, 200);
  assert.equal((await call('test', {})).body.ok, true); ok('conexão FTP');

  const bad = await call('config', { host: '127.0.0.1', port: 1 });
  assert.equal((await call('test', {})).status, 500); ok('erro amigável com porta errada:', (await call('test', {})).body.error);
  await call('config', { host: '127.0.0.1', port: 2121 });

  // instalação (usa plugin/toypad_emu.prx local se existir)
  const inst = await call('install', {});
  if (inst.status === 200) {
    assert(fs.existsSync(path.join(ROOT, 'data/GoldHEN/plugins/toypad_emu.prx')));
    const ini = fs.readFileSync(path.join(ROOT, 'data/GoldHEN/plugins.ini'), 'utf8');
    assert(ini.includes('[CUSA00935]') && ini.includes('/data/GoldHEN/plugins/toypad_emu.prx'));
    assert(fs.existsSync(path.join(ROOT, 'data/toypad_emu')));
    ok(`instalação: prx enviado (${inst.body.known ? 'sha256 conhecido' : 'sha desconhecido'}), ini e pasta criados`);
    assert.equal((await call('install', {})).body.iniChanged, false); ok('reinstalar não duplica o ini');
  } else console.log('  -- instalação ignorada:', inst.body.error);

  // figuras
  const figs = (await call('figures')).body;
  const batman = figs.find((f) => f.name === 'Batman' && f.kind === 'character');
  const car = figs.find((f) => f.kind === 'vehicle');
  let r = await call('place', { key: batman.key, slot: 'C' });
  assert.equal(r.status, 200);
  let d = fs.readFileSync(fig('figure1.bin'));
  assert.equal(d.length, 180);
  const p = tags.parseDump(d); assert(p.kind === 'character' && p.id === batman.id);
  ok(`Batman no centro -> figure1.bin com ID ${p.id} decifrável`);

  r = await call('place', { key: car.key });
  assert.equal(r.body.slot, 'L1'); assert(fs.existsSync(fig('figure2.bin')));
  ok(`veículo sem slot escolhido -> primeiro livre (${r.body.slot})`);

  r = await call('place', { key: batman.key, slot: 'R2' });
  assert(!fs.existsSync(fig('figure1.bin')) && fs.existsSync(fig('figure6.bin')));
  ok('mover figura entre espaços remove do antigo e grava no novo');

  // veículo "montado no jogo": altera os upgrades no PS4 e depois remove
  const v = fs.readFileSync(fig('figure2.bin')); v.writeUInt32LE(0x12345678, 0x8c); fs.writeFileSync(fig('figure2.bin'), v);
  r = await call('remove', { slot: 'L1' });
  assert(r.body.synced && !fs.existsSync(fig('figure2.bin')));
  const saved = fs.readFileSync(path.join(__dirname, '..', 'library', `${car.key}.bin`));
  assert.equal(saved.readUInt32LE(0x8c), 0x12345678);
  ok('remover veículo guarda a versão montada na biblioteca');
  await call('place', { key: car.key, slot: 'L1' });
  assert.equal(fs.readFileSync(fig('figure2.bin')).readUInt32LE(0x8c), 0x12345678);
  ok('ao recolocar, o veículo volta já montado');

  // mover e trocar
  await call('clear', {});
  const gandalf = figs.find((f) => f.name === 'Gandalf' && f.kind === 'character');
  await call('place', { key: batman.key, slot: 'C' });
  await call('place', { key: gandalf.key, slot: 'L1' });
  r = await call('move', { from: 'C', to: 'R1' });
  assert(r.status === 200 && !r.body.swapped && !fs.existsSync(fig('figure1.bin')) && fs.existsSync(fig('figure5.bin')));
  ok('mover para espaço vazio');
  const antes5 = fs.readFileSync(fig('figure5.bin')), antes2 = fs.readFileSync(fig('figure2.bin'));
  r = await call('move', { from: 'R1', to: 'L1' });
  assert(r.body.swapped && fs.readFileSync(fig('figure2.bin')).equals(antes5) && fs.readFileSync(fig('figure5.bin')).equals(antes2));
  assert.equal(r.body.slots.L1.name, 'Batman'); assert.equal(r.body.slots.R1.name, 'Gandalf');
  ok('mover para espaço ocupado troca as duas figuras');
  assert.equal((await call('move', { from: 'C', to: 'R2' })).status, 500);
  assert.equal((await call('move', { from: 'X', to: 'R2' })).status, 500);
  ok('mover de espaço vazio ou inválido dá erro claro');

  // ---- fotos ----
  const withPic = (await call('figures')).body.filter((f) => f.portrait);
  const batPic = figs.find((f) => f.key === batman.key);
  const fresh = (await call('figures')).body;
  assert(fresh.find((f) => f.key === batman.key).portrait.startsWith('/portraits/1-Batman'));
  const chars = withPic.filter((f) => f.kind === 'character'), vehs = withPic.filter((f) => f.kind === 'vehicle');
  assert(chars.length >= 75 && vehs.length >= 240);
  const img = await fetch(base.replace('/api/', '') + fresh.find((f) => f.key === batman.key).portrait);
  assert.equal(img.status, 200); assert.equal(img.headers.get('content-type'), 'image/png');
  ok(`fotos: ${chars.length} personagens e ${vehs.length} veículos/gadgets com foto, imagem servida como PNG`);
  const dl = fresh.find((f) => f.id === 1012 && f.kind === 'vehicle');
  assert(dl.portrait.startsWith('/portraits/v1012-DeLorean')); ok('veículo encontra a foto pelo ID (v1012 = DeLorean)');
  assert(fresh.filter((f) => f.kind === 'vehicle' && !f.portrait && !/^Unknown$/.test(f.name)).length === 0); ok('todo veículo com nome conhecido tem foto (só os "Unknown" ficam sem)');

  // ---- tema ----
  const get = async (p) => (await fetch(base + p)).json();
  const post = async (p, body, headers) => {
    const r = await fetch(base + p, { method: 'POST', headers: headers || { 'content-type': 'application/json' }, body: typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body) });
    return { status: r.status, body: await r.json() };
  };
  await post('theme/clear', { kind: 'all' });
  let th = await get('theme');
  assert(th.preset === 'auto' && th.bg.type === 'studs' && th.font === 'padrao' && th.scale === 100 && th.photos === true);
  ok('tema padrão');

  r = await post('theme', { preset: 'noite', colors: { base: '#101820', accent: '#FFAA00' }, font: 'mono', scale: 120, photos: false, bg: { type: 'gradient', color2: '#223344', dim: 40 } });
  assert(r.status === 200 && r.body.colors.base === '#101820' && r.body.colors.accent === '#ffaa00');
  assert(r.body.font === 'mono' && r.body.scale === 120 && r.body.photos === false && r.body.bg.type === 'gradient');
  th = await get('theme'); assert.equal(th.colors.accent, '#ffaa00');
  assert(fs.existsSync(path.join(__dirname, '..', 'data', 'theme.json')));
  ok('salvar tema e ler de volta (cores em minúsculas, persistido em data/theme.json)');

  r = await post('theme', { colors: { base: 'red; } body{display:none' , ink: 'url(x)', paper: '#12345' }, font: 'Comic; evil', scale: 99999, bg: { type: 'javascript:x', color2: '#zzzzzz', dim: -50 }, preset: '<script>' });
  assert.equal(r.body.colors.base, '#101820'); assert.equal(r.body.colors.ink, '#16191d'); assert.equal(r.body.colors.paper, '#fbfbf9');
  assert.equal(r.body.font, 'mono'); assert.equal(r.body.scale, 140); assert.equal(r.body.bg.type, 'gradient'); assert.equal(r.body.bg.dim, 0); assert.equal(r.body.preset, 'noite');
  ok('valores maliciosos ou inválidos são rejeitados; números ficam dentro dos limites');

  // cor do texto sobre o fundo, fundo "arte do jogo" e tema novo
  r = await post('theme', { colors: { pageInk: '#FFEE00' }, bg: { type: 'splash' }, preset: 'dimensions' });
  assert(r.body.colors.pageInk === '#ffee00' && r.body.bg.type === 'splash' && r.body.preset === 'dimensions');
  r = await post('theme', { colors: { pageInk: 'red;}' } }); assert.equal(r.body.colors.pageInk, '#ffee00');
  r = await post('theme', { colors: { pageInk: null } }); assert.equal(r.body.colors.pageInk, null);
  assert.equal((await get('theme')).bg.type, 'splash');
  const splashRes = await fetch(base.replace('/api/', '') + '/assets/splash.jpg');
  assert.equal(splashRes.status, 200); assert.equal(splashRes.headers.get('content-type'), 'image/jpeg');
  ok('texto sobre o fundo (cor, inválido recusado, null = automático), fundo "arte do jogo" e arquivo da arte servido');
  await post('theme', { bg: { type: 'studs' }, preset: 'auto' });

  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63fcffff3f0300050001a5f645400000000049454e44ae426082', 'hex');
  const bin = { 'content-type': 'application/octet-stream' };
  r = await post('theme/upload?kind=background', png, bin);
  assert(r.status === 200 && r.body.bg.image === 'background.png' && r.body.bg.type === 'image' && r.body.rev > 0);
  const served = await fetch(base.replace('/api/', '') + '/theme-files/background.png');
  assert.equal(served.status, 200); assert.equal(served.headers.get('x-content-type-options'), 'nosniff');
  ok('enviar imagem de fundo (PNG) e servi-la');

  r = await post('theme/upload?kind=background', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), bin);
  assert.equal(r.status, 500); assert(/PNG, JPG/.test(r.body.error));
  r = await post('theme/upload?kind=background', Buffer.from('MZ\x90\x00 executavel falso com extensao .png'), bin);
  assert.equal(r.status, 500);
  r = await post('theme/upload?kind=font', png, bin);
  assert.equal(r.status, 500); assert(/woff2/.test(r.body.error));
  r = await post('theme/upload?kind=../../etc/passwd', png, bin); assert.equal(r.status, 500);
  ok('SVG, executável disfarçado, imagem enviada como fonte e tipo com caminho são recusados');

  r = await post('theme/upload?kind=background', Buffer.alloc(11 * 1024 * 1024, 1), bin);
  assert.equal(r.status, 413); assert(/10 MB/.test(r.body.error));
  ok('arquivo acima de 10 MB é recusado com mensagem clara');

  const woff2 = Buffer.concat([Buffer.from('774f4632', 'hex'), Buffer.alloc(64, 0)]);
  r = await post('theme/upload?kind=font', woff2, bin);
  assert(r.status === 200 && r.body.fontFile === 'font.woff2' && r.body.font === 'arquivo');
  ok('enviar arquivo de fonte (woff2)');

  r = await post('theme/clear', { kind: 'background' });
  assert(r.body.bg.image === null && r.body.bg.type === 'studs' && !fs.existsSync(path.join(__dirname, '..', 'data', 'theme', 'background.png')));
  r = await post('theme/clear', { kind: 'font' }); assert(r.body.fontFile === null && r.body.font === 'padrao');
  ok('remover fundo e fonte enviados volta ao padrão e apaga os arquivos');

  r = await post('theme/clear', { kind: 'all' });
  assert(r.body.preset === 'auto' && r.body.scale === 100 && r.body.photos === true); ok('restaurar tudo');

  // ---- cor do texto sobre o fundo, arte do jogo, créditos ----
  r = await post('theme', { colors: { pageInk: '#FFEE00' }, bg: { type: 'splash', dim: 35 }, preset: 'dimensions' });
  assert(r.body.colors.pageInk === '#ffee00' && r.body.bg.type === 'splash' && r.body.preset === 'dimensions' && r.body.bg.dim === 35);
  r = await post('theme', { colors: { pageInk: 'red;}' } }); assert.equal(r.body.colors.pageInk, '#ffee00');
  r = await post('theme', { colors: { pageInk: null } }); assert.equal(r.body.colors.pageInk, null);
  ok('cor do texto sobre o fundo: salva, rejeita valor inválido e volta ao automático (null); fundo "splash" e tema "dimensions" aceitos');
  await post('theme/clear', { kind: 'all' });
  const about = await get('about');
  assert.equal(about.author, 'RafaZin77'); assert(/^\d+\.\d+\.\d+$/.test(about.version)); assert(about.credits.some((c) => /RadiantDelux/.test(c.name)));
  ok(`créditos em /api/about (${about.author}, v${about.version}, plugin e catálogo creditados)`);

  // ---- habilidades, favoritos, recentes ----
  const abil = await get('abilities');
  assert(abil.length >= 100 && !abil.some((a) => a.en === 'Unknown') && abil.every((a) => a.pt && a.n > 0));
  assert(abil.filter((a) => a.pt === a.en).length <= 8, 'quase todas devem ter tradução');
  assert.equal(abil.find((a) => a.en === 'Flying').pt, 'Voar'); assert(abil[0].n >= abil[abil.length - 1].n);
  ok(`habilidades: ${abil.length} distintas, todas com tradução, ordenadas por quantidade (a mais comum tem ${abil[0].n} figuras)`);
  const allFigs = await get('figures');
  assert(allFigs.every((f) => Array.isArray(f.ab)));
  assert(allFigs.find((f) => f.name === 'Batman').ab.includes('Grapple'));
  assert(allFigs.filter((f) => f.ab.includes('Flying')).length >= 80);
  ok('cada figura traz a lista de habilidades (Batman tem Grapple; 80+ figuras voam)');

  await post('prefs/clear', { what: 'favs' }); await post('prefs/clear', { what: 'recent' });
  const gKey = gandalf.key;
  r = await post('fav', { key: batman.key, on: true }); r = await post('fav', { key: gKey, on: true });
  assert.deepEqual(r.body.favs, [gKey, batman.key]);
  r = await post('fav', { key: batman.key, on: true }); assert.deepEqual(r.body.favs, [batman.key, gKey]);   // favoritar de novo sobe ao topo, sem duplicar
  const pf = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'prefs.json'), 'utf8')); assert.deepEqual(pf.favs, [batman.key, gKey]);
  assert.deepEqual((await get('state')).prefs.favs, [batman.key, gKey]);
  r = await post('fav', { key: batman.key, on: false }); assert.deepEqual(r.body.favs, [gKey]);
  assert.equal((await post('fav', { key: 'c99999', on: true })).status, 500); assert.equal((await post('fav', { key: '../x', on: true })).status, 500);
  ok('favoritos: adicionar, reordenar sem duplicar, remover, persistir em data/prefs.json e vir no /api/state; chave inválida recusada');

  await call('clear', {});
  const many = allFigs.filter((f) => f.kind === 'character').slice(0, 22);
  for (const f of many) { r = await call('place', { key: f.key, slot: 'C' }); assert.equal(r.status, 200); }
  const rec = (await get('state')).prefs.recent;
  assert.equal(rec.length, 20); assert.equal(rec[0], many[21].key); assert.equal(rec[19], many[2].key); assert(!rec.includes(many[0].key));
  ok('recentes: ordem do mais novo ao mais antigo, limite de 20 (as 2 mais antigas saem)');
  await call('place', { key: many[5].key, slot: 'L1' });
  assert.equal((await get('state')).prefs.recent[0], many[5].key); assert.equal((await get('state')).prefs.recent.filter((k) => k === many[5].key).length, 1);
  ok('recolocar uma figura a leva ao topo dos recentes, sem repetir');
  r = await post('prefs/clear', { what: 'recent' }); assert.deepEqual(r.body.recent, []); assert.deepEqual(r.body.favs, [gKey]);
  assert.equal((await post('prefs/clear', { what: 'tudo' })).status, 500);
  await post('prefs/clear', { what: 'favs' }); await call('clear', {});
  ok('limpar recentes não mexe nas favoritas; tipo inválido é recusado');

  // ---- ocultar Unknown ----
  const unkFigs = allFigs.filter((f) => /^unknown$/i.test(f.name));
  assert.equal(unkFigs.length, 28); assert(unkFigs.every((f) => f.world === 'Unknown'));
  assert.equal(unkFigs.filter((f) => f.kind === 'character').length, 2); assert.equal(unkFigs.filter((f) => f.kind === 'vehicle').length, 26);
  assert.equal((await get('state')).prefs.hideUnknown, false);
  r = await post('prefs/set', { hideUnknown: true }); assert.equal(r.body.hideUnknown, true);
  assert.equal(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'prefs.json'), 'utf8')).hideUnknown, true);
  assert.equal((await get('state')).prefs.hideUnknown, true);
  r = await post('fav', { key: batman.key, on: true }); assert.equal(r.body.hideUnknown, true);          // outras ações preservam a escolha
  r = await post('prefs/clear', { what: 'favs' }); assert.equal(r.body.hideUnknown, true);
  for (const bad of ['sim', 1, null, {}, 'true']) assert.equal((await post('prefs/set', { hideUnknown: bad })).status, 500);
  assert.equal((await post('prefs/set', {})).status, 500);
  r = await post('prefs/set', { hideUnknown: false }); assert.equal(r.body.hideUnknown, false);
  ok('ocultar Unknown: 28 figuras (2 personagens + 26 veículos), escolha salva em data/prefs.json, preservada por outras ações e valores inválidos recusados');

  const root0 = base.replace('/api/', '');
  // ---- idiomas (pt-BR, inglês, espanhol) ----
  const J = (lang, extra) => ({ 'content-type': 'application/json', ...(lang ? { 'x-lang': lang } : {}), ...(extra || {}) });
  const errOf = async (lang, extra) => (await post('fav', { key: 'c99999', on: true }, J(lang, extra))).body.error;
  assert.equal(await errOf(null), 'Figura desconhecida.');                       // sem cabeçalho: português
  assert.equal(await errOf('pt'), 'Figura desconhecida.'); assert.equal(await errOf('en'), 'Unknown figure.'); assert.equal(await errOf('es'), 'Figura desconocida.');
  assert.equal(await errOf(null, { 'accept-language': 'es-ES,es;q=0.9,en;q=0.5' }), 'Figura desconocida.');
  assert.equal(await errOf(null, { 'accept-language': 'en-US,en;q=0.9' }), 'Unknown figure.');
  assert.equal(await errOf(null, { 'accept-language': 'fr-FR,fr;q=0.9' }), 'Figura desconhecida.');   // idioma não suportado: português
  assert.equal(await errOf('en', { 'accept-language': 'es' }), 'Unknown figure.');                      // X-Lang vence o Accept-Language
  assert.equal(await errOf('xx', { 'accept-language': 'es' }), 'Figura desconocida.'); assert.equal(await errOf('<script>'), 'Figura desconhecida.');
  ok('idioma do servidor: X-Lang, depois Accept-Language, depois português; valores inválidos ou de outros idiomas caem no português');

  const saveHost = await get('state'); const cfgBack = { host: saveHost.config.host, port: saveHost.config.port, titleId: saveHost.config.titleId };
  await post('config', { host: '', port: 2121 });
  for (const [l, re] of [['pt', /aba Configuração/], ['en', /Settings tab/], ['es', /pestaña Configuración/]]) { r = await post('test', {}, J(l)); assert(r.status === 500 && re.test(r.body.error), `${l}: ${r.body.error}`); }
  await post('config', { host: '127.0.0.1', port: 1 });
  for (const [l, re] of [['pt', /recusou a conexão/], ['en', /refused the connection/], ['es', /rechazó la conexión/]]) { r = await post('test', {}, J(l)); assert(re.test(r.body.error), `${l}: ${r.body.error}`); }
  await post('config', { ...cfgBack, titleId: 'XXX' });
  for (const [l, re] of [['pt', /Title ID inválido/], ['en', /Invalid Title ID/], ['es', /Title ID no válido/]]) { r = await post('install', {}, J(l)); assert(re.test(r.body.error), `${l}: ${r.body.error}`); }
  await post('config', cfgBack);
  ok('erros de conexão, de configuração e de Title ID saem no idioma pedido');

  for (const [l, re] of [['pt', /PNG, JPG/], ['en', /Use a PNG, JPG/], ['es', /Usa una imagen/]]) { r = await post('theme/upload?kind=background', Buffer.from('nao e imagem'), { 'content-type': 'application/octet-stream', 'x-lang': l }); assert(re.test(r.body.error), `${l}: ${r.body.error}`); }
  for (const [l, re] of [['pt', /Arquivo grande demais/], ['en', /File too large/], ['es', /demasiado grande/]]) { r = await post('theme/upload?kind=background', Buffer.alloc(11 * 1024 * 1024, 1), { 'content-type': 'application/octet-stream', 'x-lang': l }); assert(r.status === 413 && re.test(r.body.error), `${l}: ${r.body.error}`); }
  ok('erros de envio de imagem e de arquivo grande (413) nos três idiomas');

  const abl = await get('abilities'); const fl = abl.find((a) => a.en === 'Flying');
  assert.deepEqual([fl.en, fl.pt, fl.es], ['Flying', 'Voar', 'Volar']); assert(abl.every((a) => a.pt && a.es && a.en));
  ok('habilidades chegam com inglês, português e espanhol (Flying = Voar = Volar)');
  const ab3 = {};
  for (const l of ['pt', 'en', 'es']) ab3[l] = await (await fetch(base + 'about', { headers: { 'x-lang': l } })).json();
  assert.equal(ab3.pt.tagline, 'Painel criado por'); assert.equal(ab3.en.tagline, 'Panel created by'); assert.equal(ab3.es.tagline, 'Panel creado por');
  assert(/PS4 panel/.test(ab3.en.app) && /panel PS4/.test(ab3.es.app) && /painel PS4/.test(ab3.pt.app));
  assert(ab3.en.legal.startsWith('LEGO Dimensions, the photos') && ab3.es.legal.includes('pertenecen'));
  assert.equal(ab3.pt.credits[0].footer, false); assert.equal(ab3.en.credits.filter((c) => c.footer).length, ab3.en.credits.length - 1);
  assert(ab3.es.credits.some((c) => c.name === 'proporcionadas por RafaZin77') && ab3.en.credits.some((c) => c.name === 'provided by RafaZin77'));
  assert(ab3.en.credits.every((c) => typeof c.role === 'string' && typeof c.name === 'string'));
  ok('créditos e nome do app localizados; o autor (RafaZin77) e os créditos de terceiros continuam nos três');
  const swSrc = await (await fetch(root0 + '/sw.js')).text();
  assert(swSrc.includes('Sem conexão com o servidor') && swSrc.includes('No connection to the panel server') && swSrc.includes('Sin conexión con el servidor') && swSrc.includes("get('X-Lang')"));
  ok('service worker tem a mensagem de "servidor desligado" nos três idiomas');
  assert.equal((await fetch(root0 + '/i18n.js')).status, 200); ok('dicionário do painel (i18n.js) servido');

  // ---- app instalável (PWA) ----
  const root = root0;
  const sw = await fetch(root + '/sw.js'); const swTxt = await sw.text();
  assert.equal(sw.status, 200); assert(/javascript/.test(sw.headers.get('content-type'))); assert.equal(sw.headers.get('service-worker-allowed'), '/');
  assert(/no-cache/.test(sw.headers.get('cache-control')));
  const ver = require('../package.json').version; assert(swTxt.includes(`'${ver}'`) && !swTxt.includes('__VERSION__'));
  assert(swTxt.includes("startsWith('/api/')") && !/cache\.put\(req.*api/.test(swTxt));
  ok(`service worker servido com a versão ${ver} no nome do cache, sem cache e com escopo "/" (a API não é guardada)`);
  const man = await fetch(root + '/manifest.webmanifest'); const mj = await man.json();
  assert(/manifest\+json|json/.test(man.headers.get('content-type'))); assert.equal(mj.display, 'standalone'); assert.equal(mj.start_url, '/'); assert(mj.name && mj.short_name);
  const sizes = {};
  for (const ic of mj.icons) {
    const rr = await fetch(root + ic.src); const buf = Buffer.from(await rr.arrayBuffer());
    assert.equal(rr.status, 200); assert.equal(buf.subarray(1, 4).toString(), 'PNG');
    assert.equal(`${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`, ic.sizes); sizes[ic.purpose] = (sizes[ic.purpose] || 0) + 1;
  }
  assert(sizes.any >= 2 && sizes.maskable >= 1);
  ok('manifesto válido: standalone, ícones 192/512 e maskable existem e têm o tamanho declarado');
  assert.equal((await fetch(root + '/icons/apple-touch-icon.png')).status, 200); ok('ícone do iPhone (apple-touch-icon) disponível');

  // luzes
  fs.writeFileSync(fig('leds.txt'), 'ff0000 00ff00 0000ff\n');
  r = await call('leds'); assert.deepEqual(r.body.colors, ['#ff0000', '#00ff00', '#0000ff']); ok('leitura de leds.txt');
  fs.writeFileSync(fig('leds.txt'), 'lixo');
  assert.equal((await call('leds')).body.colors, null); ok('leds.txt inválido é ignorado');

  r = await call('clear', {});
  assert(!fs.existsSync(fig('figure6.bin')) && !fs.existsSync(fig('figure2.bin')));
  assert(Object.values(r.body.slots).every((s) => s === null)); ok('esvaziar o pad');

  console.log(`\n${n} verificações passaram`); srv.close(); process.exit(0);
})().catch((e) => { console.error('\nFALHOU:', e.message); srv.close(); process.exit(1); });
