'use strict';
// Mensagens do servidor em português (BR), inglês e espanhol. Criado por RafaZin77.
// O navegador manda o idioma no cabeçalho X-Lang; sem ele, vale o Accept-Language e, por fim, o português.
const LANGS = ['pt', 'en', 'es'];

const M = {
  unknown_fig:   { pt: 'Figura desconhecida.', en: 'Unknown figure.', es: 'Figura desconocida.' },
  pad_full:      { pt: 'O pad está cheio. Remova uma figura primeiro.', en: 'The pad is full. Remove a figure first.', es: 'El pad está lleno. Quita una figura primero.' },
  bad_slot:      { pt: 'Espaço inválido.', en: 'Invalid slot.', es: 'Espacio no válido.' },
  bad_value:     { pt: 'Valor inválido.', en: 'Invalid value.', es: 'Valor no válido.' },
  bad_type:      { pt: 'Tipo inválido.', en: 'Invalid type.', es: 'Tipo no válido.' },
  slot_empty:    { pt: 'O espaço de origem está vazio.', en: 'The source slot is empty.', es: 'El espacio de origen está vacío.' },
  sync_only_veh: { pt: 'Só dá para sincronizar veículos/gadgets que estão no pad.', en: 'Only vehicles/gadgets on the pad can be synced.', es: 'Solo se pueden sincronizar vehículos/gadgets que están en el pad.' },
  sync_mismatch: { pt: 'O arquivo no PS4 não corresponde a esta figura.', en: 'The file on the PS4 does not match this figure.', es: 'El archivo en la PS4 no corresponde a esta figura.' },
  bad_upload:    { pt: 'Tipo de envio inválido.', en: 'Invalid upload type.', es: 'Tipo de envío no válido.' },
  no_file:       { pt: 'Nenhum arquivo recebido.', en: 'No file received.', es: 'No se recibió ningún archivo.' },
  need_image:    { pt: 'Use uma imagem PNG, JPG, WebP ou GIF.', en: 'Use a PNG, JPG, WebP or GIF image.', es: 'Usa una imagen PNG, JPG, WebP o GIF.' },
  need_font:     { pt: 'Use uma fonte .woff2, .woff, .ttf ou .otf.', en: 'Use a .woff2, .woff, .ttf or .otf font.', es: 'Usa una fuente .woff2, .woff, .ttf u .otf.' },
  too_big:       { pt: 'Arquivo grande demais (máximo 10 MB).', en: 'File too large (10 MB maximum).', es: 'Archivo demasiado grande (máximo 10 MB).' },
  no_host:       { pt: 'Informe o IP do PS4 na aba Configuração.', en: 'Enter the PS4 IP address in the Settings tab.', es: 'Indica la IP de la PS4 en la pestaña Configuración.' },
  prx_download:  { pt: 'Não consegui baixar o plugin (HTTP {status}). Baixe manualmente e coloque em plugin/toypad_emu.prx', en: 'Could not download the plugin (HTTP {status}). Download it manually and put it in plugin/toypad_emu.prx', es: 'No pude descargar el plugin (HTTP {status}). Descárgalo a mano y colócalo en plugin/toypad_emu.prx' },
  prx_unknown:   { pt: 'O plugin é diferente da versão que foi analisada.', en: 'The plugin is different from the version that was analyzed.', es: 'El plugin es distinto de la versión que se analizó.' },
  bad_title:     { pt: 'Title ID inválido (formato CUSA00000).', en: 'Invalid Title ID (format CUSA00000).', es: 'Title ID no válido (formato CUSA00000).' },
  ps4_refused:   { pt: 'O PS4 recusou a conexão. Confirme que o GoldHEN está carregado e o FTP ligado (porta 2121).', en: 'The PS4 refused the connection. Make sure GoldHEN is loaded and FTP is on (port 2121).', es: 'La PS4 rechazó la conexión. Comprueba que GoldHEN está cargado y el FTP activado (puerto 2121).' },
  ps4_timeout:   { pt: 'Sem resposta do PS4. Confira o IP e se o PC/celular está na mesma rede.', en: 'No response from the PS4. Check the IP and that the PC/phone is on the same network.', es: 'Sin respuesta de la PS4. Revisa la IP y que el PC/móvil esté en la misma red.' },
  app_name:      { pt: 'LEGO Dimensions Toy Pad – painel PS4', en: 'LEGO Dimensions Toy Pad – PS4 panel', es: 'LEGO Dimensions Toy Pad – panel PS4' },
  offline_api:   { pt: 'Sem conexão com o servidor do painel. Ele está ligado? (no Termux: npm start)', en: 'No connection to the panel server. Is it running? (in Termux: npm start)', es: 'Sin conexión con el servidor del panel. ¿Está encendido? (en Termux: npm start)' },
};

// Erro com chave de mensagem: o texto é escolhido no idioma do pedido.
class AppError extends Error {
  constructor(key, vars, extra) {
    super(key);
    this.key = key; this.vars = vars || {};
    if (extra) Object.assign(this, extra);
  }
}

function langOf(req) {
  const x = String((req && req.headers && req.headers['x-lang']) || '').slice(0, 2).toLowerCase();
  if (LANGS.includes(x)) return x;
  const al = String((req && req.headers && req.headers['accept-language']) || '');
  for (const part of al.split(',')) {
    const c = part.trim().slice(0, 2).toLowerCase();
    if (LANGS.includes(c)) return c;
  }
  return 'pt';
}

function t(lang, key, vars) {
  const m = M[key] && (M[key][lang] || M[key].pt);
  if (!m) return key;
  return m.replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] !== undefined ? vars[k] : ''));
}

// Campo que pode ser texto simples ou { pt, en, es }.
const loc = (v, lang) => (v && typeof v === 'object' ? (v[lang] || v.pt || '') : v || '');

module.exports = { LANGS, M, AppError, langOf, t, loc };
