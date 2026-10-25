# LEGO Dimensions Toy Pad for PS4

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
