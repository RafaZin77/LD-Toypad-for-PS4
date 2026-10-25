'use strict';
// LEGO Dimensions Toy Pad – painel para PS4 (GoldHEN). Criado por RafaZin77.
const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const tags = require('./lib/tags');
const { AppError, langOf, t: tr, loc } = require('./lib/messages');
const ps4 = require('./lib/ps4');

const ROOT = __dirname;
const LIB = path.join(ROOT, 'library');
const CFG_FILE = path.join(ROOT, 'data', 'config.json');
const STATE_FILE = path.join(ROOT, 'data', 'state.json');
const SLOT_ORDER = ['C', 'L1', 'L2', 'L3', 'R1', 'R2', 'R3'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const THEME_FILE = path.join(ROOT, 'data', 'theme.json');
const THEME_DIR = path.join(ROOT, 'data', 'theme');
const PORTRAITS = path.join(ROOT, 'portraits');
const PRESETS = ['auto', 'baseplate', 'noite', 'tijolo', 'neon', 'amarelo', 'dimensions', 'custom'];
const FONTS = ['padrao', 'sistema', 'arredondada', 'serifada', 'mono', 'impacto', 'manuscrita', 'arquivo'];
const BG_TYPES = ['studs', 'solid', 'gradient', 'image', 'splash'];
const HEX = /^#[0-9a-f]{6}$/i;
const DEFAULT_THEME = {
  preset: 'auto',
  colors: { base: '#e4e7e1', paper: '#fbfbf9', ink: '#16191d', accent: '#0b57b7', pad: '#1f2329', pageInk: null },
  bg: { type: 'studs', color2: '#c9d6e8', image: null, dim: 25 },
  font: 'padrao', fontFile: null, scale: 100, photos: true, rev: 0,
};
const clamp = (n, a, b) => Math.min(b, Math.max(a, Number(n) || 0));

// Aceita só valores conhecidos: o tema vira CSS no navegador, então nada de texto livre.
function sanitizeTheme(inp, cur) {
  const t = JSON.parse(JSON.stringify(cur));
  if (!inp || typeof inp !== 'object') return t;
  if (PRESETS.includes(inp.preset)) t.preset = inp.preset;
  if (inp.colors && typeof inp.colors === 'object') {
    for (const k of Object.keys(DEFAULT_THEME.colors)) if (HEX.test(inp.colors[k])) t.colors[k] = inp.colors[k].toLowerCase();
    if (inp.colors.pageInk === null) t.colors.pageInk = null;   // null = texto sobre o fundo automático
  }
  if (inp.bg && typeof inp.bg === 'object') {
    if (BG_TYPES.includes(inp.bg.type)) t.bg.type = inp.bg.type;
    if (HEX.test(inp.bg.color2)) t.bg.color2 = inp.bg.color2.toLowerCase();
    if (inp.bg.dim !== undefined) t.bg.dim = clamp(inp.bg.dim, 0, 70);
  }
  if (FONTS.includes(inp.font)) t.font = inp.font;
  if (inp.scale !== undefined) t.scale = clamp(inp.scale, 85, 140);
  if (typeof inp.photos === 'boolean') t.photos = inp.photos;
  if (t.bg.type === 'image' && !t.bg.image) t.bg.type = 'studs';
  if (t.font === 'arquivo' && !t.fontFile) t.font = 'padrao';
  return t;
}

// Descobre o tipo real do arquivo pelos primeiros bytes (não confia no nome nem no cabeçalho HTTP).
function sniff(b) {
  const hex = (n) => b.subarray(0, n).toString('hex');
  if (b.length > 12) {
    if (hex(8) === '89504e470d0a1a0a') return { kind: 'image', ext: 'png' };
    if (hex(3) === 'ffd8ff') return { kind: 'image', ext: 'jpg' };
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return { kind: 'image', ext: 'webp' };
    if (b.toString('ascii', 0, 4) === 'GIF8') return { kind: 'image', ext: 'gif' };
    const m4 = b.toString('ascii', 0, 4);
    if (m4 === 'wOF2') return { kind: 'font', ext: 'woff2' };
    if (m4 === 'wOFF') return { kind: 'font', ext: 'woff' };
    if (m4 === 'OTTO') return { kind: 'font', ext: 'otf' };
    if (hex(4) === '00010000' || m4 === 'true') return { kind: 'font', ext: 'ttf' };
  }
  return null;
}

// Fotos: portraits/<id>-qualquer-coisa.png  (personagem)  |  portraits/v<id>-....png  (veículo/gadget)
function scanPortraits() {
  const map = {};
  let files = [];
  try { files = fs.readdirSync(PORTRAITS); } catch (_) { /* pasta ausente */ }
  for (const f of files) {
    const m = /^(v?)(\d+)(?:[-_ ].*)?\.(png|jpe?g|webp|gif)$/i.exec(f);
    if (!m) continue;
    const id = Number(m[2]);
    const key = (m[1] || id >= 1000 ? 'v' : 'c') + id;
    let mt = 0;
    try { mt = Math.round(fs.statSync(path.join(PORTRAITS, f)).mtimeMs); } catch (_) { /* ignora */ }
    map[key] = `/portraits/${encodeURIComponent(f)}?m=${mt}`;
  }
  return map;
}

const readCat = (f) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog', f), 'utf8')); } catch (_) { return {}; } };
const AB_PT = readCat('abilities-pt.json'), AB_ES = readCat('abilities-es.json');
const splitAb = (f) => String(f.abilities || '').split(',').map((x) => x.trim()).filter(Boolean);
const PREFS_FILE = path.join(ROOT, 'data', 'prefs.json');
const RECENT_MAX = 20;

const catalog = tags.loadCatalog();
const keyOf = (f) => `${f.kind === 'character' ? 'c' : 'v'}${f.id}`;
const byKey = new Map(catalog.map((f) => [keyOf(f), f]));

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) { return d; } };
const writeJson = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2));

