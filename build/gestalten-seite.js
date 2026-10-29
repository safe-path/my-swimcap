/* Baut gestalten.html aus build/gestalten.src.html.
   Nav und Footer werden 1:1 von einer bestehenden Unterseite übernommen
   (dort zeigen die Anker schon auf /#…), damit der Konfigurator exakt
   dieselben Komponenten nutzt wie der Rest der Seite.
   Aufruf: node build/gestalten-seite.js */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(__dirname, 'gestalten.src.html'), 'utf8');
const spoke = fs.readFileSync(path.join(root, 'badekappen-mit-namen.html'), 'utf8');

const navStart = spoke.indexOf('<header class="nav"');
const mmStart = spoke.indexOf('<div class="mmenu"');
const mmEnd = spoke.indexOf('</div>', mmStart) + '</div>'.length;
const fStart = spoke.indexOf('<footer class="footer">');
const fEnd = spoke.indexOf('</footer>') + '</footer>'.length;
if (navStart < 0 || mmStart < 0 || fStart < 0) throw new Error('Nav/Footer in der Unterseite nicht gefunden');

let nav = spoke.slice(navStart, mmEnd);
const footer = spoke.slice(fStart, fEnd);

/* Nav für den Konfigurator: von Anfang an im hellen Zustand (kein dunkler
   Hero darunter), Link »Selbst gestalten« als aktuelle Seite, und der
   CTA führt auf den klassischen Weg (kostenloser Entwurf). */
nav = nav
  .replace('<header class="nav" id="nav">', '<header class="nav scrolled" id="nav">')
  .replace(/(<nav class="nav__links">\s*)/, '$1<a href="/gestalten" class="is-current" aria-current="page">Selbst gestalten</a>')
  .replace(/(<div class="mmenu" id="mmenu">\s*)/, '$1<a href="/gestalten" aria-current="page">Selbst gestalten</a>')
  .replace(/Badekappen bestellen/g, 'Kostenlos anfragen')
  .replace(/data-en="Order swim caps"/g, 'data-en="Free mockup"');

const out = src.replace('<!--@NAV-->', nav).replace('<!--@FOOTER-->', footer);
fs.writeFileSync(path.join(root, 'gestalten.html'), out);
console.log('gestalten.html geschrieben (' + Math.round(out.length / 1024) + ' KB)');
