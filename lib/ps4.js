'use strict';
// Parte do painel LEGO Dimensions Toy Pad para PS4, criado por RafaZin77.
// Tudo que fala com o PS4 passa por aqui (FTP do GoldHEN, porta 2121).
// Cada operação abre uma conexão nova e fecha no fim, como o app original,
// e as operações são serializadas numa fila (o FTP do GoldHEN é simples).
const { Client, enterPassiveModeIPv4 } = require('basic-ftp');
const { Readable, Writable } = require('stream');
const crypto = require('crypto');
const { AppError } = require('./messages');
const fs = require('fs');
const path = require('path');

const PLUGINS_DIR = '/data/GoldHEN/plugins';
const PLUGINS_INI = '/data/GoldHEN/plugins.ini';
const PRX_DST = `${PLUGINS_DIR}/toypad_emu.prx`;
const FIG_DIR = '/data/toypad_emu';
const LEDS = `${FIG_DIR}/leds.txt`;

// Versão do plugin que foi analisada (RadiantDelux/Lego-Patcher, toypad_emu.prx).
const PRX_SHA256 = '752eea35e81dbb26ef5d7919e3427b3e3e8325ba763dd0e053ec47fba3cc77f6';
const PRX_URL = 'https://raw.githubusercontent.com/RadiantDelux/Lego-Patcher/main/Resources/Raw/toypad_emu.prx';
const PRX_LOCAL = path.join(__dirname, '..', 'plugin', 'toypad_emu.prx');

const SLOT_FILES = {
  C: 'figure1.bin',
  L1: 'figure2.bin', L2: 'figure3.bin', L3: 'figure4.bin',
  R1: 'figure5.bin', R2: 'figure6.bin', R3: 'figure7.bin',
};

let queue = Promise.resolve();
function enqueue(fn) {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

async function withClient(cfg, fn) {
  if (!cfg.host) throw new AppError('no_host');
  const c = new Client(10000);
  c.prepareTransfer = enterPassiveModeIPv4; // o FTP do GoldHEN só usa PASV
  try {
    await c.access({
      host: cfg.host, port: Number(cfg.port) || 2121,
      user: cfg.user || 'anonymous', password: cfg.pass || 'anonymous', secure: false,
    });
    return await fn(c);
  } finally {
    c.close();
  }
}
const run = (cfg, fn) => enqueue(() => withClient(cfg, fn));

async function download(c, remote) {
  const chunks = [];
  const sink = new Writable({ write(chunk, _e, cb) { chunks.push(chunk); cb(); } });
  await c.downloadTo(sink, remote);
  return Buffer.concat(chunks);
}
const upload = (c, buf, remote) => c.uploadFrom(Readable.from([buf]), remote);
const ensureDir = async (c, dir) => { try { await c.send(`MKD ${dir}`); } catch (_) { /* já existe */ } };
const remove = async (c, remote) => { try { await c.remove(remote); } catch (_) { /* não existia */ } };

const test = (cfg) => run(cfg, async (c) => { await c.pwd(); return true; });

const putFigure = (cfg, slot, buf) => run(cfg, async (c) => {
  await ensureDir(c, FIG_DIR);
  await upload(c, buf, `${FIG_DIR}/${SLOT_FILES[slot]}`);
});

// Se for veículo/gadget montado no jogo, devolve o dump atualizado antes de apagar.
const takeFigure = (cfg, slot, wantBytes) => run(cfg, async (c) => {
  const remote = `${FIG_DIR}/${SLOT_FILES[slot]}`;
  let bytes = null;
  if (wantBytes) { try { bytes = await download(c, remote); } catch (_) { bytes = null; } }
  await remove(c, remote);
  return bytes;
});

const readFigure = (cfg, slot) => run(cfg, (c) => download(c, `${FIG_DIR}/${SLOT_FILES[slot]}`));
const clearAll = (cfg) => run(cfg, async (c) => {
  for (const f of Object.values(SLOT_FILES)) await remove(c, `${FIG_DIR}/${f}`);
});

async function readLeds(cfg) {
  return run(cfg, async (c) => {
    let txt = '';
    try { txt = (await download(c, LEDS)).toString('ascii').trim(); } catch (_) { return { connected: true, colors: null }; }
    const p = txt.split(/\s+/).filter(Boolean);
    const ok = p.length >= 3 && p.slice(0, 3).every((h) => /^[0-9a-fA-F]{6}$/.test(h));
    return { connected: true, colors: ok ? p.slice(0, 3).map((h) => `#${h}`) : null }; // [centro, esquerda, direita]
  });
}

// ---- plugins.ini ----------------------------------------------------------
function addToIni(ini, titleId) {
  if (ini.toLowerCase().includes(PRX_DST.toLowerCase())) return { ini, changed: false };
  const lines = ini.replace(/\r\n/g, '\n').split('\n');
  const section = `[${titleId}]`;
  const out = [];
  let placed = false;
  for (const ln of lines) {
    out.push(ln);
    if (ln.trim().toLowerCase() === section.toLowerCase()) { out.push(PRX_DST); placed = true; }
  }
  if (!placed) {
    if (out.length && out[out.length - 1].trim()) out.push('');
    out.push(section, PRX_DST);
  }
  return { ini: out.join('\n').replace(/^\n+/, '').replace(/\n+$/, '') + '\n', changed: true };
}

async function getPrx(allowUnknown) {
  let buf, origin;
  if (fs.existsSync(PRX_LOCAL)) { buf = fs.readFileSync(PRX_LOCAL); origin = 'plugin/toypad_emu.prx (local)'; }
  else {
    const r = await fetch(PRX_URL);
    if (!r.ok) throw new AppError('prx_download', { status: r.status });
    buf = Buffer.from(await r.arrayBuffer());
    origin = 'GitHub RadiantDelux/Lego-Patcher';
  }
  const sha = crypto.createHash('sha256').update(buf).digest('hex');
  if (sha !== PRX_SHA256 && !allowUnknown) {
    throw new AppError('prx_unknown', {}, { code: 'UNKNOWN_PRX', sha });
  }
  return { buf, sha, origin, known: sha === PRX_SHA256 };
}

async function install(cfg, { allowUnknown = false } = {}) {
  const prx = await getPrx(allowUnknown);
  const titleId = (cfg.titleId || 'CUSA00935').trim().toUpperCase();
  if (!/^CUSA\d{5}$/.test(titleId)) throw new AppError('bad_title');
  const result = await run(cfg, async (c) => {
    await ensureDir(c, '/data/GoldHEN');
    await ensureDir(c, PLUGINS_DIR);
    await upload(c, prx.buf, PRX_DST);
    let ini = '';
    try { ini = (await download(c, PLUGINS_INI)).toString('utf8'); } catch (_) { /* ainda não existe */ }
    const r = addToIni(ini, titleId);
    if (r.changed) await upload(c, Buffer.from(r.ini, 'utf8'), PLUGINS_INI);
    await ensureDir(c, FIG_DIR);
    return { iniChanged: r.changed };
  });
  return { ...result, sha: prx.sha, origin: prx.origin, known: prx.known, titleId };
}

module.exports = {
  SLOT_FILES, test, putFigure, takeFigure, readFigure, clearAll, readLeds, install, addToIni,
  PRX_SHA256, FIG_DIR,
};