const pkg = require('./package.json');
const CREDITS = readJson(path.join(ROOT, 'credits.json'), { author: 'RafaZin77', tagline: 'Painel criado por', credits: [], legal: '' });

let config = { host: '', port: 2121, user: '', pass: '', titleId: 'CUSA00935', ...readJson(CFG_FILE, {}) };
let state = { slots: {}, ...readJson(STATE_FILE, {}) };
function sanitizePrefs(p) {
  const uniq = (a) => [...new Set(Array.isArray(a) ? a : [])].filter((k) => byKey.has(k));
  return { favs: uniq(p && p.favs), recent: uniq(p && p.recent).slice(0, RECENT_MAX), hideUnknown: !!(p && p.hideUnknown === true) };
}
let prefs = sanitizePrefs(readJson(PREFS_FILE, {}));
const savePrefs = () => { fs.mkdirSync(path.dirname(PREFS_FILE), { recursive: true }); writeJson(PREFS_FILE, prefs); };
const addRecent = (key) => { prefs.recent = [key, ...prefs.recent.filter((k) => k !== key)].slice(0, RECENT_MAX); savePrefs(); };
let theme = sanitizeTheme(readJson(THEME_FILE, {}), DEFAULT_THEME);
const keepFiles = readJson(THEME_FILE, {});
if (keepFiles.bg && /^background\.(png|jpg|webp|gif)$/.test(keepFiles.bg.image || '')) theme.bg.image = keepFiles.bg.image;
if (/^font\.(woff2|woff|ttf|otf)$/.test(keepFiles.fontFile || '')) theme.fontFile = keepFiles.fontFile;
theme.rev = Number(keepFiles.rev) || 0;
const saveTheme = () => { fs.mkdirSync(path.dirname(THEME_FILE), { recursive: true }); writeJson(THEME_FILE, theme); };
const saveState = () => writeJson(STATE_FILE, state);

// ---- biblioteca de dumps --------------------------------------------------
fs.mkdirSync(LIB, { recursive: true });
const binPath = (fig) => path.join(LIB, `${keyOf(fig)}.bin`);

function getBin(fig) {
  const p = binPath(fig);
  if (fs.existsSync(p)) {
    const b = fs.readFileSync(p);
    if (b.length === tags.TAG_SIZE) return b;
  }
  const b = tags.makeFor(fig);
  fs.writeFileSync(p, b);
  return b;
}

