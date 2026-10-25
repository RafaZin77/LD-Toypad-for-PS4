'use strict';
// Parte do painel LEGO Dimensions Toy Pad para PS4, criado por RafaZin77.
// Gera dumps de tag NFC (NTAG213, 180 bytes) para o plugin toypad_emu.
// A cifra do ID de personagem segue o algoritmo documentado no node-ld
// (ags131, licença ISC): TEA com chave derivada do UID da tag.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TAG_SIZE = 180;
const rotr32 = (a, b) => ((a >>> b) | (a << (32 - b))) >>> 0;

function scramble(uid7, cnt) {
  const base = Buffer.from([
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xb7,
    0xd5, 0xd7, 0xe6, 0xe7, 0xba, 0x3c, 0xa8, 0xd8,
    0x75, 0x47, 0x68, 0xcf, 0x23, 0xe9, 0xfe, 0xaa,
  ]);
  uid7.copy(base);
  base[cnt * 4 - 1] = 0xaa;
  let v2 = 0;
  for (let i = 0; i < cnt; i++) {
    const v4 = rotr32(v2, 25);
    const v5 = rotr32(v2, 10);
    v2 = (base.readUInt32LE(i * 4) + v4 + v5 - v2) >>> 0;
  }
  return v2;
}

const genKey = (uid7) => [3, 4, 5, 6].map((n) => scramble(uid7, n));
const DELTA = 0x9e3779b9;

function teaEncrypt([v0, v1], [k0, k1, k2, k3]) {
  let sum = 0;
  for (let i = 0; i < 32; i++) {
    sum = (sum + DELTA) >>> 0;
    v0 = (v0 + ((((v1 << 4) + k0) ^ (v1 + sum) ^ ((v1 >>> 5) + k1)) >>> 0)) >>> 0;
    v1 = (v1 + ((((v0 << 4) + k2) ^ (v0 + sum) ^ ((v0 >>> 5) + k3)) >>> 0)) >>> 0;
  }
  return [v0, v1];
}

function teaDecrypt([v0, v1], [k0, k1, k2, k3]) {
  let sum = 0xc6ef3720;
  for (let i = 0; i < 32; i++) {
    v1 = (v1 - ((((v0 << 4) + k2) ^ (v0 + sum) ^ ((v0 >>> 5) + k3)) >>> 0)) >>> 0;
    v0 = (v0 - ((((v1 << 4) + k0) ^ (v1 + sum) ^ ((v1 >>> 5) + k1)) >>> 0)) >>> 0;
    sum = (sum - DELTA) >>> 0;
  }
  return [v0, v1];
}

function encryptCharId(uid7, id) {
  const [a, b] = teaEncrypt([id >>> 0, id >>> 0], genKey(uid7));
  const out = Buffer.alloc(8);
  out.writeUInt32LE(a, 0);
  out.writeUInt32LE(b, 4);
  return out;
}

// UID de 7 bytes: 0x04 (NXP) ... 0x80, como no ToyPadEmu original.
function randomUid() {
  const u = crypto.randomBytes(7);
  u[0] = 0x04;
  u[6] = 0x80;
  return u;
}

function baseDump(uid) {
  const b = Buffer.alloc(TAG_SIZE);
  b[0] = uid[0]; b[1] = uid[1]; b[2] = uid[2];
  b[3] = 0x88 ^ uid[0] ^ uid[1] ^ uid[2];          // BCC0
  uid.copy(b, 4, 3, 7);
  b[8] = uid[3] ^ uid[4] ^ uid[5] ^ uid[6];        // BCC1
  b[9] = 0x48;                                      // byte interno
  b[12] = 0xe1; b[13] = 0x10; b[14] = 0x12;         // capability container
  return b;
}

function makeCharacter(id, uid = randomUid()) {
  const b = baseDump(uid);
  encryptCharId(uid, id).copy(b, 0x90);             // páginas 0x24-0x25
  b.writeUInt32LE(0, 0x98);                         // página 0x26 = 0 -> personagem
  return b;
}

function makeVehicle(id, uid = randomUid(), upgrades = [0xefffffff, 0xefffffff]) {
  const b = baseDump(uid);
  b.writeUInt32LE(upgrades[0] >>> 0, 0x8c);         // página 0x23
  b.writeUInt16LE(id, 0x90);                        // página 0x24
  b.writeUInt32LE(upgrades[1] >>> 0, 0x94);         // página 0x25
  b.writeUInt16BE(1, 0x98);                         // página 0x26 != 0 -> veículo
  return b;
}

// Lê de volta um dump: { uid, kind, id }
function parseDump(buf) {
  if (buf.length !== TAG_SIZE) throw new Error(`tamanho inválido: ${buf.length}`);
  const uid = Buffer.concat([buf.subarray(0, 3), buf.subarray(4, 8)]);
  if (buf.readUInt32LE(0x98) === 0) {
    const [a] = teaDecrypt([buf.readUInt32LE(0x90), buf.readUInt32LE(0x94)], genKey(uid));
    return { uid: uid.toString('hex'), kind: 'character', id: a };
  }
  return { uid: uid.toString('hex'), kind: 'vehicle', id: buf.readUInt16LE(0x90) };
}

// ---- catálogo -------------------------------------------------------------
const DATA = path.join(__dirname, '..', 'catalog');
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));

function loadCatalog() {
  const chars = readJson('charactermap.json').map((c) => ({
    id: c.id, name: c.name, world: c.world, abilities: c.abilities || '', kind: 'character',
  }));
  const toks = readJson('tokenmap.json').map((t) => ({
    id: t.id, name: t.name.replace(/^\*\s*/, ''), world: t.world, abilities: t.abilities || '',
    kind: 'vehicle', rebuild: t.rebuild || 0,
  }));
  return [...chars, ...toks];
}

const makeFor = (fig, uid) =>
  fig.kind === 'character' ? makeCharacter(fig.id, uid) : makeVehicle(fig.id, uid);

module.exports = {
  TAG_SIZE, makeCharacter, makeVehicle, makeFor, parseDump, loadCatalog,
  encryptCharId, teaEncrypt, teaDecrypt, genKey,
};
