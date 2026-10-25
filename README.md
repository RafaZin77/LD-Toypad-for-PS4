# LEGO Dimensions Toy Pad panel for PS4 · Painel · Panel

**Created by RafaZin77** · MIT license (code only, see [THIRD_PARTY.md](THIRD_PARTY.md))

> Unofficial fan project. Not affiliated with, endorsed by or sponsored by the LEGO Group, Warner Bros. Interactive
> Entertainment, TT Games or Sony. LEGO and LEGO Dimensions are trademarks of their owners. No game files are included.

🇬🇧 [English](#english) · 🇪🇸 [Español](#español) · 🇧🇷 [Português](#português-br)

---

## English

A web panel (phone or PC) to pick LEGO Dimensions figures and vehicles on a **PS4 with GoldHEN**, without the physical
Toy Pad. It sends figure files over FTP to the `toypad_emu` GoldHEN plugin, which makes the game see a Toy Pad.

**Features:** 7-slot pad with drag and drop (mouse and touch) · 352 figures, searchable by name, world and ability ·
favorites and recent figures · hide the catalog's "Unknown" figures · built vehicles are saved · themes, colors,
backgrounds and fonts · installable as an app (PWA) · **English, Spanish and Portuguese (BR)**.

**Requirements:** Node.js 18+, a PS4 already running GoldHEN (plugin loader on, FTP on), the game updated to the
version the plugin requires, and the phone/PC on the same network as the PS4.

**Quick start**
```
npm install
npm start
```
Open the address shown in the terminal (for example `http://192.168.0.10:3000`), set the PS4 IP in **Settings**,
then **Install plugin on the PS4**. Add `?lang=en` to the address to switch language.

**Security:** the panel has no login. Use it only on a trusted home network and never expose it to the internet.

**Not included in this repository (on purpose)**
- The `toypad_emu` plugin, by [RadiantDelux](https://github.com/RadiantDelux/Lego-Patcher) (no license declared).
  The panel downloads it from the author's repository when you press *Install* and checks its SHA-256.
- Figure photos and the background artwork. The panel works without them (figures show their initials). To use your
  own, put images in `portraits/` named `12-Name.png` (character, 12 = ID) or `v1001-Name.png` (vehicle/gadget), or run
  `node tools/import-photos.js <folder>` to import images named after the figures. The "Game artwork" background needs
  `assets/splash.jpg`; use **My image** instead if you don't have it.

Full documentation (Portuguese): [LEIA-ME.md](LEIA-ME.md) · Credits: [THIRD_PARTY.md](THIRD_PARTY.md)

---

## Español

Panel web (móvil o PC) para elegir figuras y vehículos de LEGO Dimensions en una **PS4 con GoldHEN**, sin el Toy Pad
físico. Envía los archivos de las figuras por FTP al plugin `toypad_emu` de GoldHEN, que hace que el juego vea un Toy Pad.

**Funciones:** pad de 7 espacios con arrastrar y soltar (ratón y táctil) · 352 figuras, con búsqueda por nombre, mundo y
habilidad · favoritas y recientes · ocultar las figuras "Unknown" del catálogo · los vehículos montados se guardan ·
temas, colores, fondos y fuentes · instalable como app (PWA) · **español, inglés y portugués (BR)**.

**Requisitos:** Node.js 18+, una PS4 con GoldHEN ya funcionando (cargador de plugins y FTP activados), el juego
actualizado a la versión que exige el plugin, y el móvil/PC en la misma red que la PS4.

**Inicio rápido**
```
npm install
npm start
```
Abre la dirección que aparece en la terminal (por ejemplo `http://192.168.0.10:3000`), indica la IP de la PS4 en
**Configuración** y pulsa **Instalar el plugin en la PS4**. Añade `?lang=es` a la dirección para cambiar de idioma.

**Seguridad:** el panel no tiene inicio de sesión. Úsalo solo en una red doméstica de confianza y nunca lo expongas a internet.

**No incluido en este repositorio (a propósito):** el plugin `toypad_emu` de
[RadiantDelux](https://github.com/RadiantDelux/Lego-Patcher) (sin licencia declarada; el panel lo descarga del
repositorio del autor al pulsar *Instalar* y comprueba su SHA-256) y las fotos de las figuras y el arte de fondo
(el panel funciona sin ellos; mira la sección en inglés para añadir los tuyos).

Documentación completa (en portugués): [LEIA-ME.md](LEIA-ME.md)

---

## Português (BR)

Painel web (celular ou PC) para escolher as figuras e veículos do LEGO Dimensions em um **PS4 com GoldHEN**, sem o Toy
Pad físico. Ele envia os arquivos das figuras por FTP para o plugin `toypad_emu` do GoldHEN, que faz o jogo enxergar um Toy Pad.

**Recursos:** pad de 7 espaços com arrastar e soltar (mouse e toque) · 352 figuras, com busca por nome, mundo e
habilidade · favoritas e recentes · ocultar as figuras "Unknown" do catálogo · veículos montados são salvos · temas,
cores, fundos e fontes · instalável como app (PWA) · **português (BR), inglês e espanhol**.

**Para começar:** instale o Node.js 18+, rode `npm install` e `npm start`, abra o endereço que aparece no terminal e
siga o passo a passo do [LEIA-ME.md](LEIA-ME.md) (inclui o uso só com o celular, pelo Termux).

**Segurança:** o painel não tem login. Use só em rede doméstica de confiança e nunca o exponha na internet.

**Não estão neste repositório, de propósito:** o plugin `toypad_emu` (de RadiantDelux, sem licença declarada; o painel
baixa do repositório do autor ao instalar) e as fotos das figuras e a arte de fundo. Veja a seção em inglês para
colocar as suas.