const slotInfo = (slot) => {
  const k = state.slots[slot];
  const f = k && byKey.get(k);
  return f ? { key: k, id: f.id, name: f.name, kind: f.kind } : null;
};
const allSlots = () => Object.fromEntries(SLOT_ORDER.map((s) => [s, slotInfo(s)]));

// Retira uma figura do slot; se for veículo, guarda a versão montada no jogo.
async function takeFromSlot(slot) {
  const fig = byKey.get(state.slots[slot]);
  const wantBytes = fig && fig.kind === 'vehicle';
  const bytes = await ps4.takeFigure(config, slot, wantBytes);
  let synced = false;
  if (bytes && bytes.length === tags.TAG_SIZE) {
    try {
      const p = tags.parseDump(bytes);
      if (p.kind === 'vehicle' && p.id === fig.id) { fs.writeFileSync(binPath(fig), bytes); synced = true; }
    } catch (_) { /* dump inválido: mantém o antigo */ }
  }
  delete state.slots[slot];
  saveState();
  return synced;
}

// ---- app ------------------------------------------------------------------
const app = express();
app.use(express.json());
app.get('/sw.js', (_req, res) => {
  const src = fs.readFileSync(path.join(__dirname, 'lib', 'sw.js'), 'utf8').replace('__VERSION__', pkg.version);
  res.set({ 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache', 'Service-Worker-Allowed': '/' }).send(src);
});
app.use(express.static(path.join(ROOT, 'public')));
app.use('/portraits', express.static(PORTRAITS, { maxAge: '7d' }));
app.use('/assets', express.static(path.join(ROOT, 'assets'), { maxAge: '7d' }));
app.use('/theme-files', (_q, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); next(); },
  express.static(THEME_DIR, { maxAge: '1d' }));

const wrap = (fn) => async (req, res) => {
  try { res.json(await fn(req, res)); }
  catch (e) {
    const status = e.code === 'UNKNOWN_PRX' ? 409 : 500;
    res.status(status).json({ error: friendly(e, langOf(req)), code: e.code, sha: e.sha });
  }
};
function friendly(e, lang) {
  if (e instanceof AppError) return tr(lang, e.key, e.vars);
  const m = String(e && e.message || e);
  if (/ECONNREFUSED/.test(m)) return tr(lang, 'ps4_refused');
  if (/ETIMEDOUT|timeout|EHOSTUNREACH|ENETUNREACH/i.test(m)) return tr(lang, 'ps4_timeout');
  return m;
}

app.get('/api/figures', (_req, res) => {
  const pics = scanPortraits();
  res.json(catalog.map((f) => { const { abilities, ...rest } = f; return { ...rest, key: keyOf(f), portrait: pics[keyOf(f)] || null, ab: splitAb(f) }; }));
});

// Habilidades do catálogo (nomes originais em inglês) com tradução aproximada e quantas figuras têm cada uma.
app.get('/api/abilities', (_req, res) => {
  const n = new Map();
  for (const f of catalog) for (const a of splitAb(f)) n.set(a, (n.get(a) || 0) + 1);
  res.json([...n.entries()].filter(([a]) => a !== 'Unknown')
    .map(([en, count]) => ({ en, pt: AB_PT[en] || en, es: AB_ES[en] || en, n: count }))
    .sort((a, b) => b.n - a.n || a.pt.localeCompare(b.pt, 'pt-BR')));
});

app.get('/api/state', (_req, res) => {
  const { pass, ...pub } = config;
  res.json({ config: { ...pub, hasPass: !!pass }, slots: allSlots(), slotOrder: SLOT_ORDER, theme, prefs });
});

app.post('/api/config', wrap((req) => {
  const b = req.body || {};
  config = {
    ...config,
    host: String(b.host ?? config.host).trim(),
    port: Number(b.port) || 2121,
    user: String(b.user ?? config.user).trim(),
    titleId: String(b.titleId ?? config.titleId).trim().toUpperCase(),
  };
  if (typeof b.pass === 'string' && b.pass !== '') config.pass = b.pass;
  writeJson(CFG_FILE, config);
  return { ok: true };
}));

app.post('/api/test', wrap(async () => ({ ok: await ps4.test(config) })));
app.post('/api/install', wrap(async (req) => ps4.install(config, { allowUnknown: !!(req.body && req.body.allowUnknown) })));

app.post('/api/place', wrap(async (req) => {
  const fig = byKey.get(String(req.body.key));
  if (!fig) throw new AppError('unknown_fig');
  let slot = req.body.slot;
  const current = SLOT_ORDER.find((s) => state.slots[s] === keyOf(fig));
  if (!slot) slot = SLOT_ORDER.find((s) => !state.slots[s]);
  if (!slot) throw new AppError('pad_full');
  if (!ps4.SLOT_FILES[slot]) throw new AppError('bad_slot');
  if (current === slot) return { ok: true, slots: allSlots() };
  let removed = false;
  if (current) { await takeFromSlot(current); removed = true; }
  if (state.slots[slot]) { await takeFromSlot(slot); removed = true; }
  if (removed) await sleep(600); // dá tempo do plugin notar a saída antes da entrada
  await ps4.putFigure(config, slot, getBin(fig));
  state.slots[slot] = keyOf(fig);
  saveState();
  addRecent(keyOf(fig));
  return { ok: true, slot, slots: allSlots(), prefs };
}));

app.post('/api/fav', wrap((req) => {
  const { key, on } = req.body || {};
  if (!byKey.has(key)) throw new AppError('unknown_fig');
  prefs.favs = prefs.favs.filter((k) => k !== key);
  if (on) prefs.favs.unshift(key);               // a mais recente fica no topo
  savePrefs();
  return prefs;
}));

app.post('/api/prefs/set', wrap((req) => {
  const { hideUnknown } = req.body || {};
  if (typeof hideUnknown !== 'boolean') throw new AppError('bad_value');
  prefs.hideUnknown = hideUnknown;                 // esconder as figuras "Unknown" do catálogo
  savePrefs();
  return prefs;
}));

app.post('/api/prefs/clear', wrap((req) => {
  const what = req.body && req.body.what;
  if (what !== 'recent' && what !== 'favs') throw new AppError('bad_type');
  prefs[what === 'recent' ? 'recent' : 'favs'] = [];
  savePrefs();
  return prefs;
}));

app.post('/api/move', wrap(async (req) => {
  const { from, to } = req.body || {};
  if (!ps4.SLOT_FILES[from] || !ps4.SLOT_FILES[to]) throw new AppError('bad_slot');
  const a = state.slots[from];
  if (!a) throw new AppError('slot_empty');
  if (from === to) return { ok: true, slots: allSlots() };
  const b = state.slots[to];                       // se houver figura no destino, elas trocam de lugar
  await takeFromSlot(from);
  if (b) await takeFromSlot(to);
  await sleep(600);                                // dá tempo do plugin notar as saídas
  await ps4.putFigure(config, to, getBin(byKey.get(a)));
  state.slots[to] = a;
  if (b) { await ps4.putFigure(config, from, getBin(byKey.get(b))); state.slots[from] = b; }
  saveState();
  return { ok: true, swapped: !!b, slots: allSlots() };
}));

app.post('/api/remove', wrap(async (req) => {
  const slot = req.body.slot;
  if (!ps4.SLOT_FILES[slot]) throw new AppError('bad_slot');
  const synced = await takeFromSlot(slot);
  return { ok: true, synced, slots: allSlots() };
}));

app.post('/api/sync', wrap(async (req) => {
  const slot = req.body.slot;
  const fig = byKey.get(state.slots[slot]);
  if (!fig || fig.kind !== 'vehicle') throw new AppError('sync_only_veh');
  const bytes = await ps4.readFigure(config, slot);
  const p = tags.parseDump(bytes);
  if (p.kind !== 'vehicle' || p.id !== fig.id) throw new AppError('sync_mismatch');
  fs.writeFileSync(binPath(fig), bytes);
  return { ok: true };
}));

app.post('/api/clear', wrap(async () => {
  for (const s of SLOT_ORDER) if (state.slots[s]) await takeFromSlot(s).catch(() => {});
  await ps4.clearAll(config);
  state.slots = {};
  saveState();
  return { ok: true, slots: allSlots() };
}));

app.get('/api/about', (req, res) => {
  const lang = langOf(req);
  res.json({
    app: tr(lang, 'app_name'), version: pkg.version, author: CREDITS.author,
    tagline: loc(CREDITS.tagline, lang), legal: loc(CREDITS.legal, lang),
    credits: (CREDITS.credits || []).map((c) => ({ role: loc(c.role, lang), name: loc(c.name, lang), footer: c.footer !== false })),
  });
});

app.get('/api/theme', (_req, res) => res.json(theme));

app.post('/api/theme', wrap((req) => {
  const keep = { image: theme.bg.image, fontFile: theme.fontFile, rev: theme.rev };
  theme = sanitizeTheme(req.body, theme);
  theme.bg.image = keep.image; theme.fontFile = keep.fontFile; theme.rev = keep.rev;
  if (theme.bg.type === 'image' && !theme.bg.image) theme.bg.type = 'studs';
  saveTheme();
  return theme;
}));

// Envio de imagem de fundo ou de arquivo de fonte (corpo bruto do arquivo).
app.post('/api/theme/upload', express.raw({ type: () => true, limit: '10mb' }), wrap((req) => {
  const kind = req.query.kind;
  if (kind !== 'background' && kind !== 'font') throw new AppError('bad_upload');
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw new AppError('no_file');
  const info = sniff(req.body);
  const want = kind === 'background' ? 'image' : 'font';
  if (!info || info.kind !== want)
    throw new AppError(kind === 'background' ? 'need_image' : 'need_font');
  fs.mkdirSync(THEME_DIR, { recursive: true });
  for (const f of fs.readdirSync(THEME_DIR)) if (f.startsWith(kind + '.')) fs.unlinkSync(path.join(THEME_DIR, f));
  const name = `${kind}.${info.ext}`;
  fs.writeFileSync(path.join(THEME_DIR, name), req.body);
  if (kind === 'background') { theme.bg.image = name; theme.bg.type = 'image'; }
  else { theme.fontFile = name; theme.font = 'arquivo'; }
  theme.rev += 1;
  saveTheme();
  return theme;
}));

app.post('/api/theme/clear', wrap((req) => {
  const kind = req.body && req.body.kind;
  if (kind === 'all') { for (const k of ['background', 'font']) clearUpload(k); theme = JSON.parse(JSON.stringify(DEFAULT_THEME)); theme.rev = (Number(theme.rev) || 0) + 1; }
  else if (kind === 'background' || kind === 'font') {
    clearUpload(kind);
    if (kind === 'background') { theme.bg.image = null; if (theme.bg.type === 'image') theme.bg.type = 'studs'; }
    else { theme.fontFile = null; if (theme.font === 'arquivo') theme.font = 'padrao'; }
    theme.rev += 1;
  } else throw new AppError('bad_type');
  saveTheme();
  return theme;
}));
function clearUpload(kind) {
  try { for (const f of fs.readdirSync(THEME_DIR)) if (f.startsWith(kind + '.')) fs.unlinkSync(path.join(THEME_DIR, f)); } catch (_) { /* nada a apagar */ }
}

app.get('/api/leds', async (_req, res) => {
  try { res.json(await ps4.readLeds(config)); }
  catch (e) { res.json({ connected: false, error: friendly(e, langOf(_req)) }); }
});

app.use((err, req, res, _next) => {
  const big = err && err.type === 'entity.too.large';
  res.status(big ? 413 : (err && err.status) || 500).json({ error: big ? tr(langOf(req), 'too_big') : friendly(err, langOf(req)) });
});

const PORT = Number(process.env.PORT) || 3000;
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nLEGO Dimensions Toy Pad – painel PS4  ·  criado por ${CREDITS.author}  ·  v${pkg.version}\nAbra no celular (mesma rede Wi-Fi):`);
    for (const list of Object.values(os.networkInterfaces()))
      for (const i of list || []) if (i.family === 'IPv4' && !i.internal) console.log(`  http://${i.address}:${PORT}`);
    console.log(`  http://localhost:${PORT}\n`);
  });
}
module.exports = { app, ps4 };
