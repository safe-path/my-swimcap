/* =====================================================================
   MySwimcap · Selbst gestalten (Staging-Prototyp)
   ---------------------------------------------------------------------
   Konfigurator für bedruckte Badekappen in vier Schritten:
   1 Modell + Kappenfarbe (Paletten 1:1 aus dem Anfrage-Wizard)
   2 Gestalten: Logo und Text frei platzieren (ziehen, skalieren, drehen,
     Bogentext). Die Rückseite übernimmt standardmäßig das Motiv von vorne.
     Individuelle Namen sitzen unter dem Logo, Liste auch als CSV.
   3 Menge & Preis: Staffeln, Preisvorschlag erst hier
   4 Angebot anfordern (geht an den Make-Webhook des Anfrage-Wizards),
     alternativ Preisvorschlag als PDF oder kostenloser Entwurf
   Vorerst keine Bestellung und keine Zahlung (Thomas, 02.11.2026).
   ===================================================================== */
(function () {
  'use strict';

  /* =================================================================
     1. Konfiguration
     ================================================================= */

  /* Preisliste 2026 (TF_2026_Badekappenpreise.xlsx, Thomas 04.11.2026).
     Endpreise je Kappe inkl. 19 % MwSt. Zeile = Anzahl Druckfarben (1 bis 6),
     Spalte = Staffel ab 50 / 100 / 250 / 500 Stück. Eine bedruckte Rückseite
     zählt ihre Farben dazu, auch »wie vorne« (vorne 3 + hinten 3 = 6-farbig).
     Mehr als 6 Farben, individuelle Namen und Versand: Preis im Angebot.
     Vorerst nur Preisvorschlag + Angebotsanfrage, keine Online-Zahlung. */
  const PREIS = {
    staffeln: [50, 100, 250, 500],
    tabelle: {
      silikon:  [[6.90, 5.50, 4.80, 4.19], [8.70, 6.90, 5.70, 4.99], [10.40, 7.90, 5.95, 5.50], [13.00, 9.00, 7.00, 6.20], [14.20, 12.00, 9.00, 7.80], [17.00, 14.00, 10.00, 8.70]],
      stoff:    [[5.60, 4.50, 3.80, 3.19], [7.40, 5.90, 4.70, 3.99], [9.10, 6.90, 4.95, 4.50], [11.70, 8.00, 6.00, 5.20], [12.90, 11.00, 8.00, 6.80], [15.70, 13.00, 9.00, 7.70]],
      langhaar: [[7.60, 6.20, 5.50, 4.89], [9.40, 7.60, 6.40, 5.69], [11.10, 8.60, 6.65, 6.20], [13.70, 9.70, 7.70, 6.90], [14.90, 12.70, 9.70, 8.50], [17.70, 14.70, 10.70, 9.40]],
      '3d':     [[14.20, 12.30, 11.00, 9.69], [16.00, 13.40, 11.90, 10.49], [17.70, 14.40, 12.15, 11.00], [20.30, 15.50, 13.20, 11.70], [21.50, 18.50, 15.20, 13.30], [24.30, 20.50, 16.20, 14.20]]
    },
    mwst:      0.19,
    mindest:   50,
    maxFarben: 6
  };

  const MODELLE = {
    silikon:  { name: 'Silikon Premium',    wizard: 'Silikon Premium',    tag: 'Bestseller', bild: '/Bilder/model-silikon.webp', text: '100 % Silikon, rutschfest und robust. Der Klassiker.',      form: 'kappe',    finish: 'matt'  },
    '3d':     { name: '3D-Badekappe',       wizard: '3D-Badekappe',       tag: 'Premium',    bild: '/Bilder/model-3d.webp',      text: 'Volumengeformt und faltenfrei. Die hochwertige Optik.',      form: 'kappe',    finish: 'glanz' },
    stoff:    { name: 'Stoff',              wizard: 'Stoff',              tag: 'Leicht',     bild: '/Bilder/model-stoff.webp',   text: 'Dünn und anschmiegsam. Ideal für Schule und Freiwasser.',    form: 'kappe',    finish: 'stoff' },
    langhaar: { name: 'Langhaar-Badekappe', wizard: 'Langhaar-Badekappe', tag: 'Komfort',    bild: '/Bilder/model-frauen.webp',  text: 'Extra Volumen für lange Haare. Sitzt bequem.',               form: 'langhaar', finish: 'matt'  }
  };
  const REIHE = ['silikon', '3d', 'stoff', 'langhaar'];

  /* Kappenfarben aus dem Lieferantenkatalog Comercial Group 2026, identisch
     zum Anfrage-Wizard (index.html, FARBTON/FARBEN). [Name, EN, Hex, helle Farbe]
     Silikon = G2001 Adult, Langhaar = G2004 Long Hair, 3D = G2075 FVC6,
     Stoff = G4001 Polyester (Zuordnung von Sebastian bestätigt, 30.10.2026). */
  const FARBTON = {
    '10': ['Weiß', 'White', '#ffffff', 1],       '20': ['Neongelb', 'Fluo yellow', '#f2ec00', 1],
    '21': ['Gelb', 'Yellow', '#f7e11e', 1],      '30': ['Orange', 'Orange', '#dd7239', 0],
    '32': ['Neonorange', 'Fluo orange', '#ef7f2e', 0], '40': ['Rot', 'Red', '#bf2734', 0],
    '43': ['Bordeaux', 'Bordeaux', '#55152f', 0], '50': ['Pink', 'Pink', '#cf5590', 0],
    '55': ['Neonpink', 'Fluo pink', '#e85b9c', 0], '60': ['Neongrün', 'Fluo green', '#7cc24a', 1],
    '61': ['Mittelgrün', 'Med green', '#3f7d4e', 0], '70': ['Hellblau', 'Sky blue', '#82c6dc', 1],
    '71': ['Royalblau', 'Royal blue', '#2c4f9b', 0], '72': ['Navy', 'Navy blue', '#1d2b5c', 0],
    '81': ['Violett', 'Violet', '#6d4f9c', 0],   '85': ['Silber', 'Silver', '#78797b', 0],
    '86': ['Gold', 'Gold', '#c3a05e', 0],        '90': ['Schwarz', 'Black', '#131313', 0]
  };
  const FARBEN = {
    silikon:  ['10', '20', '21', '30', '40', '43', '50', '60', '61', '70', '71', '72', '81', '85', '86', '90'],
    langhaar: ['10', '20', '32', '55', '60', '70', '90'],
    '3d':     ['10', '21', '40', '71', '72', '90'],
    stoff:    ['21', '40', '61', '70', '71', '72', '90']
  };
  /* Kindergrößen: Silikon hat eine Junior-Variante mit kleinerer Palette
     (G2001JR Silicone Junior). FVC6, Long Hair und Polyester führt der
     Katalog nur in Erwachsenengröße. */
  const FARBEN_JUNIOR = {
    silikon:  ['10', '21', '30', '40', '50', '61', '70', '71', '72', '90']
  };
  /* Bei gemischter Bestellung nur Farben, die es in beiden Größen gibt */
  function farbListe(modell, groesse) {
    const er = FARBEN[modell], jr = FARBEN_JUNIOR[modell], g = groesse || st.groesse;
    if (!jr || g === 'erwachsene') return er;
    return g === 'kinder' ? jr : er.filter((nr) => jr.indexOf(nr) >= 0);
  }

  /* Druckfarben für Text und einfarbige Logos (Siebdruck-Standard). */
  const DRUCK = [
    ['Weiß', '#ffffff'], ['Schwarz', '#141414'], ['Navy', '#14254f'], ['Royalblau', '#1f4fa8'],
    ['Hellblau', '#5bb4dc'], ['Rot', '#c8202f'], ['Bordeaux', '#6b1730'], ['Orange', '#ee7a22'],
    ['Gelb', '#f6d21c'], ['Grün', '#2e8b4f'], ['Pink', '#e0559a'], ['Violett', '#6b45a0'],
    ['Silber', '#a7a9ac'], ['Gold', '#c7a35b']
  ];

  /* Schriftauswahl nach Thomas (02.11.2026): nur freie Lizenzen, nichts kaufen.
     OFL-Schriften lokal gehostet (siehe @font-face in gestalten.css). Futura,
     Georgia und Palatino sind Systemschriften der Geräte; wo sie fehlen,
     springt eine freie, ähnliche Schrift ein (Jost, Gelasio). Statt Panchang
     (Fontshare-Lizenz verbietet Gestaltungs-Tools) Unbounded mit allen
     Schnitten, statt Antique Olive Nord (Adobe Fonts) Dela Gothic One, statt
     College Block (kostenpflichtig) Graduate. */
  const SCHRIFTEN = {
    futura:    { label: 'Futura',           css: "Futura,'Futura PT','Jost',sans-serif",                            weight: 700, gross: true  },
    oswald:    { label: 'Oswald',           css: "'Oswald',sans-serif",                                             weight: 700, gross: true  },
    anton:     { label: 'Anton',            css: "'Anton','Oswald',sans-serif",                                     weight: 400, gross: true  },
    college:   { label: 'College',          css: "'Graduate','IBM Plex Serif',serif",                               weight: 400, gross: true  },
    unbounded: { label: 'Unbounded',        css: "'Unbounded','Jost',sans-serif",                                   weight: 700, gross: false, staerke: [300, 900] },
    dela:      { label: 'Dela Gothic',      css: "'Dela Gothic One','Anton',sans-serif",                            weight: 400, gross: false },
    sansation: { label: 'Sansation',        css: "'Sansation','Jost',sans-serif",                                   weight: 700, gross: false },
    grotesk:   { label: 'Overused Grotesk', css: "'Overused Grotesk','IBM Plex Sans',sans-serif",                   weight: 600, gross: false },
    georgia:   { label: 'Georgia',          css: "Georgia,'Gelasio',serif",                                         weight: 700, gross: false },
    palatino:  { label: 'Palatino',         css: "Palatino,'Palatino Linotype','Book Antiqua','Gelasio',serif",     weight: 700, gross: false }
  };
  /* Gespeicherte Entwürfe mit der alten Schriftliste */
  const SCHRIFT_ALT = { sport: 'oswald', block: 'anton', schmal: 'anton', modern: 'grotesk', rund: 'futura', klassisch: 'georgia', schwung: 'georgia' };
  const SCHRIFT_LADEN = ['700 44px Oswald', '400 44px Anton', '400 44px Graduate', '700 44px Unbounded', '400 44px "Dela Gothic One"',
    '700 44px Sansation', '600 44px "Overused Grotesk"', '700 44px Jost', '700 44px Gelasio'];
  const STAERKEN = { 300: 'Leicht', 400: 'Normal', 500: 'Medium', 600: 'Halbfett', 700: 'Fett', 800: 'Extrafett', 900: 'Black' };
  /* Strichstärke: nur Schriften mit mehreren Schnitten (staerke = [min, max]) */
  const staerke = (e, sch) => (sch.staerke ? clamp(e.staerke || sch.weight, sch.staerke[0], sch.staerke[1]) : sch.weight);
  const schriftName = (e) => {
    const sch = SCHRIFTEN[e.schrift] || SCHRIFTEN.oswald;
    return sch.label + (sch.staerke ? ' ' + STAERKEN[staerke(e, sch)] : '');
  };

  /* Silhouette der flach liegenden Kappe (viewBox 600 x 560), dieselbe Form
     wie im Loader und im Logo der Website. Nur absolute Befehle, damit
     Spiegeln und Skalieren per Zahlenpaar klappt. Langhaar: hinten (rechts)
     eine Ausbuchtung für die Haare, darüber eine Delle, darunter eine
     tiefere Aussparung über der Ohrlasche. Kuppelhöhe wie die Standardkappe. */
  const ECKE_LINKS = 'C112 477.1 103.1 469.4 103.5 459.6';
  const KUPPEL_LINKS = 'C103.9 449.7 104.2 422.5 100.5 416.9C76.5 380.1 65 347.4 65 300.2C65 170.6 172.2 70 301.9 70';
  const RECHTS = {
    kappe:    'C431.6 70 535 165.8 534.8 300.1C534.7 331 526.5 369.4 498.5 418L498.4 418',
    langhaar: 'C385 70 440 98 471 128C489 145 512 142 538 160C560 175 568 220 565 262C562 320 534 382 498.5 418L498.4 418'
  };
  const UNTEN = 'C495.6 468.7 486.5 476.5 476.7 474.5C389.5 456.9 368.1 479.5 298.5 482.3C232.7 485 220.1 455 121.6 475.1';
  const OHR_RECHTS = 'C494.3 423.9 494.4 449.8 495 458.8';
  const FORM = {}, OBEN = {};
  Object.keys(RECHTS).forEach((f) => {
    FORM[f] = `M498.4 418${OHR_RECHTS}${UNTEN}${ECKE_LINKS}${KUPPEL_LINKS}${RECHTS[f]}Z`;
    /* Kontur ohne die Öffnung unten: nur hier liegt der helle Rollrand */
    OBEN[f] = `M103.5 459.6${KUPPEL_LINKS}${RECHTS[f]}${OHR_RECHTS}`;
  });
  /* Gewellte Unterkante (Öffnung): hier wird es dunkler, ohne hellen Rand */
  const RAND = 'M495 458.8' + UNTEN + ECKE_LINKS;
  /* Druckbereich: nur die Kuppel, nicht Ohrlaschen und Rand */
  const SICHER = 'M118 410C100 376 94 344 94 300C94 186 186 104 300 104C414 104 506 186 506 300C506 344 500 376 482 410C400 424 200 424 118 410Z';

  const SB_URL = 'https://nkaznfwfkazfxjofpfcy.supabase.co';
  const SB_ANON = 'sb_publishable_ciub5YQ7vI-BT5zOtXkezQ_0xjk4Llr'; // öffentlicher Key (Frontend)
  const SB_BUCKET = 'logos';

  const KEY = 'sc_gestalten_v1';
  const NS = 'http://www.w3.org/2000/svg';
  const XL = 'http://www.w3.org/1999/xlink';
  const ISTPROD = /(^|\.)my-swimcap\.de$/.test(location.hostname);

  /* =================================================================
     2. Hilfsfunktionen
     ================================================================= */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r2 = (n) => Math.round(n * 100) / 100;
  const uid = () => 'e' + Math.random().toString(36).slice(2, 9);
  const euro = (n) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function setHref(node, url) {
    node.setAttribute('href', url);
    node.setAttributeNS(XL, 'xlink:href', url);
  }
  function hexRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function luminanz(hex) {
    const [r, g, b] = hexRgb(hex);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  function druckName(hex) {
    const f = DRUCK.find((d) => d[1].toLowerCase() === String(hex).toLowerCase());
    if (f) return f[0];
    return naechsteDruckfarbe(hexRgb(hex));
  }
  function druckHex(name) {
    const f = DRUCK.find((d) => d[0] === name);
    return f ? f[1] : '#999999';
  }
  function naechsteDruckfarbe(rgb) {
    let best = DRUCK[0][0], bd = 1e9;
    DRUCK.forEach((d) => {
      const c = hexRgb(d[1]);
      const dr = rgb[0] - c[0], dg = rgb[1] - c[1], db = rgb[2] - c[2];
      const dist = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
      if (dist < bd) { bd = dist; best = d[0]; }
    });
    return best;
  }
  function kontrastFarbe(kappeHex) {
    return luminanz(kappeHex) < 0.56 ? '#ffffff' : '#14254f';
  }
  function zahlenpaare(d, fn) {
    let i = 0;
    return d.replace(/-?\d+(?:\.\d+)?/g, (n) => {
      const v = parseFloat(n);
      const r = fn(v, i % 2 === 0);
      i++;
      return String(Math.round(r * 10) / 10);
    });
  }
  const spiegel = (d) => zahlenpaare(d, (v, x) => (x ? 600 - v : v));
  const skaliere = (d, s, cx, cy) => zahlenpaare(d, (v, x) => (x ? cx + (v - cx) * s : cy + (v - cy) * s));
  const verschiebe = (d, dy) => zahlenpaare(d, (v, x) => (x ? v : v + dy));
  function setBtnText(btn, text) {
    const t = btn && btn.querySelector('.btn__t');
    if (t) Array.from(t.children).forEach((s) => { s.textContent = text; });
    else if (btn) btn.textContent = text;
  }
  function kw(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y0) / 864e5 + 1) / 7);
  }
  const datumLang = (d) => d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' });
  const datumKurz = (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('an');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('an'), Math.max(3400, msg.length * 60));
  }

  /* =================================================================
     3. Zustand, Speicher, Verlauf
     ================================================================= */
  function neuerZustand() {
    return {
      v: 2, modus: 'service', modell: 'silikon', farbe: '71', seite: 'vorne',
      elemente: { vorne: [], hinten: [] }, auswahl: null,
      rueckseite: 'gleich', // gleich = Motiv von vorne, eigen = eigenes Motiv, leer = unbedruckt
      menge: 100, groesse: 'erwachsene', kinder: 0,
      namen: { aktiv: false, liste: [], vorschau: 0 },
      netto: false, druckbereich: true,
      service: { notiz: '', datei: '', seiten: { vorne: true, hinten: false }, farben: { vorne: 2, hinten: 1 } },
      tab: 'modell'
    };
  }
  let st = neuerZustand();
  const cache = {};     // je Bild-Element: { view, palette, viele }
  const dateien = {};   // Originaldateien dieser Sitzung (für die Übergabe an den Wizard)
  let verlauf = [], zukunft = [];

  function snapshot() {
    const s = Object.assign({}, st);
    delete s.auswahl;
    delete s.tab;
    return JSON.stringify(s);
  }
  function commit() {
    const s = snapshot();
    if (verlauf[verlauf.length - 1] === s) return;
    verlauf.push(s);
    if (verlauf.length > 80) verlauf.shift();
    zukunft = [];
    speichernBald();
    renderVerlaufBtns();
  }
  function wiederherstellen(json) {
    const alt = { auswahl: st.auswahl, tab: st.tab };
    st = Object.assign(neuerZustand(), JSON.parse(json), alt);
    if (st.auswahl && !finde(st.auswahl)) st.auswahl = null;
    Promise.all(alleBilder().map((e) => (cache[e.id] && cache[e.id].sig === bildSig(e) ? null : verarbeite(e)))).then(renderAlles);
    renderAlles();
    speichernBald();
  }
  function undo() {
    if (verlauf.length < 2) return;
    zukunft.push(verlauf.pop());
    wiederherstellen(verlauf[verlauf.length - 1]);
    renderVerlaufBtns();
  }
  function redo() {
    if (!zukunft.length) return;
    const s = zukunft.pop();
    verlauf.push(s);
    wiederherstellen(s);
    renderVerlaufBtns();
  }
  let speicherTimer = null;
  function speichernBald() {
    clearTimeout(speicherTimer);
    speicherTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, snapshot()); }
      catch (e) { /* Speicher voll (sehr große Logos): Entwurf bleibt in dieser Sitzung erhalten */ }
    }, 350);
  }
  function laden() {
    const q = new URLSearchParams(location.search);
    if (q.get('neu') !== '1') {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const alt = JSON.parse(raw);
          /* Entwürfe von vor der Rückseiten-Wahl: eigene Rückseite behalten */
          if (!alt.rueckseite) alt.rueckseite = (alt.elemente && alt.elemente.hinten || []).some((e) => !e.name) ? 'eigen' : 'gleich';
          ['vorne', 'hinten'].forEach((s) => ((alt.elemente && alt.elemente[s]) || []).forEach((e) => { if (SCHRIFT_ALT[e.schrift]) e.schrift = SCHRIFT_ALT[e.schrift]; }));
          st = Object.assign(neuerZustand(), alt, { auswahl: null, tab: 'modell' });
        }
      } catch (e) { st = neuerZustand(); }
    }
    const m = q.get('modell');
    if (m && MODELLE[m]) {
      st.modell = m;
    }
    /* Gespeicherte Farbe kann nach Katalog-Update oder Größenwahl fehlen */
    if (farbListe(st.modell).indexOf(st.farbe) < 0) st.farbe = standardFarbe(st.modell);
    if (q.get('modus') === 'service') st.modus = 'service';
  }
  function standardFarbe(m) {
    const l = farbListe(m);
    return l.indexOf('71') >= 0 ? '71' : (l.indexOf('90') >= 0 ? '90' : l[0]);
  }

  const alleElemente = () => st.elemente.vorne.concat(st.elemente.hinten);
  /* Was auf einer Seite gedruckt wird. Die Rückseite zeigt standardmäßig
     genau das Motiv der Vorderseite. Eine eigene Rückseite bleibt
     gespeichert, auch wenn gerade »wie vorne« gilt. */
  function druckElemente(seite) {
    if (seite === 'hinten') {
      if (st.rueckseite === 'leer') return [];
      if (st.rueckseite === 'gleich') return st.elemente.vorne; // 1:1, auch der Name
    }
    return st.elemente[seite];
  }
  /* Im Service-Modus zeigt die Kappe nur das hochgeladene Motiv. Das selbst
     gebaute Design bleibt erhalten und ist beim Zurückwechseln wieder da. */
  const sichtbare = (seite) => (st.modus === 'service' ? druckElemente(seite).filter((e) => e.serviceLogo) : druckElemente(seite));
  /* Rückseite »wie vorne« oder »unbedruckt«: dort wird nichts direkt bearbeitet */
  const rueckGesperrt = () => st.modus === 'selbst' && st.seite === 'hinten' && st.rueckseite !== 'eigen';
  const alleBilder = () => alleElemente().filter((e) => e.typ === 'bild');
  const finde = (id) => alleElemente().find((e) => e.id === id) || null;
  const seiteVon = (id) => (st.elemente.vorne.some((e) => e.id === id) ? 'vorne' : 'hinten');
  const kappeHex = () => (FARBTON[st.farbe] ? FARBTON[st.farbe][2] : '#2c4f9b');

  /* =================================================================
     4. Bildverarbeitung: Hintergrund, Farberkennung, Einfärben
     ================================================================= */
  function ladeBild(src) {
    return new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });
  }
  function eckFarbe(d) {
    const w = d.width, h = d.height, px = d.data;
    const pts = [0, w - 1, (h - 1) * w, h * w - 1].map((i) => i * 4);
    if (pts.some((o) => px[o + 3] < 245)) return null;
    const c = pts.map((o) => [px[o], px[o + 1], px[o + 2]]);
    for (let i = 1; i < 4; i++) {
      const dr = c[i][0] - c[0][0], dg = c[i][1] - c[0][1], db = c[i][2] - c[0][2];
      if (dr * dr + dg * dg + db * db > 40 * 40) return null;
    }
    return [0, 1, 2].map((k) => Math.round(c.reduce((a, v) => a + v[k], 0) / 4));
  }
  /* Schwellenwert fürs Freistellen: Regler 0–100 %, Standard 30 % (Farbabstand 52) */
  const HG_STANDARD = 30;
  const hgAbstand = (e) => 7 + 1.5 * (e.hgTol === undefined ? HG_STANDARD : e.hgTol);
  function entferneHg(d, abstand) {
    const ref = eckFarbe(d);
    if (!ref) return false;
    const w = d.width, h = d.height, px = d.data, tol = abstand * abstand, weich = Math.max(96, abstand * 1.85);
    const seen = new Uint8Array(w * h), stack = new Int32Array(w * h + 4);
    let sp = 0;
    const nah = (i) => {
      const o = i * 4;
      if (px[o + 3] < 10) return true;
      const dr = px[o] - ref[0], dg = px[o + 1] - ref[1], db = px[o + 2] - ref[2];
      return dr * dr + dg * dg + db * db < tol;
    };
    const push = (i) => { if (!seen[i]) { seen[i] = 1; stack[sp++] = i; } };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    const weg = new Uint8Array(w * h);
    while (sp) {
      const i = stack[--sp];
      if (!nah(i)) continue;
      weg[i] = 1;
      px[i * 4 + 3] = 0;
      const x = i % w, y = (i / w) | 0;
      if (x > 0) push(i - 1);
      if (x < w - 1) push(i + 1);
      if (y > 0) push(i - w);
      if (y < h - 1) push(i + w);
    }
    /* Kantenglättung gegen hellen Rand ("Halo") auf dunklen Kappen */
    for (let i = 0; i < w * h; i++) {
      if (weg[i]) continue;
      const x = i % w, y = (i / w) | 0;
      const nb = (x > 0 && weg[i - 1]) || (x < w - 1 && weg[i + 1]) || (y > 0 && weg[i - w]) || (y < h - 1 && weg[i + w]);
      if (!nb) continue;
      const o = i * 4;
      const dr = px[o] - ref[0], dg = px[o + 1] - ref[1], db = px[o + 2] - ref[2];
      const s = Math.sqrt(dr * dr + dg * dg + db * db) / weich;
      if (s < 1) px[o + 3] = Math.round(px[o + 3] * s);
    }
    return true;
  }
  function analysiere(d) {
    const px = d.data, buckets = new Map();
    let n = 0;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 140) continue;
      n++;
      const k = ((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4);
      let b = buckets.get(k);
      if (!b) { b = { r: 0, g: 0, b: 0, c: 0 }; buckets.set(k, b); }
      b.r += px[i]; b.g += px[i + 1]; b.b += px[i + 2]; b.c++;
    }
    if (!n) return { namen: [], viele: false };
    const arr = Array.from(buckets.values())
      .map((b) => ({ r: b.r / b.c, g: b.g / b.c, b: b.b / b.c, c: b.c }))
      .sort((a, b) => b.c - a.c);
    const cl = [];
    arr.forEach((b) => {
      for (const c of cl) {
        const dr = c.r - b.r, dg = c.g - b.g, db = c.b - b.b;
        if (dr * dr + dg * dg + db * db < 64 * 64) {
          const t = c.c + b.c;
          c.r = (c.r * c.c + b.r * b.c) / t; c.g = (c.g * c.c + b.g * b.c) / t; c.b = (c.b * c.c + b.b * b.c) / t;
          c.c = t;
          return;
        }
      }
      cl.push({ r: b.r, g: b.g, b: b.b, c: b.c });
    });
    const sig = cl.filter((c) => c.c / n >= 0.02);
    const namen = [];
    sig.forEach((c) => {
      const nm = naechsteDruckfarbe([c.r, c.g, c.b]);
      if (namen.indexOf(nm) < 0) namen.push(nm);
    });
    return { namen, viele: sig.length > PREIS.maxFarben, cluster: sig.map((c) => ({ rgb: [c.r, c.g, c.b], name: naechsteDruckfarbe([c.r, c.g, c.b]) })) };
  }
  /* Erkannte Logofarben auf andere Druckfarben legen (map: Name → Ziel-Hex).
     Jedes Pixel geht zur nächstgelegenen erkannten Farbe, damit auch
     Kantenpixel mitwandern. So lassen sich Farben zusammenlegen. */
  function umfaerben(d, cluster, map) {
    const ziel = cluster.map((c) => (map[c.name] ? hexRgb(map[c.name]) : null));
    if (!ziel.some(Boolean)) return;
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 10) continue;
      let best = 0, bd = 1e12;
      for (let k = 0; k < cluster.length; k++) {
        const c = cluster[k].rgb, dr = px[i] - c[0], dg = px[i + 1] - c[1], db = px[i + 2] - c[2];
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bd) { bd = dist; best = k; }
      }
      const z = ziel[best];
      if (z) { px[i] = z[0]; px[i + 1] = z[1]; px[i + 2] = z[2]; }
    }
  }
  /* Kennung der Bildeinstellungen: ändert sie sich (z. B. durch Rückgängig),
     muss das Bild neu aufbereitet werden */
  const bildSig = (e) => JSON.stringify([e.src.length, !!e.ohneHg, e.hgTol, e.mono || null, e.farbMap || null]);
  function faerbe(d, hex) {
    const [r, g, b] = hexRgb(hex), px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] > 0) { px[i] = r; px[i + 1] = g; px[i + 2] = b; }
    }
  }
  function inhaltBox(d) {
    const w = d.width, h = d.height, px = d.data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (px[(y * w + x) * 4 + 3] > 12) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return null;
    return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  function verarbeite(e) {
    return ladeBild(e.src).then((img) => {
      let w = img.naturalWidth || 600, h = img.naturalHeight || 600;
      const sc = Math.min(1, 900 / Math.max(w, h));
      const cw = Math.max(1, Math.round(w * sc)), ch = Math.max(1, Math.round(h * sc));
      const c = document.createElement('canvas');
      c.width = cw; c.height = ch;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0, cw, ch);
      const d = x.getImageData(0, 0, cw, ch);
      if (e.hgErkannt === undefined) e.hgErkannt = !!eckFarbe(d);
      if (e.ohneHg) entferneHg(d, hgAbstand(e));
      let info = analysiere(d);
      const erkannt = info.namen;
      if (e.mono) { faerbe(d, e.mono); info = { namen: [druckName(e.mono)], viele: false }; }
      else if (e.farbMap && Object.keys(e.farbMap).length) {
        umfaerben(d, info.cluster, e.farbMap);
        const namen = [];
        erkannt.forEach((n) => { const z = e.farbMap[n] ? druckName(e.farbMap[n]) : n; if (namen.indexOf(z) < 0) namen.push(z); });
        info = { namen, viele: info.viele };
      }
      x.putImageData(d, 0, 0);
      const box = inhaltBox(d);
      let out = c;
      if (box && box.w > 4 && box.h > 4 && (box.w < cw || box.h < ch)) {
        out = document.createElement('canvas');
        out.width = box.w; out.height = box.h;
        out.getContext('2d').drawImage(c, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      }
      cache[e.id] = { view: out.toDataURL('image/png'), palette: info.namen, erkannt, viele: info.viele, sig: bildSig(e) };
      const asp = out.height / out.width;
      if (!e.w) {
        if (asp > 1) { e.h = 190; e.w = Math.round(190 / asp); } else { e.w = 190; e.h = Math.round(190 * asp); }
      } else {
        e.h = Math.round(e.w * asp * 10) / 10;
      }
    }).catch(() => {
      cache[e.id] = { view: e.src, palette: [], erkannt: [], viele: false, sig: bildSig(e) };
      if (!e.w) { e.w = 190; e.h = 190; }
    });
  }
  function verkleinere(datei) {
    /* Große Fotos vor dem Zwischenspeichern verkleinern (max. 1200 px). */
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        if (datei.type === 'image/svg+xml') { res(fr.result); return; }
        ladeBild(fr.result).then((img) => {
          const m = 1200, s = Math.min(1, m / Math.max(img.naturalWidth, img.naturalHeight));
          if (s === 1 && datei.size < 900 * 1024) { res(fr.result); return; }
          const c = document.createElement('canvas');
          c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL('image/png'));
        }, rej);
      };
      fr.onerror = rej;
      fr.readAsDataURL(datei);
    });
  }

  /* =================================================================
     5. Preis & Lieferung
     ================================================================= */
  function stufe(m) {
    let i = 0;
    PREIS.staffeln.forEach((s, k) => { if (m >= s) i = k; });
    return i;
  }
  /* Service: geschätzte Druckfarben je Seite. Die Rückseite folgt derselben
     Wahl wie beim Selbstgestalten (wie vorne, eigenes Motiv, unbedruckt). */
  function svcFarben(seite) {
    if (seite === 'hinten') {
      if (st.rueckseite === 'leer') return 0;
      if (st.rueckseite === 'gleich') return st.service.farben.vorne;
    }
    return st.service.farben[seite];
  }
  function farbenSeite(seite) {
    if (st.modus === 'service') return Array.from({ length: svcFarben(seite) }, (_, i) => 'F' + i);
    const set = new Set();
    druckElemente(seite).forEach((e) => {
      if (e.name) return; // Namen sind im Namenspreis enthalten (Einzeldruck)
      if (e.typ === 'text') set.add(druckName(e.farbe));
      else {
        const c = cache[e.id];
        (e.mono ? [druckName(e.mono)] : (c ? c.palette : [])).forEach((n) => set.add(n));
      }
    });
    return Array.from(set);
  }
  function rechne(opt) {
    opt = opt || {};
    const m = Math.max(PREIS.mindest, Math.round(opt.menge || st.menge) || PREIS.mindest);
    const t = stufe(m);
    const fv = farbenSeite('vorne').length;
    const fh = farbenSeite('hinten').length; // »wie vorne« liefert die Farben der Vorderseite
    const farben = fv + fh;
    const zeile = clamp(farben, 1, PREIS.maxFarben);
    const stueck = PREIS.tabelle[st.modell][zeile - 1][t];
    const brutto = r2(stueck * m);
    const netto = r2(brutto / (1 + PREIS.mwst));
    return { m, t, fv, fh, farben, zeile, ueber: farben > PREIS.maxFarben, namen: st.namen.aktiv, stueck, brutto, netto, mwst: r2(brutto - netto) };
  }
  /* Stückpreis bei gleicher Menge, aber anderer Farbzahl (für Spar-Hinweise) */
  const preisBei = (p, farben) => PREIS.tabelle[st.modell][clamp(farben, 1, PREIS.maxFarben) - 1][p.t];
  const zeig = (p, wert) => (st.netto ? r2(wert / (1 + PREIS.mwst)) : wert); // Listenpreise sind brutto
  function lieferung() {
    const wochen = st.namen.aktiv ? 6 : 5;
    const d = new Date();
    d.setDate(d.getDate() + wochen * 7 + 2); // + Proof & Freigabe
    return { wochen, datum: d, text: st.namen.aktiv ? '5 bis 6 Wochen' : '4 bis 5 Wochen' };
  }
  function farbenBand(n) {
    if (n <= 1) return '1-farbig';
    if (n <= 3) return '2–3 Farben'; // Wert des Wizards, nicht ändern
    return '4+ Farben';
  }
  function mengenBand(m) {
    if (m < 100) return '50–100';
    if (m < 250) return '100–250';
    if (m < 500) return '250–500';
    return '500+';
  }

  /* =================================================================
     6. Bühne: Kappe rendern + Interaktion
     ================================================================= */
  let kid = 0;
  function geometrie(modell, seite) {
    const f = MODELLE[modell].form;
    let umriss = FORM[f], oben = OBEN[f], rand = RAND, sicher = SICHER;
    if (seite === 'hinten') { umriss = spiegel(umriss); oben = spiegel(oben); rand = spiegel(rand); sicher = spiegel(sicher); }
    return { umriss, oben, rand, sicher, form: f };
  }
  function bogenRadius(b) { return 150 + (100 - Math.abs(b)) * 14; }
  /* Großbuchstaben je Text; ältere Entwürfe ohne Angabe folgen der Schrift */
  const istVersal = (e) => (e.versal !== undefined ? e.versal : !!(SCHRIFTEN[e.schrift] || SCHRIFTEN.oswald).gross);
  function textInhalt(e) {
    let t = e.text || '';
    if (e.name) {
      const l = st.namen.liste;
      t = l.length ? l[clamp(st.namen.vorschau, 0, l.length - 1)] : 'Vorname';
    }
    return istVersal(e) ? t.toLocaleUpperCase('de-DE') : t;
  }
  function druckKnoten(e, p, defs) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', `translate(${e.x} ${e.y}) rotate(${e.r}) scale(${e.s})`);
    g.setAttribute('data-id', e.id);
    if (e.typ === 'bild') {
      const c = cache[e.id];
      const w = e.w || 190, h = e.h || 190;
      const img = el('image', { x: -w / 2, y: -h / 2, width: w, height: h, preserveAspectRatio: 'xMidYMid meet' }, g);
      setHref(img, c && c.view ? c.view : e.src);
    } else {
      const sch = SCHRIFTEN[e.schrift] || SCHRIFTEN.oswald;
      const gr = 44, o = gr * 0.35;
      const attrs = { 'font-family': sch.css, 'font-weight': staerke(e, sch), 'font-size': gr, fill: e.farbe, 'letter-spacing': (e.spacing || 0) * gr, 'text-anchor': 'middle' };
      const txt = textInhalt(e);
      if (!e.bogen) {
        const t = el('text', Object.assign({ x: 0, y: o }, attrs), g);
        t.textContent = txt;
      } else {
        const R = bogenRadius(e.bogen), id = p + 'b' + e.id;
        const d = e.bogen > 0
          ? `M${-R} ${R + o} A${R} ${R} 0 0 1 ${R} ${R + o}`
          : `M${-R} ${-R + o} A${R} ${R} 0 0 0 ${R} ${-R + o}`;
        el('path', { id, d }, defs);
        const t = el('text', attrs, g);
        const tp = el('textPath', { startOffset: '50%' }, t);
        setHref(tp, '#' + id);
        tp.textContent = txt;
      }
    }
    return g;
  }
  function baueKappe(ziel, modell, farbe, seite, elemente) {
    const p = 'k' + (++kid) + '_';
    const geo = geometrie(modell, seite);
    const hex = FARBTON[farbe] ? FARBTON[farbe][2] : '#2c4f9b';
    const L = luminanz(hex);
    const fin = MODELLE[modell].finish;
    ziel.innerHTML = '';
    const defs = el('defs', {}, ziel);
    el('path', { d: geo.umriss }, el('clipPath', { id: p + 'clip' }, defs));
    const stops = (g, liste) => liste.forEach((s) => el('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] }, g));
    /* Volumen: Mitte und oben links heller, zur Öffnung unten dunkler */
    stops(el('radialGradient', { id: p + 'licht', cx: '42%', cy: '34%', r: '70%' }, defs),
      [['0', '#fff', L > 0.8 ? '.10' : '.15'], ['.5', '#fff', '0'], ['.82', '#000', '0'], ['1', '#000', L > 0.8 ? '.06' : '.12']]);
    stops(el('linearGradient', { id: p + 'unten', x1: '0', y1: '0', x2: '0', y2: '1' }, defs),
      [['.6', '#000', '0'], ['1', '#000', L > 0.8 ? '.10' : '.20']]);
    /* Rollrand: heller Wulst an der Kante, links stärker (Lichtseite) */
    stops(el('linearGradient', { id: p + 'wulst', gradientUnits: 'userSpaceOnUse', x1: '60', y1: '0', x2: '540', y2: '0' }, defs),
      [['0', '#fff', L > 0.8 ? '.6' : '.42'], ['.5', '#fff', L > 0.8 ? '.4' : '.22'], ['1', '#fff', L > 0.8 ? '.5' : '.32']]);
    /* Filterfläche fest über die ganze Bühne: bei flachen Pfaden (Unterkante)
       würde die Standardfläche den Weichzeichner sonst abschneiden */
    const blur = (id, sd) => el('feGaussianBlur', { stdDeviation: sd }, el('filter', { id: p + id, filterUnits: 'userSpaceOnUse', x: '-40', y: '-40', width: '680', height: '640' }, defs));
    blur('weich', '24'); blur('kante', '9'); blur('fein', '2'); blur('rand', '3.5'); blur('rinne', '4.5');
    el('feGaussianBlur', { stdDeviation: '13' }, el('filter', { id: p + 'schatten', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs));
    const fk = el('filter', { id: p + 'korn', x: '0', y: '0', width: '100%', height: '100%' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: fin === 'stoff' ? '1.3' : '.85', numOctaves: '2', seed: '4', stitchTiles: 'stitch' }, fk);
    el('feColorMatrix', { type: 'saturate', values: '0' }, fk);
    /* Stoff: feines Köpergewebe, nur angedeutet */
    if (fin === 'stoff') el('rect', { width: '3', height: '1.1', fill: '#000' },
      el('pattern', { id: p + 'gewebe', width: '3', height: '3', patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(38)' }, defs));
    const bogenDefs = el('g', { 'class': 'bogen-defs' }, defs);

    el('ellipse', { cx: 300, cy: 492, rx: 218, ry: 15, fill: '#191818', opacity: '.24', filter: `url(#${p}schatten)`, 'class': 'kap-schatten' }, ziel);
    const kap = el('g', { 'class': 'kap' }, ziel);
    el('path', { d: geo.umriss, fill: hex, 'class': 'kap-flaeche' }, kap);
    const innen = el('g', { 'clip-path': `url(#${p}clip)` }, kap);
    const drucke = el('g', { 'class': 'drucke' }, innen);
    const korn = el('rect', { width: 600, height: 560, filter: `url(#${p}korn)`, opacity: fin === 'stoff' ? '.18' : (fin === 'glanz' ? '.03' : '.08') }, innen);
    korn.style.mixBlendMode = 'multiply';
    if (fin === 'stoff') el('rect', { width: 600, height: 560, fill: `url(#${p}gewebe)`, opacity: L > 0.8 ? '.04' : '.06' }, innen);
    const flaeche = (fill, opacity) => el('rect', { width: 600, height: 560, fill, opacity: opacity || '1' }, innen);
    flaeche(`url(#${p}licht)`);
    flaeche(`url(#${p}unten)`);
    /* Wie beim Foto der Silikonkappe: Kuppel und Ohrlaschen wölben sich weg.
       Ganz außen ein heller Rollrand, dahinter ein schmaler dunklerer Übergang. */
    el('path', { d: geo.oben, fill: 'none', stroke: '#000', 'stroke-opacity': L > 0.8 ? '.07' : '.15', 'stroke-width': '34', filter: `url(#${p}rinne)` }, innen);
    el('path', { d: geo.oben, fill: 'none', stroke: `url(#${p}wulst)`, 'stroke-width': '15', filter: `url(#${p}fein)` }, innen);
    /* Unten liegt die Öffnung: kein heller Rand, nur dunkler und ein leichter Schatten */
    el('path', { d: geo.rand, fill: 'none', stroke: '#000', 'stroke-opacity': L > 0.8 ? '.08' : '.16', 'stroke-width': '44', filter: `url(#${p}kante)` }, innen);
    el('path', { d: geo.rand, fill: 'none', stroke: '#000', 'stroke-opacity': L > 0.8 ? '.06' : '.12', 'stroke-width': '10', filter: `url(#${p}rand)` }, innen);
    if (fin === 'stoff') {
      el('path', { d: skaliere(geo.umriss, 0.955, 300, 290), fill: 'none', stroke: '#000', 'stroke-opacity': '.24', 'stroke-width': '1.6', 'stroke-dasharray': '5 5' }, innen);
    }
    /* Glanz: 3D glänzend. Silikon, Langhaar und Stoff nur ein schwacher Fleck,
       damit der Schein oben links gleichmäßig über den Rand läuft */
    const glanz = fin === 'glanz' ? '.42' : '.08';
    el('ellipse', { cx: 196, cy: 178, rx: 118, ry: 62, fill: '#fff', opacity: glanz, filter: `url(#${p}weich)`, transform: 'rotate(-32 196 178)' }, innen);
    if (fin === 'glanz') el('ellipse', { cx: 478, cy: 290, rx: 20, ry: 110, fill: '#fff', opacity: '.18', filter: `url(#${p}weich)` }, innen);
    el('path', { d: geo.umriss, fill: 'none', stroke: '#191818', 'stroke-opacity': L > 0.85 ? '.26' : '.14', 'stroke-width': '1.2' }, kap);

    if (elemente) elemente.forEach((e) => drucke.appendChild(druckKnoten(e, p, bogenDefs)));
    return { drucke, bogenDefs, geo, prefix: p };
  }
  /* Statische Kappe (Kasse, Bestätigung, PDF) */
  function statischeKappe(seite, klasse) {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 600 560');
    s.setAttribute('class', klasse || 'kappe-mini');
    s.setAttribute('role', 'img');
    s.setAttribute('aria-label', (seite === 'vorne' ? 'Vorderseite' : 'Rückseite') + ' der Badekappe');
    baueKappe(s, st.modell, st.farbe, seite, sichtbare(seite));
    return s;
  }

  /* ---------- interaktive Bühne ---------- */
  let svg, B = null, gTreffer, gAuswahl, gFuehrung, pfadSicher, boxen = {}, zieh = null, rafPlan = 0;

  function renderKappe() {
    B = baueKappe(svg, st.modell, st.farbe, st.seite, null);
    pfadSicher = el('path', { d: B.geo.sicher, 'class': 'sicher' + (st.druckbereich ? ' an' : '') }, svg);
    gFuehrung = el('line', { x1: 300, y1: 60, x2: 300, y2: 496, 'class': 'fuehrung' }, svg);
    gTreffer = el('g', { 'class': 'treffer' }, svg);
    gAuswahl = el('g', { 'class': 'auswahl' }, svg);
    renderDrucke();
  }
  function massstab() {
    const m = svg.getScreenCTM();
    return m && m.a ? m.a : 1;
  }
  function lokal(e, lx, ly) {
    const a = e.r * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return { x: e.x + e.s * (lx * c - ly * s), y: e.y + e.s * (lx * s + ly * c) };
  }
  function renderDrucke() {
    if (!B) return;
    renderRueckseite(); // zuerst: die Leiste ändert die Bühnenhöhe und damit den Maßstab
    B.drucke.innerHTML = '';
    B.bogenDefs.innerHTML = '';
    gTreffer.innerHTML = '';
    boxen = {};
    const els = sichtbare(st.seite);
    els.forEach((e) => B.drucke.appendChild(druckKnoten(e, B.prefix, B.bogenDefs)));
    const k = massstab(), gesperrt = rueckGesperrt();
    $$('g[data-id]', B.drucke).forEach((n) => {
      const e = finde(n.getAttribute('data-id'));
      if (!e) return;
      let bb;
      try { bb = n.getBBox(); } catch (x) { bb = null; }
      if (!bb || !bb.width) bb = { x: -40, y: -18, width: 80, height: 36 };
      boxen[e.id] = { x: bb.x, y: bb.y, width: bb.width, height: bb.height };
      if (gesperrt) return;
      const pad = 8 / (k * e.s);
      el('rect', {
        'class': 'hit', 'data-id': e.id, x: bb.x - pad, y: bb.y - pad,
        width: bb.width + 2 * pad, height: bb.height + 2 * pad, transform: n.getAttribute('transform')
      }, gTreffer);
    });
    zeichneAuswahl();
    pruefeBereich();
    renderBuehnenInfo();
  }
  function aktualisiereElement(e) {
    const tf = `translate(${e.x} ${e.y}) rotate(${e.r}) scale(${e.s})`;
    const n = B.drucke.querySelector(`g[data-id="${e.id}"]`);
    const h = gTreffer.querySelector(`rect[data-id="${e.id}"]`);
    if (n) n.setAttribute('transform', tf);
    if (h) {
      const bb = boxen[e.id], pad = 8 / (massstab() * e.s);
      if (bb) {
        h.setAttribute('x', bb.x - pad); h.setAttribute('y', bb.y - pad);
        h.setAttribute('width', bb.width + 2 * pad); h.setAttribute('height', bb.height + 2 * pad);
      }
      h.setAttribute('transform', tf);
    }
    zeichneAuswahl();
  }
  function zeichneAuswahl() {
    if (!gAuswahl) return;
    gAuswahl.innerHTML = '';
    const e = finde(st.auswahl);
    if (!e || seiteVon(e.id) !== st.seite || !boxen[e.id]) return;
    const bb = boxen[e.id], k = massstab(), pad = 6 / (k * e.s);
    const x0 = bb.x - pad, y0 = bb.y - pad, x1 = bb.x + bb.width + pad, y1 = bb.y + bb.height + pad;
    const ecken = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map((q) => lokal(e, q[0], q[1]));
    el('polygon', { points: ecken.map((q) => q.x + ',' + q.y).join(' '), 'class': 'rahmen', 'stroke-width': 1.6 / k, 'stroke-dasharray': `${5 / k} ${4 / k}` }, gAuswahl);
    const oben = lokal(e, (x0 + x1) / 2, y0);
    const dg = lokal(e, (x0 + x1) / 2, y0 - 34 / (k * e.s));
    el('line', { x1: oben.x, y1: oben.y, x2: dg.x, y2: dg.y, 'class': 'griff-linie', 'stroke-width': 1.4 / k }, gAuswahl);
    griff('drehen', dg, k);
    griff('skalieren', ecken[2], k);
    griff('loeschen', ecken[1], k);
  }
  function griff(typ, pt, k) {
    const g = el('g', { 'class': 'griff griff--' + typ, 'data-griff': typ, transform: `translate(${pt.x} ${pt.y}) scale(${1 / k})` }, gAuswahl);
    el('circle', { r: 22, 'class': 'griff-hit' }, g);
    el('circle', { r: 12, 'class': 'griff-knopf' }, g);
    /* Drehen: Kreispfeil im Uhrzeigersinn (Form wie Lucide »rotate-cw«) */
    const d = typ === 'drehen' ? 'M4.5 0a4.5 4.5 0 1 1-4.5-4.5c1.26 0 2.47.5 3.37 1.37L4.5-2M4.5-4.5V-2H2'
      : typ === 'skalieren' ? 'M-4.5 4.5 L4.5 -4.5 M0.6 -4.5 H4.5 V-0.6 M-0.6 4.5 H-4.5 V0.6'
      : 'M-4 -4 L4 4 M4 -4 L-4 4';
    el('path', { d, 'class': 'griff-icon' }, g);
    const titel = { drehen: 'Drehen', skalieren: 'Größe ändern', loeschen: 'Entfernen' }[typ];
    el('title', {}, g).textContent = titel;
  }
  /* Messpunkte für die Druckbereich-Prüfung. Bei Text die echten Zeichen-
     Positionen statt der Box: beim Bogentext sind die Box-Ecken leer. */
  function messpunkte(e) {
    const bb = boxen[e.id];
    if (!bb) return [];
    if (e.typ === 'text' && B) {
      const t = B.drucke.querySelector(`g[data-id="${e.id}"] text`);
      try {
        const n = t ? t.getNumberOfChars() : 0;
        if (n) {
          const pts = [], step = Math.max(1, Math.ceil(n / 16));
          const add = (r) => {
            const y0 = r.y + r.height * 0.14, y1 = r.y + r.height * 0.86;
            pts.push([r.x, y0], [r.x + r.width, y0], [r.x, y1], [r.x + r.width, y1]);
          };
          for (let i = 0; i < n; i += step) add(t.getExtentOfChar(i));
          add(t.getExtentOfChar(n - 1));
          return pts;
        }
      } catch (x) { /* Fallback: Box */ }
    }
    return [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x + bb.width, bb.y + bb.height], [bb.x, bb.y + bb.height],
      [bb.x + bb.width / 2, bb.y], [bb.x + bb.width, bb.y + bb.height / 2], [bb.x + bb.width / 2, bb.y + bb.height], [bb.x, bb.y + bb.height / 2]];
  }
  function imBereich(q) {
    if (!pfadSicher || !pfadSicher.isPointInFill) return true;
    let p;
    try { p = new DOMPoint(q.x, q.y); } catch (x) { p = svg.createSVGPoint(); p.x = q.x; p.y = q.y; }
    try { return pfadSicher.isPointInFill(p); } catch (x) { return true; }
  }
  function ausserhalb(e) {
    if (!boxen[e.id] || !pfadSicher || !pfadSicher.isPointInFill) return false;
    return messpunkte(e).some((q0) => !imBereich(lokal(e, q0[0], q0[1])));
  }
  function pruefeBereich() {
    const raus = st.modus === 'selbst' && sichtbare(st.seite).some(ausserhalb);
    $('#warnBereich').hidden = !raus;
    return raus;
  }
  function svgPunkt(ev) {
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  function plane() {
    if (rafPlan) return;
    rafPlan = requestAnimationFrame(() => {
      rafPlan = 0;
      const e = finde(zieh && zieh.id);
      if (e) aktualisiereElement(e);
    });
  }
  function onDown(ev) {
    if (ev.button > 0) return;
    const t = ev.target;
    const gEl = t.closest && t.closest('[data-griff]');
    const hit = t.closest && t.closest('.hit');
    const p = svgPunkt(ev);
    if (gEl) {
      const typ = gEl.getAttribute('data-griff'), e = finde(st.auswahl);
      if (!e) return;
      if (typ === 'loeschen') { ev.preventDefault(); entferne(e.id); return; }
      zieh = { typ, id: e.id, p0: p, s0: e.s, r0: e.r, d0: Math.max(8, Math.hypot(p.x - e.x, p.y - e.y)), a0: Math.atan2(p.y - e.y, p.x - e.x) * 180 / Math.PI };
    } else if (hit) {
      const id = hit.getAttribute('data-id'), e = finde(id);
      if (st.auswahl !== id) { waehle(id); }
      zieh = { typ: 'bewegen', id, p0: p, x0: e.x, y0: e.y, bewegt: false };
    } else {
      if (st.auswahl) waehle(null);
      if (rueckGesperrt() && st.rueckseite === 'gleich' && sichtbare('hinten').length && imBereich(p)) {
        toast('Die Rückseite übernimmt das Motiv von vorne. Für Änderungen »Eigenes Motiv« wählen.');
      }
      return;
    }
    try { svg.setPointerCapture(ev.pointerId); } catch (x) {}
    ev.preventDefault();
    $('#flaeche').classList.add('zieht');
    pfadSicher.classList.add('an');
  }
  function onMove(ev) {
    if (!zieh) return;
    const p = svgPunkt(ev), e = finde(zieh.id);
    if (!e) return;
    if (zieh.typ === 'bewegen') {
      let nx = zieh.x0 + (p.x - zieh.p0.x);
      const ny = zieh.y0 + (p.y - zieh.p0.y);
      const snap = Math.abs(nx - 300) < 8;
      if (snap) nx = 300;
      gFuehrung.classList.toggle('an', snap);
      e.x = Math.round(clamp(nx, -60, 660) * 10) / 10;
      e.y = Math.round(clamp(ny, -60, 620) * 10) / 10;
      if (Math.abs(p.x - zieh.p0.x) + Math.abs(p.y - zieh.p0.y) > 2) zieh.bewegt = true;
    } else if (zieh.typ === 'skalieren') {
      e.s = Math.round(clamp(zieh.s0 * Math.hypot(p.x - e.x, p.y - e.y) / zieh.d0, 0.15, 4) * 1000) / 1000;
    } else if (zieh.typ === 'drehen') {
      let r = zieh.r0 + (Math.atan2(p.y - e.y, p.x - e.x) * 180 / Math.PI - zieh.a0);
      r = ((r + 540) % 360) - 180;
      [0, 90, -90, 180, -180, 45, -45].forEach((z) => { if (Math.abs(r - z) < 4) r = z; });
      e.r = Math.round(r);
    }
    plane();
  }
  function onUp(ev) {
    if (!zieh) return;
    const war = zieh;
    zieh = null;
    try { svg.releasePointerCapture(ev.pointerId); } catch (x) {}
    $('#flaeche').classList.remove('zieht');
    gFuehrung.classList.remove('an');
    pfadSicher.classList.toggle('an', st.druckbereich);
    if (war.typ !== 'bewegen' || war.bewegt) commit();
    renderDrucke();
    renderInspektor();
    renderPreis();
  }

  /* =================================================================
     7. Aktionen
     ================================================================= */
  function waehle(id) {
    st.auswahl = id;
    if (id) {
      const s = seiteVon(id);
      if (s !== st.seite) { st.seite = s; renderSeiten(); renderKappe(); }
    }
    zeichneAuswahl();
    renderInspektor();
    renderEbenen();
    if (id && st.tab !== 'design') zeigeTab('design');
    else if (id) panelInSicht(true);
  }
  function fuegeHinzu(e, seite) {
    seite = seite || st.seite;
    if (seite !== st.seite) { st.seite = seite; renderSeiten(); }
    /* Neues Element auf der Rückseite: ab jetzt hat sie ein eigenes Motiv.
       War sie »wie vorne«, bleibt das sichtbare Motiv als Startpunkt stehen. */
    if (seite === 'hinten' && st.modus === 'selbst' && st.rueckseite !== 'eigen') rueckEigen(st.rueckseite === 'gleich');
    st.elemente[seite].push(e);
    st.auswahl = e.id;
    renderKappe();
    renderInspektor();
    renderEbenen();
    renderPreis();
    commit();
    zeigeTab('design');
  }
  function neuerText(over) {
    return Object.assign({
      id: uid(), typ: 'text', x: 300, y: 236, s: 1, r: 0,
      text: 'Dein Text', schrift: 'oswald', farbe: kontrastFarbe(kappeHex()), bogen: 0, spacing: -0.01, versal: true, name: false
    }, over || {});
  }
  function textHinzu(preset) {
    let e;
    if (preset === 'bogen') e = neuerText({ text: 'SV Musterstadt', bogen: 72, y: 196, s: 0.92 });
    else if (preset === 'nummer') e = neuerText({ text: '23', schrift: 'anton', s: 1.9, y: 300 });
    else if (preset === 'slogan') e = neuerText({ text: 'Gemeinsam schneller', schrift: 'georgia', s: 0.8, y: 360 });
    else e = neuerText();
    fuegeHinzu(e);
    setTimeout(() => {
      const f = $('#insText');
      if (f && window.matchMedia('(pointer:fine)').matches) { f.focus(); f.select(); }
    }, 60);
  }
  function bildHinzu(src, meta) {
    const e = Object.assign({ id: uid(), typ: 'bild', x: 300, y: 282, s: 1, r: 0, src, ohneHg: false, mono: null, datei: 'logo' }, meta || {});
    return verarbeite(e).then(() => {
      if (e.hgErkannt && meta && meta.autoHg !== false && !e.ohneHg) {
        e.ohneHg = true;
        return verarbeite(e).then(() => e);
      }
      return e;
    }).then((e2) => {
      delete e2.autoHg;
      fuegeHinzu(e2, meta && meta.seite);
      /* Sofort sagen, wie viele Druckfarben erkannt wurden und was jede weitere kostet */
      const n = cache[e2.id] ? cache[e2.id].palette.length : 0;
      let msg = n ? `${n} Druckfarbe${n > 1 ? 'n' : ''} im Logo erkannt.` : '';
      if (n > 1 && !e2.serviceLogo) {
        const p = rechne(), spar = r2(p.stueck - preisBei(p, p.zeile - 1));
        msg += ` Jede Farbe kostet extra${spar > 0 ? `, eine weniger spart gerade ${euro(zeig(p, spar))} je Kappe` : ''}. Ihr könnt Farben im Logo-Bereich zusammenlegen.`;
      }
      if (e2.ohneHg) msg += ' Hintergrund automatisch entfernt.';
      if (msg) toast(msg.trim());
      return e2;
    });
  }
  function entferne(id) {
    const s = seiteVon(id);
    const e = finde(id);
    st.elemente[s] = st.elemente[s].filter((x) => x.id !== id);
    /* Namen bleiben aktiv, solange noch ein Platzhalter existiert (z. B. auf der eigenen Rückseite) */
    if (e && e.name && !alleElemente().some((x) => x.name)) { st.namen.aktiv = false; renderNamen(); }
    delete cache[id];
    if (st.auswahl === id) st.auswahl = null;
    renderDrucke();
    renderInspektor();
    renderEbenen();
    renderPreis();
    commit();
  }
  function dupliziere(id) {
    const e = finde(id);
    if (!e || e.name) return;
    const k = JSON.parse(JSON.stringify(e));
    k.id = uid();
    k.x += 18; k.y += 18;
    if (cache[e.id]) cache[k.id] = cache[e.id];
    fuegeHinzu(k, seiteVon(id));
  }
  function aufAndereSeite(id) {
    const s = seiteVon(id), z = s === 'vorne' ? 'hinten' : 'vorne';
    const e = finde(id);
    if (z === 'hinten' && st.rueckseite !== 'eigen') rueckEigen(false);
    st.elemente[s] = st.elemente[s].filter((x) => x.id !== id);
    st.elemente[z].push(e);
    st.seite = z;
    renderSeiten();
    renderKappe();
    renderInspektor();
    renderEbenen();
    renderPreis();
    commit();
    toast(`Auf die ${z === 'vorne' ? 'Vorderseite' : 'Rückseite'} verschoben.`);
  }
  function ebene(id, dir) {
    const s = seiteVon(id), arr = st.elemente[s], i = arr.findIndex((x) => x.id === id), j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    renderDrucke();
    renderEbenen();
    commit();
  }
  function beispielLaden() {
    const txt = '#ffffff';
    st.elemente.vorne = st.elemente.vorne.filter((e) => e.name);
    st.elemente.hinten = st.elemente.hinten.filter((e) => e.name);
    if (farbListe(st.modell).indexOf('71') >= 0 && luminanz(kappeHex()) > 0.6) st.farbe = '71';
    const logo = { id: uid(), typ: 'bild', x: 300, y: 300, s: 1, r: 0, src: '/Bilder/beispiel-logo.svg', ohneHg: false, mono: null, datei: 'beispiel-logo.svg', beispiel: true };
    verarbeite(logo).then(() => {
      logo.w = Math.round(logo.w * 0.8); logo.h = Math.round(logo.h * 0.8);
      st.elemente.vorne.push(logo,
        neuerText({ text: 'SV Musterstadt', bogen: 70, y: 194, s: 0.8, spacing: 0.06, farbe: txt }));
      st.elemente.hinten.push(
        neuerText({ text: 'Musterstadt', y: 250, s: 0.86, spacing: 0.08, farbe: txt }),
        neuerText({ text: 'Seit 1923', schrift: 'grotesk', y: 300, s: 0.5, spacing: 0.22, farbe: txt }));
      st.rueckseite = 'eigen';
      st.seite = 'vorne';
      st.auswahl = null;
      renderAlles();
      commit();
      toast('Beispiel geladen. Zieh die Elemente, ändere Farben oder dreh die Kappe um.');
    });
  }
  function dateiGewaehlt(datei, ziel) {
    if (!datei) return;
    if (datei.size > 25 * 1024 * 1024) { toast('Die Datei ist größer als 25 MB. Bitte verkleinern oder per Mail schicken.'); return; }
    const istBild = /^image\/(png|jpe?g|webp|svg\+xml|gif)$/.test(datei.type);
    if (ziel === 'service' || !istBild) {
      st.service.datei = datei.name;
      dateien.service = datei;
      if (st.modus !== 'service' && !istBild) {
        setModus('service');
        toast('Diese Datei zeigen wir im Browser nicht an. Wir übernehmen sie und gestalten kostenlos für euch.');
      }
      if (istBild) {
        verkleinere(datei).then((src) => {
          st.elemente.vorne = st.elemente.vorne.filter((e) => !e.serviceLogo);
          return bildHinzu(src, { datei: datei.name, seite: 'vorne', serviceLogo: true });
        }).then((e) => { if (e) dateien[e.id] = datei; renderService(); });
      }
      renderService();
      renderPreis();
      speichernBald();
      return;
    }
    verkleinere(datei).then((src) => bildHinzu(src, { datei: datei.name })).then((e) => {
      dateien[e.id] = datei;
    }).catch(() => toast('Das Bild konnte nicht gelesen werden. Versuch es mit PNG, JPG oder SVG.'));
  }
  function setModus(m) {
    st.modus = m;
    renderModus();
    renderPreis();
    commit();
  }

  /* ---------- Rückseite: wie vorne / eigenes Motiv / unbedruckt ---------- */
  function klon(e) {
    const k = JSON.parse(JSON.stringify(e));
    k.id = uid();
    if (cache[e.id]) cache[k.id] = cache[e.id];
    if (dateien[e.id]) dateien[k.id] = dateien[e.id];
    return k;
  }
  /* Auf »eigen« schalten. Mit kopieren=true wird das Motiv von vorne als
     Startpunkt übernommen, sofern die Rückseite noch nichts Eigenes hat. */
  function rueckEigen(kopieren) {
    if (kopieren && !st.elemente.hinten.length) st.elemente.hinten = st.elemente.vorne.map(klon);
    st.rueckseite = 'eigen';
  }
  function setRueckseite(wert) {
    if (wert === st.rueckseite) return;
    if (wert === 'eigen') {
      const vorher = st.rueckseite;
      rueckEigen(vorher === 'gleich' && st.modus === 'selbst');
      if (vorher === 'leer' && !st.elemente.hinten.length) toast('Eigene Rückseite: Lad ein Logo hoch oder setz einen Text.');
    } else {
      st.rueckseite = wert;
      if (st.auswahl && seiteVon(st.auswahl) === 'hinten') st.auswahl = null;
    }
    if (st.seite !== 'hinten') { st.seite = 'hinten'; renderSeiten(); }
    renderKappe();
    renderInspektor();
    renderEbenen();
    renderService();
    renderPreis();
    commit();
  }
  /* Aufpreis der Rückseite je Kappe (Differenz zu »unbedruckt«) */
  function rueckAufpreis(wert) {
    const alt = st.rueckseite;
    st.rueckseite = wert || alt;
    const mit = rechne().stueck;
    st.rueckseite = 'leer';
    const ohne = rechne().stueck;
    st.rueckseite = alt;
    return r2(mit - ohne);
  }
  function renderRueckseite() {
    const anders = st.rueckseite !== 'gleich';
    $('#rsAnders').checked = anders;
    $('#rsWahl').hidden = !anders;
    $$('[data-rs]', $('#rsWahl')).forEach((b) => {
      const on = b.dataset.rs === st.rueckseite;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    const leiste = $('#rsLeiste');
    const an = st.modus === 'selbst' && st.seite === 'hinten';
    leiste.hidden = !an;
    if (!an) return;
    const vorneLeer = !st.elemente.vorne.some((e) => !e.name);
    let t;
    if (st.rueckseite === 'leer') {
      const a = rueckAufpreis('gleich');
      t = a > 0 ? `Rückseite bleibt frei. Wie vorne bedruckt: +${euro(zeig(null, a))} je Kappe` : 'Rückseite bleibt frei, kein Aufpreis.';
    } else if (st.rueckseite === 'gleich' && vorneLeer) {
      t = 'Übernimmt das Motiv der Vorderseite, sobald dort etwas steht.';
    } else {
      const a = rueckAufpreis();
      t = `${st.rueckseite === 'gleich' ? 'Gleiches Motiv wie vorne' : 'Eigenes Motiv'} · Druck auf der Rückseite <b>+${euro(zeig(null, a))}</b> je Kappe`;
    }
    $('#rsInfo').innerHTML = t;
  }

  /* ---------- Individuelle Namen ---------- */
  /* Platzhalter unter das größte Logo der Seite setzen (sonst mittig unten) */
  function namenElement() {
    const seite = st.seite === 'hinten' && st.rueckseite === 'eigen' ? 'hinten' : 'vorne';
    const logos = st.elemente[seite].filter((e) => e.typ === 'bild')
      .sort((a, b) => (b.w || 190) * (b.h || 190) * b.s * b.s - (a.w || 190) * (a.h || 190) * a.s * a.s);
    let x = 300, y = 340, s = 0.82;
    if (logos.length) {
      /* Name: Versalhöhe ca. 31 × s, Mitte liegt auf y. Unterkante max. 418
         (Druckbereich). Reicht der Platz nicht, rückt das Logo etwas hoch. */
      const l = logos[0], halb = (l.h || 190) * l.s / 2, abstand = 10, maxY = 402;
      x = l.x;
      s = clamp(((l.w || 190) * l.s) / 170, 0.6, 1);
      const platz = maxY - (l.y + halb) - abstand;
      if (platz < 15.5 * s) s = Math.max(0.6, platz / 15.5);
      if (platz < 15.5 * s) l.y = Math.round((l.y - (15.5 * s - platz)) * 10) / 10;
      y = Math.round((l.y + halb + abstand + 15.5 * s) * 10) / 10;
    }
    return { seite, e: neuerText({ name: true, text: '', x, y, s, farbe: kontrastFarbe(kappeHex()) }) };
  }
  /* Namensliste aus CSV/TXT: Spalte »Name«, »Aufdruck« oder »Vorname«, sonst
     die erste Spalte. Excel speichert CSV mit Semikolon. */
  function namenAusText(txt) {
    const zeilen = txt.replace(/^﻿/, '').split(/\r?\n/).map((z) => z.trim()).filter(Boolean);
    if (!zeilen.length) return [];
    const trenn = [';', '\t', ','].find((t) => zeilen[0].indexOf(t) >= 0);
    const rein = (s) => String(s || '').replace(/^"+|"+$/g, '').trim();
    let spalte = 0, start = 0;
    const kopf = (trenn ? zeilen[0].split(trenn) : [zeilen[0]]).map((s) => rein(s).toLowerCase());
    const treffer = ['name', 'aufdruck', 'namen', 'vorname', 'spieler', 'spielername'].map((k) => kopf.indexOf(k)).find((i) => i >= 0);
    if (treffer !== undefined) { spalte = treffer; start = 1; }
    return zeilen.slice(start).map((z) => rein(trenn ? z.split(trenn)[spalte] : z)).filter(Boolean).slice(0, 2000);
  }
  function namenDateiGewaehlt(datei) {
    if (!datei) return;
    datei.arrayBuffer().then((buf) => {
      let txt;
      try { txt = new TextDecoder('utf-8', { fatal: true }).decode(buf); }
      catch (x) { txt = new TextDecoder('windows-1252').decode(buf); } // ältere Excel-Exporte
      const liste = namenAusText(txt);
      if (!liste.length) { toast('In der Datei wurden keine Namen gefunden.'); return; }
      st.namen.liste = liste;
      st.namen.vorschau = 0;
      renderNamen();
      renderDrucke();
      const mehr = liste.length > st.menge;
      if (mehr) setMenge(liste.length);
      commit();
      toast(`${liste.length} Namen übernommen.${mehr ? ` Menge auf ${liste.length} Stück angepasst.` : ''}`);
    }).catch(() => toast('Die Datei konnte nicht gelesen werden. Speicher sie als CSV oder TXT.'));
  }
  function zeigeNamenVorschau(dir) {
    const z = st.namen.liste.length;
    if (!z) return;
    st.namen.vorschau = (st.namen.vorschau + dir + z) % z;
    renderNamen();
    const ne = alleElemente().find((e) => e.name);
    const s = ne ? seiteVon(ne.id) : st.seite;
    if (st.seite !== s) { st.seite = s; renderSeiten(); renderKappe(); } else renderDrucke();
  }

  /* =================================================================
     8. Panel-Rendering
     ================================================================= */
  const zeigeTab = (name) => geheZu(name);
  /* Tab-Inhalt sichtbar machen: Desktop scrollt das Panel innen nach oben,
     mobil wird die Seite so gescrollt, dass der Inhalt direkt unter der
     (klebenden) Bühne beginnt. */
  function panelInSicht(sanft) {
    if (window.matchMedia('(max-width: 899px)').matches) {
      const bu = $('#buehne'), pane = $('.tab.is-on');
      if (!bu || !pane) return;
      const soll = (parseFloat(getComputedStyle(bu).top) || 0) + bu.offsetHeight;
      const diff = pane.getBoundingClientRect().top - soll;
      if (Math.abs(diff) > 4) scrollTo({ top: scrollY + diff, behavior: sanft === false ? 'auto' : 'smooth' });
    } else {
      const pi = $('#panelInhalt');
      if (pi) pi.scrollTo({ top: 0, behavior: sanft === false ? 'auto' : 'smooth' });
    }
  }
  function renderModelle() {
    $('#modelle').innerHTML = REIHE.map((id) => {
      const m = MODELLE[id];
      return `<button type="button" class="mod${st.modell === id ? ' is-on' : ''}" data-modell="${id}" aria-pressed="${st.modell === id}">
        <span class="mod__pic"><img src="${m.bild}" alt="" loading="lazy" decoding="async" width="300" height="372"></span>
        <span class="mod__tag">${m.tag}</span>
        <b class="mod__name">${m.name}</b>
        <span class="mod__txt">${m.text}</span>
      </button>`;
    }).join('');
  }
  function renderFarben() {
    const liste = farbListe(st.modell);
    $('#farben').innerHTML = liste.map((nr) => {
      const f = FARBTON[nr];
      return `<button type="button" class="sw${st.farbe === nr ? ' sel' : ''}" data-farbe="${nr}" aria-label="${f[0]}" title="${f[0]}" aria-pressed="${st.farbe === nr}">
        <span class="sw__c" style="background:${f[2]}${f[3] ? ';--sw-check:#191818' : ''}"></span><span class="sw__n">${f[0]}</span></button>`;
    }).join('');
    $('#farbName').textContent = FARBTON[st.farbe] ? FARBTON[st.farbe][0] : '';
    const zusatz = !FARBEN_JUNIOR[st.modell] || st.groesse === 'erwachsene' ? ''
      : (st.groesse === 'kinder' ? ' in Kindergröße' : ', in Kinder- und Erwachsenengröße');
    $('#farbZahl').textContent = `${liste.length} Farben für ${MODELLE[st.modell].name}${zusatz}`;
  }
  function renderGroesse() {
    $$('#groesse button').forEach((b) => {
      const on = b.dataset.g === st.groesse;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on);
    });
    $('#kinderFeld').hidden = st.groesse !== 'gemischt';
    $('#kinderZahl').value = st.kinder || '';
    $('#kinderZahl').max = st.menge;
  }
  function renderSeiten() {
    $$('.seiten__btn').forEach((b) => {
      const on = b.dataset.seite === st.seite;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.classList.toggle('hat', (st.modus === 'service' ? svcFarben(b.dataset.seite) > 0 : druckElemente(b.dataset.seite).length > 0));
      /* Rückseite »wie vorne«: Tab ausgegraut, sie hat kein eigenes Motiv */
      const grau = b.dataset.seite === 'hinten' && st.modus === 'selbst' && st.rueckseite === 'gleich';
      b.classList.toggle('grau', grau);
      b.title = grau ? 'Rückseite wie vorne' : '';
    });
  }
  function renderBuehnenInfo() {
    const leer = st.modus === 'selbst' && !druckElemente('vorne').length && !druckElemente('hinten').length;
    $('#leer').hidden = !leer;
    $('#serviceHinweis').hidden = st.modus !== 'service';
    const f = FARBTON[st.farbe];
    $('#infoModell').textContent = `${MODELLE[st.modell].name} · ${f ? f[0] : ''}`;
    const p = rechne();
    $('#infoFarben').textContent = st.modus === 'service'
      ? 'Gestaltung durch MySwimcap'
      : `Druckfarben: vorne ${p.fv}, hinten ${p.fh}`;
    renderSeiten();
  }
  function farbPunkte(aktiv, attr) {
    return DRUCK.map((d) => `<button type="button" class="dot${aktiv && aktiv.toLowerCase() === d[1] ? ' is-on' : ''}" ${attr}="${d[1]}" title="${d[0]}" aria-label="${d[0]}" style="--c:${d[1]}"></button>`).join('');
  }
  function renderInspektor() {
    const box = $('#inspektor');
    const e = finde(st.auswahl);
    if (!e || st.modus !== 'selbst') { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    const s = seiteVon(e.id), andere = s === 'vorne' ? 'Rückseite' : 'Vorderseite';
    const kopf = `<div class="ins__kopf">
        <span class="ins__typ">${e.typ === 'bild' ? 'Logo' : (e.name ? 'Namen' : 'Text')} <em>${s === 'vorne' ? 'Vorderseite' : 'Rückseite'}</em></span>
        <span class="ins__aktionen">
          ${e.name ? '' : `<button type="button" class="ib" data-ins="dup" title="Duplizieren" aria-label="Duplizieren"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button>`}
          ${e.name ? '' : `<button type="button" class="ib" data-ins="seite" title="Auf ${andere}" aria-label="Auf ${andere} verschieben"><svg viewBox="0 0 24 24"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg></button>`}
          <button type="button" class="ib" data-ins="hoch" title="Nach vorne" aria-label="Eine Ebene nach vorne"><svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg></button>
          <button type="button" class="ib" data-ins="runter" title="Nach hinten" aria-label="Eine Ebene nach hinten"><svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg></button>
          <button type="button" class="ib ib--weg" data-ins="weg" title="Entfernen" aria-label="Entfernen"><svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg></button>
          <button type="button" class="ib" data-ins="zu" title="Fertig" aria-label="Auswahl aufheben"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></button>
        </span></div>`;
    let mitte = '';
    if (e.typ === 'text') {
      mitte += e.name
        ? `<p class="mini">Platzhalter für die Namen. Die Namensliste pflegst du unten bei »Individuelle Namen«.</p>`
        : `<div class="field"><label for="insText">Text</label><input id="insText" value="${esc(e.text)}" maxlength="40" autocomplete="off"></div>`;
      mitte += `<div class="ins__zeile"><span class="ins__lbl">Schrift</span><div class="schriften">${Object.keys(SCHRIFTEN).map((k) =>
        `<button type="button" class="schrift${e.schrift === k ? ' is-on' : ''}" data-schrift="${k}" style="font-family:${SCHRIFTEN[k].css};font-weight:${SCHRIFTEN[k].weight}">${istVersal(e) ? 'AA' : 'Aa'}<small>${SCHRIFTEN[k].label}</small></button>`).join('')}</div></div>`;
      const sch = SCHRIFTEN[e.schrift] || SCHRIFTEN.oswald;
      if (sch.staerke) mitte += regler('Stärke', 'staerke', staerke(e, sch), sch.staerke[0], sch.staerke[1], 100, STAERKEN[staerke(e, sch)]);
      mitte += `<label class="toggle"><input type="checkbox" data-ins-cb="versal"${istVersal(e) ? ' checked' : ''}><span class="toggle__ui"></span><span class="toggle__t"><b>Großbuchstaben</b><em>Aus: normale Schreibweise</em></span></label>`;
      mitte += `<div class="ins__zeile"><span class="ins__lbl">Druckfarbe <em>${druckName(e.farbe)}</em></span><div class="dots">${farbPunkte(e.farbe, 'data-tfarbe')}</div></div>`;
      mitte += regler('Bogen', 'bogen', e.bogen, -100, 100, 1, e.bogen === 0 ? 'gerade' : (e.bogen > 0 ? 'nach oben' : 'nach unten'));
      mitte += regler('Zeichenabstand', 'spacing', Math.round((e.spacing || 0) * 100), -30, 30, 1, Math.round((e.spacing || 0) * 100) + ' %');
    } else {
      const c = cache[e.id] || { palette: [], erkannt: [] };
      const farben = e.mono ? [druckName(e.mono)] : c.palette;
      const erkannt = c.erkannt || c.palette;
      mitte += `<div class="ins__logo"><span class="ins__thumb" style="--bg:${kappeHex()}"><img src="${c.view || e.src}" alt=""></span>
        <div><b>${esc(e.datei || 'Logo')}</b><span>${erkannt.length ? `${erkannt.length} Druckfarbe${erkannt.length > 1 ? 'n' : ''} erkannt` : 'Farben werden erkannt …'}</span>
        <span class="ins__chips">${farben.map((n) => `<i style="--c:${druckHex(n)}" title="${n}"></i>`).join('')}</span></div></div>`;
      /* Erkannte Farben einzeln umstellen oder zusammenlegen, mit Aufpreis-Hinweis */
      if (!e.mono && erkannt.length) {
        const p = rechne(), weniger = p.zeile > 1 ? preisBei(p, p.zeile - 1) : 0;
        mitte += `<div class="ins__zeile fz"><span class="ins__lbl">Druckfarben im Logo <em>${farben.length} ${farben.length === 1 ? 'Farbe' : 'Farben'} im Druck</em></span>
          ${erkannt.map((n) => {
            const ziel = e.farbMap && e.farbMap[n] ? druckName(e.farbMap[n]) : n;
            return `<label class="fz__zeile"><i class="fz__punkt" style="--c:${druckHex(n)}"></i><span class="fz__name">${n}</span>
              <svg class="fz__pfeil" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              <span class="fz__wahl"><i class="fz__punkt" style="--c:${druckHex(ziel)}"></i><select data-farbmap="${n}" aria-label="Druckfarbe für ${n}">${DRUCK.map((d) => `<option value="${d[0]}"${d[0] === ziel ? ' selected' : ''}>${d[0]}</option>`).join('')}</select></span></label>`;
          }).join('')}
          <p class="fz__hinweis">Der Preis richtet sich nach der Zahl der Druckfarben, Vorder- und Rückseite zusammen. Gerade <b>${p.zeile}-farbig: ${euro(zeig(p, p.stueck))}</b> je Kappe${weniger ? `, mit einer Farbe weniger ${euro(zeig(p, weniger))}` : ''} (bei ${p.m.toLocaleString('de-DE')} Stück). Gebt zwei Farben dieselbe Druckfarbe, um sie zusammenzulegen.${e.farbMap ? ' <button type="button" class="linkbtn" data-ins="farbreset">Erkannte Farben wiederherstellen</button>' : ''}</p></div>`;
      }
      if (c.viele) mitte += `<p class="hinweis hinweis--warn">Mehr als 6 Farben oder Verläufe erkannt. Wir prüfen das beim Druck-Check und schlagen euch eine Lösung vor (meist einfarbig oder Digitaldruck).</p>`;
      if (e.hgErkannt || e.ohneHg) {
        mitte += `<label class="toggle"><input type="checkbox" data-ins-cb="ohneHg"${e.ohneHg ? ' checked' : ''}><span class="toggle__ui"></span><span class="toggle__t"><b>Hintergrund entfernen</b><em>Für Logos mit weißem Kasten</em></span></label>`;
        if (e.ohneHg) {
          const tol = e.hgTol === undefined ? HG_STANDARD : e.hgTol;
          mitte += regler('Schwellenwert', 'hgTol', tol, 0, 100, 1, tol + ' %');
          mitte += `<p class="mini ins__tipp">Bleibt ein heller Rand stehen, Wert erhöhen. Fehlen Teile vom Logo, Wert senken.</p>`;
        }
      }
      mitte += `<label class="toggle"><input type="checkbox" data-ins-cb="mono"${e.mono ? ' checked' : ''}><span class="toggle__ui"></span><span class="toggle__t"><b>Einfarbig drucken</b><em>Günstiger: nur eine Druckfarbe</em></span></label>`;
      if (e.mono) mitte += `<div class="dots dots--einzug">${farbPunkte(e.mono, 'data-mfarbe')}</div>`;
    }
    mitte += regler('Größe', 's', Math.round(e.s * 100), 15, 400, 1, Math.round(e.s * 100) + ' %');
    mitte += regler('Drehung', 'r', e.r, -180, 180, 1, e.r + '°');
    mitte += `<div class="ins__fuss"><button type="button" class="linkbtn" data-ins="mitte">Horizontal zentrieren</button></div>`;
    box.innerHTML = kopf + mitte;
  }
  /* Schwellenwert live anwenden. Beim Ziehen läuft höchstens eine Aufbereitung
     gleichzeitig, der Regler wird erst nach dem Loslassen neu gebaut. */
  let freiLauf = null, freiNochmal = false, freiFertig = false;
  function freistellenBald(e, fertig) {
    if (fertig) freiFertig = true;
    if (freiLauf) { freiNochmal = true; return; }
    freiLauf = verarbeite(e).then(() => {
      freiLauf = null;
      renderDrucke();
      const bild = $('.ins__thumb img', $('#inspektor'));
      if (bild && cache[e.id]) bild.src = cache[e.id].view;
      if (freiNochmal) { freiNochmal = false; freistellenBald(e); return; }
      if (freiFertig) { freiFertig = false; renderInspektor(); renderPreis(); commit(); }
    });
  }
  function regler(label, key, wert, min, max, step, anzeige) {
    return `<div class="regler"><label><span>${label}</span><output data-out="${key}">${anzeige}</output></label>
      <input type="range" data-regler="${key}" min="${min}" max="${max}" step="${step}" value="${wert}" aria-label="${label}"></div>`;
  }
  function renderEbenen() {
    const box = $('#ebenen');
    if (st.modus !== 'selbst') { box.innerHTML = ''; return; }
    const zeile = (e, s) => {
      const label = e.typ === 'bild' ? (e.datei || 'Logo') : (e.name ? 'Namen (je Kappe)' : (e.text || 'Text'));
      return `<button type="button" class="ebene${st.auswahl === e.id ? ' is-on' : ''}" data-ebene="${e.id}">
        <span class="ebene__ic">${e.typ === 'bild' ? '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 16l5-5 4 4 3-3 6 6"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M5 6V4h14v2M12 4v16M9 20h6"/></svg>'}</span>
        <span class="ebene__t">${esc(label)}</span><span class="ebene__s">${s === 'vorne' ? 'Vorne' : 'Hinten'}</span></button>`;
    };
    const v = st.elemente.vorne.map((e) => zeile(e, 'vorne')).join('');
    const h = st.rueckseite === 'eigen' ? st.elemente.hinten.map((e) => zeile(e, 'hinten')).join('') : '';
    box.innerHTML = (v || h) ? `<div class="pt pt--klein">Elemente</div>${v}${h}` : '';
  }
  function renderNamen() {
    const n = st.namen;
    $('#namenAn').checked = n.aktiv;
    $('#namenInhalt').hidden = !n.aktiv;
    $('#namenPreis').textContent = 'Preis nennen wir im Angebot';
    const ta = $('#namenListe');
    if (document.activeElement !== ta) ta.value = n.liste.join('\n');
    const z = n.liste.length;
    let t = `${z} Name${z === 1 ? '' : 'n'}`;
    if (z && z < st.menge) t += ` · ${st.menge - z} Kappen ohne Namen`;
    if (z > st.menge) t += ' · mehr Namen als Kappen';
    $('#namenZahl').textContent = t;
    $('#nAkt').textContent = z ? n.liste[clamp(n.vorschau, 0, z - 1)] : 'Vorschau';
  }
  function renderService() {
    const s = st.service;
    $('#svcNotiz').value === s.notiz || ($('#svcNotiz').value = s.notiz);
    $('#svcDatei').hidden = !s.datei;
    $('#svcDatei').innerHTML = s.datei ? `<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg><b>${esc(s.datei)}</b><button type="button" class="linkbtn" data-aktion="svc-weg">Entfernen</button>` : '';
    ['vorne', 'hinten'].forEach((k) => { $(`[data-svc-zahl="${k}"]`).textContent = s.farben[k]; });
    /* Rückseite: eigener Zähler nur bei eigenem Motiv */
    const eigen = st.rueckseite === 'eigen';
    $('[data-svc-row="hinten"]').classList.toggle('fest', !eigen);
    $('[data-svc-info="hinten"]').textContent = eigen ? 'Farben' : (st.rueckseite === 'gleich' ? 'wie vorne' : 'unbedruckt');
  }
  function renderModus() {
    $$('.mk__btn').forEach((b) => {
      const on = b.dataset.modus === st.modus;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    $('#designSelbst').hidden = st.modus !== 'selbst';
    $('#designService').hidden = st.modus !== 'service';
    $('[data-step="design"] span').textContent = st.modus === 'selbst' ? 'Gestalten' : 'Euer Motiv';
    document.body.classList.toggle('modus-service', st.modus === 'service');
    if (st.modus === 'service') st.auswahl = null;
    renderService();
    renderInspektor();
    renderEbenen();
    renderDrucke();
  }
  function renderMenge() {
    const m = st.menge;
    const inp = $('#menge');
    if (document.activeElement !== inp) inp.value = m;
    $$('#mengeChips .chip').forEach((c) => c.classList.toggle('sel', +c.dataset.m === m));
    const p = rechne();
    $('#staffel').innerHTML = `<table><thead><tr><th>Menge</th><th>pro Kappe</th><th>Ersparnis</th></tr></thead><tbody>${PREIS.staffeln.map((s, i) => {
      const q = rechne({ menge: s });
      const spar = i === 0 ? '' : Math.round((1 - q.stueck / rechne({ menge: PREIS.staffeln[0] }).stueck) * 100) + ' %';
      return `<tr class="${p.t === i ? 'is-on' : ''}"><td>ab ${s.toLocaleString('de-DE')}</td><td>${euro(zeig(null, q.stueck))}</td><td>${spar ? '−' + spar : ''}</td></tr>`;
    }).join('')}</tbody></table>`;
    const nx = PREIS.staffeln[p.t + 1];
    const hin = $('#naechsteStufe');
    if (nx) {
      const q = rechne({ menge: nx });
      hin.hidden = false;
      hin.innerHTML = `Noch <b>${nx - m}</b> Kappen bis zum nächsten Staffelpreis: dann <b>${euro(zeig(null, q.stueck))}</b> statt ${euro(zeig(null, p.stueck))} pro Kappe. <button type="button" class="linkbtn" data-menge-setzen="${nx}">Auf ${nx} erhöhen</button>`;
    } else hin.hidden = true;
    const l = lieferung();
    $('#lieferText').innerHTML = `Fertig in <b>${l.text}</b> nach eurer Freigabe. Voraussichtlich bei euch bis <b>KW ${kw(l.datum)}</b> (${datumLang(l.datum)}). Ihr braucht die Kappen früher? Schreibt es in die Hinweise zum Angebot.`;
  }
  function renderPreis() {
    const p = rechne();
    const basis = st.netto ? p.netto : p.brutto;
    $('#pGesamt').textContent = euro(basis);
    const proStk = basis / p.m;
    $('#pUnter').textContent = `${euro(proStk)} pro Kappe · ${p.m.toLocaleString('de-DE')} Stück · ${st.netto ? 'zzgl. 19 % MwSt.' : 'inkl. 19 % MwSt.'}`;
    $$('.nb button').forEach((b) => b.classList.toggle('is-on', (b.dataset.nb === 'netto') === st.netto));
    const seiten = p.fh ? `vorne ${p.fv}, hinten ${p.fh}` : 'nur vorne';
    let html = `<div class="pz pz--klein"><span>Pro Kappe</span><span></span></div>`;
    html += `<div class="pz"><span>${MODELLE[st.modell].name}, ${p.zeile}-farbiger Druck (${seiten})</span><span>${euro(zeig(p, p.stueck))}</span></div>`;
    if (p.ueber) html += `<div class="pz"><span>Mehr als ${PREIS.maxFarben} Druckfarben (${p.farben})</span><span>im Angebot</span></div>`;
    if (p.namen) html += `<div class="pz"><span>Individuelle Namen</span><span>im Angebot</span></div>`;
    html += `<div class="pz pz--summe"><span>${euro(zeig(p, p.stueck))} × ${p.m.toLocaleString('de-DE')} Stück</span><span>${euro(basis)}</span></div>`;
    html += `<div class="pz pz--total"><span>Gesamt netto</span><span>${euro(p.netto)}</span></div>`;
    html += `<div class="pz"><span>zzgl. 19 % MwSt.</span><span>${euro(p.mwst)}</span></div>`;
    html += `<div class="pz pz--total"><span>Gesamt brutto</span><span>${euro(p.brutto)}</span></div>`;
    html += `<p class="pz-note">${p.farben > 1 ? 'Weniger Druckfarben senken den Preis: Im Schritt Gestalten könnt ihr Logofarben zusammenlegen. ' : ''}Versandkosten nennen wir im Angebot.</p>`;
    $('#pZeilen').innerHTML = html;
    const l = lieferung();
    $('#pLiefer').innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg><span>Lieferung bis ca. <b>KW ${kw(l.datum)}</b> · ${l.text} nach Freigabe</span>`;
    $('#mbarSumme').textContent = euro(basis);
    $('#mbarStk').textContent = `${euro(proStk)} / Kappe · ${st.netto ? 'netto' : 'brutto'}`;
    if (st.modus !== 'service') $('#infoFarben').textContent = `Druckfarben: vorne ${p.fv}, hinten ${p.fh}`;
  }
  function renderVerlaufBtns() {
    $('#btnUndo').disabled = verlauf.length < 2;
    $('#btnRedo').disabled = !zukunft.length;
  }
  function renderAlles() {
    renderModus();
    renderModelle();
    renderFarben();
    renderGroesse();
    renderSeiten();
    renderKappe();
    renderInspektor();
    renderEbenen();
    renderNamen();
    renderMenge();
    renderPreis();
    renderVerlaufBtns();
    renderSchritte();
    $('#btnBereich').setAttribute('aria-pressed', st.druckbereich ? 'true' : 'false');
  }

  /* =================================================================
     9. Kasse, Bestätigung, Angebot
     ================================================================= */
  function designOk(leise) {
    const nein = (msg) => {
      if (!leise) { toast(msg); zeigeTab('design'); }
      return false;
    };
    if (st.modus === 'service') {
      if (!st.service.datei && !st.service.notiz.trim()) return nein('Lad euer Logo hoch oder beschreib kurz, was auf die Kappe soll.');
      return true;
    }
    if (!druckElemente('vorne').concat(druckElemente('hinten')).some((e) => !e.name) && !st.namen.aktiv) {
      return nein('Füg zuerst ein Logo oder einen Text hinzu. Oder wähl oben »Ihr gestaltet für uns«.');
    }
    return true;
  }
  function konfigZeilen() {
    const f = FARBTON[st.farbe];
    const p = rechne();
    const groesse = st.groesse === 'gemischt'
      ? `Gemischt (${st.menge - (st.kinder || 0)} Erwachsene, ${st.kinder || 0} Kinder)`
      : (st.groesse === 'kinder' ? 'Kinder' : 'Erwachsene');
    const seite = (s) => {
      if (st.modus === 'service') {
        const n = svcFarben(s);
        if (!n) return 'unbedruckt';
        return (s === 'hinten' && st.rueckseite === 'gleich' ? 'wie Vorderseite · ' : '') + `${n} Druckfarbe${n > 1 ? 'n' : ''} (geschätzt)`;
      }
      const els = druckElemente(s);
      if (!els.length) return 'unbedruckt';
      const n = farbenSeite(s).length;
      const farben = n ? ` · ${n} Druckfarbe${n > 1 ? 'n' : ''}` : '';
      if (s === 'hinten' && st.rueckseite === 'gleich') return 'wie Vorderseite' + farben;
      const schrift = (e) => ` (${schriftName(e)})`;
      const teile = els.map((e) => (e.typ === 'bild' ? 'Logo' : (e.name ? 'Namen' : `»${textInhalt(e)}«`) + schrift(e)));
      return teile.join(', ') + farben;
    };
    return [
      ['Modell', MODELLE[st.modell].name],
      ['Kappenfarbe', f ? f[0] : ''],
      ['Größe', groesse],
      ['Menge', `${p.m.toLocaleString('de-DE')} Stück`],
      ['Vorderseite', seite('vorne')],
      ['Rückseite', seite('hinten')],
      ['Namen', st.namen.aktiv ? `Ja, ${st.namen.liste.length || 'Liste folgt'}${st.namen.liste.length ? ' Namen' : ''}` : 'Nein'],
      ['Gestaltung', st.modus === 'service' ? 'Durch MySwimcap (kostenlos)' : 'Selbst gestaltet, mit Druck-Check'],
      ['Produktion', `${lieferung().text} nach Freigabe`]
    ];
  }
  function renderKasse() {
    const p = rechne();
    const mock = $('#kasseMock');
    mock.innerHTML = '';
    ['vorne', 'hinten'].forEach((s) => {
      const fig = document.createElement('figure');
      fig.appendChild(statischeKappe(s));
      const cap = document.createElement('figcaption');
      cap.textContent = s === 'vorne' ? 'Vorderseite' : 'Rückseite';
      fig.appendChild(cap);
      mock.appendChild(fig);
    });
    $('#kasseKonfig').innerHTML = konfigZeilen().map((z) => `<div><dt>${z[0]}</dt><dd>${esc(z[1])}</dd></div>`).join('');
    $('#kasseZeilen').innerHTML = `
      <div class="pz"><span>${euro(p.stueck)} × ${p.m.toLocaleString('de-DE')} Stück, ${p.zeile}-farbig</span><span>${euro(p.brutto)}</span></div>
      <div class="pz"><span>darin 19 % MwSt.</span><span>${euro(p.mwst)}</span></div>
      ${p.ueber ? `<div class="pz"><span>Mehr als ${PREIS.maxFarben} Druckfarben</span><span>im Angebot</span></div>` : ''}
      ${p.namen ? '<div class="pz"><span>Individuelle Namen</span><span>im Angebot</span></div>' : ''}
      <div class="pz"><span>Versand</span><span>im Angebot</span></div>
      <div class="pz pz--gross"><span>Preisvorschlag brutto</span><span>${euro(p.brutto)}</span></div>`;
    $('#kasseSumMobil').textContent = euro(p.brutto);
    $('#kasseWarn').hidden = !(st.modus === 'selbst' && kasseWarnung);
    const min = new Date();
    min.setDate(min.getDate() + lieferung().wochen * 7 + 2);
    const di = $('#kTermin');
    di.min = `${min.getFullYear()}-${String(min.getMonth() + 1).padStart(2, '0')}-${String(min.getDate()).padStart(2, '0')}`;
    $('#kTerminHinweis').textContent = `Frühester Liefertermin: ${datumKurz(min)}. Feste Wettkampftermine bitte unten notieren.`;
  }
  /* Druckbereich für beide Seiten prüfen, solange die Bühne noch sichtbar ist
     (ausgeblendete SVGs liefern keine Maße). */
  let kasseWarnung = false;
  function bereichBeideSeiten() {
    const orig = st.seite, res = {};
    ['vorne', 'hinten'].forEach((s) => {
      if (st.modus !== 'selbst' || !druckElemente(s).length) { res[s] = false; return; }
      if (st.seite !== s) { st.seite = s; renderKappe(); }
      res[s] = druckElemente(s).some(ausserhalb);
    });
    if (st.seite !== orig) { st.seite = orig; renderKappe(); }
    return res;
  }

  /* ---------- Schritte: 1 Modell · 2 Farbe · 3 Gestalten · 4 Menge & Preis · 5 Angebot ---------- */
  const SCHRITTE = ['modell', 'farbe', 'design', 'menge', 'kasse'];
  const HASH = { modell: '', farbe: '#farbe', design: '#gestalten', menge: '#menge', kasse: '#kasse', fertig: '#fertig' };
  const WEITER = { modell: 'Weiter: Kappenfarbe', farbe: 'Weiter: Gestalten', design: 'Weiter: Menge & Preis' };
  const VORHER = { farbe: 'modell', design: 'farbe' };
  function geheZu(ziel, ohneVerlauf) {
    if ((ziel === 'menge' || ziel === 'kasse') && !designOk()) return;
    const war = st.tab;
    const istApp = ziel === 'modell' || ziel === 'farbe' || ziel === 'design';
    /* Druckbereich messen, solange die Bühne noch sichtbar ist */
    if (!istApp && !$('#app').hidden) {
      const w = bereichBeideSeiten();
      kasseWarnung = w.vorne || w.hinten;
    }
    st.tab = ziel;
    document.body.dataset.schritt = ziel;
    $('#cfgKopf').hidden = ziel !== 'modell';
    $('#app').hidden = !istApp;
    $('#cfgInfo').hidden = !(ziel === 'modell' || ziel === 'menge');
    $('#mengeSeite').hidden = ziel !== 'menge';
    $('#kasse').hidden = ziel !== 'kasse';
    $('#fertig').hidden = ziel !== 'fertig';
    $('#stepbar').hidden = ziel === 'fertig';
    document.body.classList.toggle('route-kasse', ziel === 'kasse' || ziel === 'fertig');
    $$('.tab').forEach((t) => t.classList.toggle('is-on', t.dataset.pane === ziel));
    renderSchritte();
    if (ziel === 'menge') renderMengeSeite();
    if (ziel === 'kasse') renderKasse();
    if (!ohneVerlauf && war !== ziel) history.pushState({ r: ziel }, '', HASH[ziel] || location.pathname + location.search);
    if (war !== ziel) scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    if (istApp) {
      requestAnimationFrame(() => renderDrucke());
      if (war !== ziel) $('#panelInhalt').scrollTop = 0;
    }
  }
  function renderSchritte() {
    const i = SCHRITTE.indexOf(st.tab);
    $$('.step').forEach((b) => {
      const k = SCHRITTE.indexOf(b.dataset.step);
      b.classList.toggle('is-on', k === i);
      b.classList.toggle('ok', i >= 0 && k < i);
      if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    const weiter = WEITER[st.tab];
    if (weiter) { setBtnText($('#btnWeiter'), weiter); setBtnText($('#mbarWeiter'), weiter); }
    $('#btnZurueck').hidden = !VORHER[st.tab];
    $('#mbarZurueck').hidden = !VORHER[st.tab];
  }
  function schrittWeiter() { geheZu(SCHRITTE[SCHRITTE.indexOf(st.tab) + 1] || 'menge'); }
  const schrittZurueck = () => geheZu(VORHER[st.tab] || 'modell');
  function zurKasse() { geheZu('kasse'); }
  function renderMengeSeite() {
    const mock = $('#mgMock');
    mock.innerHTML = '';
    ['vorne', 'hinten'].forEach((s) => {
      const fig = document.createElement('figure');
      fig.appendChild(statischeKappe(s));
      const cap = document.createElement('figcaption');
      cap.textContent = s === 'vorne' ? 'Vorne' : 'Hinten';
      fig.appendChild(cap);
      mock.appendChild(fig);
    });
    const f = FARBTON[st.farbe];
    $('#mgTitel').textContent = `${MODELLE[st.modell].name} · ${f ? f[0] : ''}`;
    const z = konfigZeilen().filter((r) => ['Vorderseite', 'Rückseite', 'Namen', 'Gestaltung'].indexOf(r[0]) >= 0);
    $('#mgKonfig').innerHTML = z.map((r) => `<div><dt>${r[0]}</dt><dd>${esc(r[1])}</dd></div>`).join('');
    const svc = st.modus === 'service';
    $('#mgEntwurfT').textContent = svc ? 'Erst nur den Entwurf sehen?' : 'Lieber gestalten lassen?';
    $('#mgEntwurfS').textContent = svc
      ? 'Ihr könnt den kostenlosen Entwurf auch ohne Bestellung anfragen. Unverbindlich, meist innerhalb von 48 Stunden.'
      : 'Wir machen euch auch gerne einen kostenlosen Entwurf. Unverbindlich, meist innerhalb von 48 Stunden.';
    renderMenge();
    renderPreis();
  }
  function pruefeKasse() {
    const f = $('#kasseForm');
    let ok = true, erstes = null;
    $$('[required]', f).forEach((i) => {
      if (i.closest('[hidden]')) return;
      let gut = i.type === 'checkbox' ? i.checked : !!i.value.trim();
      if (gut && i.type === 'email') gut = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value.trim());
      if (gut && i.name === 'plz') gut = /^\d{4,5}$/.test(i.value.trim());
      const feld = i.closest('.field') || i.closest('label');
      if (feld) feld.classList.toggle('fehler', !gut);
      if (!gut) { ok = false; if (!erstes) erstes = i; }
    });
    if (erstes) {
      erstes.focus({ preventScroll: true });
      erstes.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast('Bitte prüf die markierten Felder.');
    }
    return ok;
  }
  /* Angebotsanfrage: Grundfelder wie beim Anfrage-Wizard der Startseite
     (index.html, submit()), dazu Preis, Telefon und das Übersichts-PDF.
     Eigenes Make-Szenario, damit das Wizard-Szenario unberührt bleibt. */
  const ANFRAGE_HOOK = 'https://hook.eu2.make.com/rod9ziiibckh81oaaqeyh7qr5er9og7m'; // Make: »MySwimcap | Konfigurator → Mail + PDF«
  function anfrageDaten() {
    const p = rechne(), f = FARBTON[st.farbe];
    const tel = $('#kTel').value.trim(), hinweis = $('#kNotiz').value.trim();
    const namen = st.namen.liste;
    const notiz = [
      ISTPROD ? '' : '[Staging-Test]',
      'Angebotsanfrage aus dem Online-Konfigurator.',
      `Preisvorschlag: ${euro(p.brutto)} brutto (${euro(p.netto)} netto), ${euro(p.stueck)} je Kappe brutto bei ${p.m.toLocaleString('de-DE')} Stück, ${p.zeile}-farbig (vorne ${p.fv}, hinten ${p.fh})${p.ueber ? `, eigentlich ${p.farben} Farben: Preis im Angebot` : ''}${p.namen ? ', Namen: Preis im Angebot' : ''}.`,
      konfigZeilen().map((z) => `${z[0]}: ${z[1]}`).join(' · '),
      st.modus === 'service' && st.service.notiz ? 'Wünsche: ' + st.service.notiz : '',
      st.namen.aktiv && namen.length ? `Namensliste (${namen.length}): ${namen.join(', ').slice(0, 1500)}` : '',
      tel ? 'Telefon: ' + tel : '',
      hinweis ? 'Hinweise: ' + hinweis : ''
    ].filter(Boolean).join('\n');
    return {
      termin: $('#kTermin').value || '', verein: $('#kVerein').value.trim(), name: $('#kName').value.trim(),
      notiz: notiz.slice(0, 4000), email: $('#kEmail').value.trim(), dsgvo: 'on',
      modell: MODELLE[st.modell].wizard, kappenfarbe: f ? f[0] : '', menge: mengenBand(p.m),
      farben: farbenBand(p.farben), namen: st.namen.aktiv ? 'Ja, mit Namen' : 'Nein',
      logo: '(keins)', sprache: 'de', logo_url: '',
      /* Zusätzlich für das Konfigurator-Szenario in Make */
      quelle: 'konfigurator', telefon: tel, hinweise: hinweis, stueck: p.m,
      termin_text: $('#kTermin').value ? datumKurz(new Date($('#kTermin').value + 'T12:00')) : 'kein fester Termin',
      preis: `${euro(p.brutto)} brutto · ${euro(p.stueck)} je Kappe · ${p.m.toLocaleString('de-DE')} Stück · ${p.zeile}-farbig${p.ueber || p.namen ? ' · Rest im Angebot' : ''}`
    };
  }
  function belegNr(praefix) {
    const d = new Date(), zwei = (n) => String(n).padStart(2, '0');
    return `${praefix}-${String(d.getFullYear()).slice(2)}${zwei(d.getMonth() + 1)}${zwei(d.getDate())}-${Math.floor(100 + Math.random() * 899)}`;
  }
  function anfrageSenden(ev) {
    ev.preventDefault();
    if (!pruefeKasse()) return;
    const btn = $('#kasseSenden');
    btn.disabled = true;
    setBtnText(btn, 'Wird gesendet …');
    const daten = anfrageDaten();
    daten.anfrage_nr = belegNr('A');
    const zuruecksetzen = () => { btn.disabled = false; setBtnText(btn, 'Angebot anfordern'); };
    logoHochladen().then((url) => {
      if (url) { daten.logo = url; daten.logo_url = url; }
      /* Ohne PDF oder Bild geht die Anfrage trotzdem raus, Make nimmt dann den Weg ohne Anhang */
      return Promise.all([
        teamPdf(daten, daten.anfrage_nr).then((pdf) => { daten.pdf_base64 = pdf.base64; daten.pdf_name = pdf.name; }, () => {}),
        designBild().then((b) => { daten.bild_base64 = b; daten.bild_name = 'kappe-design.jpg'; }, () => {})
      ]);
    }).then(() => fetch(ANFRAGE_HOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten) })).then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      zuruecksetzen();
      fertigZeigen(daten);
    }).catch(() => {
      zuruecksetzen();
      toast('Senden hat nicht geklappt. Versuch es bitte noch einmal oder schreib an info@my-swimcap.de.');
    });
  }
  function fertigZeigen(daten) {
    $('#bestMail').textContent = daten.email;
    const mock = $('#fertigMock');
    mock.innerHTML = '';
    mock.appendChild(statischeKappe('vorne', 'kappe-mini kappe-mini--gross'));
    const heute = new Date(), l = lieferung();
    const plus = (t) => { const d = new Date(heute); d.setDate(d.getDate() + t); return d; };
    const schritte = [
      ['Anfrage eingegangen', `Heute, ${datumLang(heute)}`, true],
      ['Druck-Check', 'Wir prüfen Logo, Druckfarben und Druckbereich', false],
      ['Verbindliches Angebot', `bis ${datumLang(plus(2))} per Mail, mit finalem Entwurf`, false],
      ['Eure Freigabe', 'Erst mit eurer Zusage wird bestellt und gedruckt', false],
      ['Produktion und Lieferung', `${l.text} nach Freigabe, mit Sendungsverfolgung`, false]
    ];
    $('#timeline').innerHTML = schritte.map((s, i) => `<li class="${s[2] ? 'ok' : ''}"><i>${s[2] ? '✓' : i + 1}</i><div><b>${s[0]}</b><span>${s[1]}</span></div></li>`).join('');
    $('#fertigDemo').hidden = ISTPROD;
    window.__anfrage = { verein: daten.verein, name: daten.name, mail: daten.email };
    geheZu('fertig');
  }

  /* ---------- Druckansicht: Preisvorschlag (PDF über den Druckdialog) ---------- */
  function druckDokument(kunde) {
    const p = rechne();
    const heute = new Date();
    const gueltig = new Date(); gueltig.setDate(gueltig.getDate() + 30);
    const nr = belegNr('P');
    const logo = $('.nav .brand__logo') ? $('.nav .brand__logo').outerHTML : '<b>MySwimcap</b>';
    const d = $('#druck');
    const zeilen = [[1, `Badekappe ${MODELLE[st.modell].name}, ${FARBTON[st.farbe] ? FARBTON[st.farbe][0] : ''}, ${p.zeile}-farbig bedruckt laut Entwurf`, p.m, euro(p.stueck), euro(p.brutto)]];
    if (p.ueber) zeilen.push([2, `Mehr als ${PREIS.maxFarben} Druckfarben (${p.farben})`, p.m, 'im Angebot', '']);
    if (p.namen) zeilen.push([zeilen.length + 1, 'Individuelle Namen', p.m, 'im Angebot', '']);
    zeilen.push([zeilen.length + 1, 'Versand', 1, 'im Angebot', '']);
    d.innerHTML = `
      <div class="doc">
        <header class="doc__kopf">${logo}<div class="doc__absender">ssM swimsportMedia GmbH<br>Elsterstraße 65 · 04109 Leipzig<br>info@my-swimcap.de · my-swimcap.de</div></header>
        <div class="doc__titel"><div><h1>Preisvorschlag</h1>
          <p>Nr. ${nr} · ${datumKurz(heute)} · unverbindlich, gültig bis ${datumKurz(gueltig)}</p></div>
          <div class="doc__fuer">${kunde.verein ? `<b>${esc(kunde.verein)}</b><br>` : ''}${kunde.name ? esc(kunde.name) + '<br>' : ''}${kunde.mail ? esc(kunde.mail) : ''}</div></div>
        <div class="doc__mock" id="docMock"></div>
        <h2>Eure Konfiguration</h2>
        <dl class="doc__konfig">${konfigZeilen().map((z) => `<div><dt>${z[0]}</dt><dd>${esc(z[1])}</dd></div>`).join('')}</dl>
        <h2>Preis</h2>
        <table class="doc__tab"><thead><tr><th>Pos.</th><th>Beschreibung</th><th>Menge</th><th>Einzelpreis</th><th>Gesamt</th></tr></thead><tbody>
          ${zeilen.map((z) => `<tr><td>${z[0]}</td><td>${esc(z[1])}</td><td>${z[2].toLocaleString('de-DE')}</td><td>${z[3]}</td><td>${z[4]}</td></tr>`).join('')}
        </tbody><tfoot>
          <tr><td colspan="4">Summe netto</td><td>${euro(p.netto)}</td></tr>
          <tr><td colspan="4">zzgl. 19 % MwSt.</td><td>${euro(p.mwst)}</td></tr>
          <tr class="doc__summe"><td colspan="4">Gesamtbetrag brutto</td><td>${euro(p.brutto)}</td></tr>
        </tfoot></table>
        <div class="doc__tipp"><b>Preisvorschlag, Änderungen vorbehalten.</b> Den endgültigen Preis bestätigen wir nach dem Druck-Check mit dem verbindlichen Angebot. Er kann sich ändern, wenn das Logo andere Druckfarben braucht als erkannt oder für den Druck noch überarbeitet werden muss.</div>
        <h2>So geht es weiter</h2>
        <ol class="doc__schritte"><li>Angebot anfordern unter my-swimcap.de/gestalten (der Entwurf ist dort in diesem Browser gespeichert) oder per Mail an info@my-swimcap.de.</li>
          <li>Wir prüfen euren Entwurf und schicken das verbindliche Angebot mit finalem Proof.</li>
          <li>Gedruckt wird erst nach eurer Freigabe. Produktion im Siebdruck in Europa, Lieferung ${lieferung().text} nach Freigabe.</li></ol>
        <footer class="doc__fuss">ssM swimsportMedia GmbH · Elsterstraße 65 · 04109 Leipzig · GF Sebastian Schwenke · HRB 30212 · USt-IdNr. DE294075404</footer>
      </div>`;
    const mock = $('#docMock');
    ['vorne', 'hinten'].forEach((s) => {
      const fig = document.createElement('figure');
      fig.appendChild(statischeKappe(s, 'kappe-doc'));
      const c = document.createElement('figcaption');
      c.textContent = s === 'vorne' ? 'Vorderseite' : 'Rückseite';
      fig.appendChild(c);
      mock.appendChild(fig);
    });
    document.documentElement.classList.add('druckt');
    const alt = document.title;
    document.title = `Preisvorschlag MySwimcap ${nr}`;
    const fertig = () => {
      document.documentElement.classList.remove('druckt');
      document.title = alt;
      removeEventListener('afterprint', fertig);
    };
    addEventListener('afterprint', fertig);
    setTimeout(() => { window.print(); setTimeout(fertig, 1500); }, 120);
  }

  /* ---------- Übersichtsblatt fürs Team: PDF als Anhang der Anfrage ----------
     Enthält alles, was wir zum Druck-Check brauchen: Kunde, beide Seiten als
     Bild, Konfiguration, jedes Druckelement mit Schrift und Farben, Namensliste
     und den Preisvorschlag. jsPDF liegt selbst gehostet unter /js und wird erst
     beim Absenden geladen. */
  let jspdfLaden = null;
  function ladeJsPdf() {
    if (window.jspdf) return Promise.resolve(window.jspdf.jsPDF);
    if (!jspdfLaden) {
      jspdfLaden = new Promise((ok, fail) => {
        const s = document.createElement('script');
        s.src = '/js/jspdf.umd.min.js';
        s.onload = () => (window.jspdf ? ok(window.jspdf.jsPDF) : fail(new Error('jsPDF fehlt')));
        s.onerror = () => { jspdfLaden = null; fail(new Error('jsPDF lädt nicht')); };
        document.head.appendChild(s);
      });
    }
    return jspdfLaden;
  }
  /* Webfonts der Druckschriften, damit sie im Kappenbild nicht auf Ersatz fallen */
  const SCHRIFT_DATEI = {
    Oswald: 'oswald-700-latin', Anton: 'anton-400-latin', Graduate: 'graduate-400-latin', Unbounded: 'unbounded-var-latin',
    'Dela Gothic One': 'dela-gothic-one-400-latin', Sansation: 'sansation-700-latin', 'Overused Grotesk': 'overused-grotesk-600-latin',
    Jost: 'jost-700-latin', Gelasio: 'gelasio-700-latin'
  };
  const alsDataUrl = (url) => fetch(url).then((r) => r.blob()).then((b) => new Promise((ok) => {
    const fr = new FileReader();
    fr.onload = () => ok(fr.result);
    fr.readAsDataURL(b);
  }));
  /* Kappe als Canvas. Ein SVG als Bild darf nichts nachladen, deshalb werden
     Logos und Schriften vorher als data:-URL eingebettet. */
  function kappeAlsCanvas(seite, px, grund) {
    const s = statischeKappe(seite, 'kappe-doc');
    const h = Math.round(px * 560 / 600);
    s.setAttribute('xmlns', NS);
    s.setAttribute('width', px);
    s.setAttribute('height', h);
    const bilder = $$('image', s).map((im) => {
      const href = im.getAttribute('href') || im.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '';
      return href && !href.startsWith('data:') ? alsDataUrl(href).then((d) => setHref(im, d)) : null;
    }).filter(Boolean);
    const familien = new Set();
    $$('text', s).forEach((t) => (t.getAttribute('font-family') || '').split(',').forEach((f) => {
      f = f.replace(/['"]/g, '').trim();
      if (SCHRIFT_DATEI[f]) familien.add(f);
    }));
    const css = Array.from(familien).map((f) => alsDataUrl(`/fonts/${SCHRIFT_DATEI[f]}.woff2`)
      .then((d) => `@font-face{font-family:'${f}';font-weight:100 900;src:url(${d}) format('woff2')}`));
    return Promise.all([Promise.all(bilder), Promise.all(css)]).then((r) => {
      if (r[1].length) {
        const stil = document.createElementNS(NS, 'style');
        stil.textContent = r[1].join('');
        s.insertBefore(stil, s.firstChild);
      }
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(s));
      return new Promise((ok, fail) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = px;
          c.height = h;
          const x = c.getContext('2d');
          x.fillStyle = grund || '#ffffff';
          x.fillRect(0, 0, px, h);
          /* Schriften im SVG-Bild brauchen einen Moment, sonst fehlt der Text */
          setTimeout(() => { x.drawImage(img, 0, 0, px, h); ok(c); }, 60);
        };
        img.onerror = () => fail(new Error('Kappenbild'));
        img.src = url;
      });
    });
  }
  const kappeAlsBild = (seite, px) => kappeAlsCanvas(seite, px).then((c) => c.toDataURL('image/jpeg', 0.88));
  /* Das fertige Design für die Bestätigungsmail: bedruckte Seiten nebeneinander */
  function designBild() {
    const hinten = st.rueckseite !== 'leer';
    const px = 520, luft = 20, grund = '#f7f7f2';
    return Promise.all((hinten ? ['vorne', 'hinten'] : ['vorne']).map((s) => kappeAlsCanvas(s, px, grund))).then((bilder) => {
      const c = document.createElement('canvas');
      c.width = bilder.length * px + (bilder.length - 1) * luft;
      c.height = bilder[0].height;
      const x = c.getContext('2d');
      x.fillStyle = grund;
      x.fillRect(0, 0, c.width, c.height);
      bilder.forEach((b, i) => x.drawImage(b, i * (px + luft), 0));
      return c.toDataURL('image/jpeg', 0.86).split(',')[1];
    });
  }
  function elementBeschreibung(e) {
    const gr = `Größe ${Math.round(e.s * 100)}\u00a0%`, dreh = e.r ? `Drehung ${Math.round(e.r)}°` : '';
    if (e.typ === 'bild') {
      const c = cache[e.id] || {};
      const erkannt = c.erkannt || c.palette || [];
      const map = e.farbMap ? Object.keys(e.farbMap).map((n) => `${n} > ${druckName(e.farbMap[n])}`) : [];
      return [`Logo »${e.datei || 'Logo'}«${e.beispiel ? ' (Beispiel-Logo)' : ''}`, [
        e.mono ? `einfarbig in ${druckName(e.mono)}` : `Druckfarben: ${(c.palette || []).join(', ') || 'unbekannt'}`,
        !e.mono && map.length ? `umgestellt: ${map.join(', ')} (erkannt: ${erkannt.join(', ')})` : '',
        e.ohneHg ? 'Hintergrund entfernt' : '', gr, dreh
      ].filter(Boolean).join(' · ')];
    }
    return [e.name ? 'Namen (auf jeder Kappe ein Name aus der Liste)' : `Text »${textInhalt(e)}«`, [
      `Schrift ${schriftName(e)}`, `Druckfarbe ${druckName(e.farbe)}`, istVersal(e) ? 'Großbuchstaben' : 'normale Schreibweise', gr,
      e.bogen ? `Bogen ${e.bogen > 0 ? '+' : ''}${e.bogen}` : '', `Zeichenabstand ${Math.round((e.spacing || 0) * 100)}\u00a0%`, dreh
    ].filter(Boolean).join(' · ')];
  }
  function teamPdf(daten, nr) {
    const p = rechne();
    /* Die PDF-Grundschrift kennt die Breite des €-Zeichens nicht, der Text dahinter rückt sonst ran */
    const eur = (n) => euro(n).replace(' €', ' EUR');
    return Promise.all([ladeJsPdf(), kappeAlsBild('vorne', 900), kappeAlsBild('hinten', 900)]).then((r) => {
      const doc = new r[0]({ unit: 'mm', format: 'a4' });
      const L = 16, B = 178, SPALTE = 46;
      let y = 18;
      const platz = (mm) => { if (y + mm > 282) { doc.addPage(); y = 18; } };
      const schrift = (gr, fett, farbe) => { doc.setFont('helvetica', fett ? 'bold' : 'normal'); doc.setFontSize(gr); doc.setTextColor(farbe || '#191818'); };
      const abschnitt = (t) => {
        platz(16);
        y += 4;
        schrift(8, true, '#8a8a85');
        doc.text(t.toUpperCase(), L, y);
        doc.setDrawColor('#dddad3');
        doc.line(L, y + 1.6, L + B, y + 1.6);
        y += 6.5;
      };
      const zeile = (label, wert) => {
        if (!wert && wert !== 0) return;
        const teile = doc.splitTextToSize(String(wert), B - SPALTE);
        platz(teile.length * 4.6 + 1);
        schrift(9, false, '#8a8a85');
        doc.text(label, L, y);
        schrift(9.5, false);
        doc.text(teile, L + SPALTE, y);
        y += teile.length * 4.6 + 1.2;
      };
      /* Kopf */
      schrift(16, true);
      doc.text('Konfigurator-Anfrage', L, y);
      schrift(9, false, '#8a8a85');
      doc.text(`MySwimcap · Nr. ${nr} · ${datumKurz(new Date())}${ISTPROD ? '' : ' · STAGING-TEST'}`, L, y + 5.5);
      schrift(9.5, true);
      doc.text(daten.verein || daten.name, L + B, y, { align: 'right' });
      y += 13;
      abschnitt('Kunde');
      zeile('Verein / Team', daten.verein || '(nicht angegeben)');
      zeile('Ansprechpartner', daten.name);
      zeile('E-Mail', daten.email);
      zeile('Telefon', daten.telefon);
      zeile('Wunschtermin', daten.termin ? datumKurz(new Date(daten.termin + 'T12:00')) : '');
      /* Beide Seiten als Bild */
      platz(84);
      y += 2;
      const bw = (B - 6) / 2, bh = bw * 560 / 600;
      doc.addImage(r[1], 'JPEG', L, y, bw, bh);
      doc.addImage(r[2], 'JPEG', L + bw + 6, y, bw, bh);
      y += bh + 4;
      schrift(8.5, false, '#8a8a85');
      doc.text('Vorderseite', L + bw / 2, y, { align: 'center' });
      doc.text(st.rueckseite === 'gleich' ? 'Rückseite (wie vorne)' : st.rueckseite === 'leer' ? 'Rückseite (unbedruckt)' : 'Rückseite', L + bw * 1.5 + 6, y, { align: 'center' });
      y += 3;
      abschnitt('Konfiguration');
      konfigZeilen().forEach((z) => zeile(z[0], z[1]));
      abschnitt('Preisvorschlag (Preisliste 2026, brutto)');
      zeile('Druck', `${p.zeile}-farbig (vorne ${p.fv}, hinten ${p.fh})${p.ueber ? `, eigentlich ${p.farben} Farben: Preis im Angebot` : ''}`);
      zeile('Je Kappe', `${eur(p.stueck)} bei ${p.m.toLocaleString('de-DE')} Stück`);
      zeile('Gesamt', `${eur(p.brutto)} brutto · ${eur(p.netto)} netto · darin ${eur(p.mwst)} MwSt.`);
      zeile('Noch offen', ['Versand', p.namen ? 'Namen' : '', p.ueber ? 'Farben über 6' : ''].filter(Boolean).join(', ') + ': Preis im Angebot');
      /* Jedes Druckelement einzeln */
      if (st.modus === 'service') {
        abschnitt('Gestaltung durch MySwimcap');
        zeile('Seiten', ['vorne', 'hinten'].filter((s) => svcFarben(s)).map((s) => `${s} (${s === 'hinten' && st.rueckseite === 'gleich' ? 'wie vorne, ' : ''}${svcFarben(s)} Farben geschätzt)`).join(', '));
        zeile('Wünsche', st.service.notiz || '(keine)');
        zeile('Datei', st.service.datei || (daten.logo_url ? 'siehe Logo-Link' : '(keine)'));
      } else {
        ['vorne', 'hinten'].forEach((s) => {
          abschnitt(s === 'vorne' ? 'Druck Vorderseite' : 'Druck Rückseite');
          if (s === 'hinten' && st.rueckseite !== 'eigen') { zeile('', st.rueckseite === 'gleich' ? 'Wie die Vorderseite, Farben zählen doppelt.' : 'Unbedruckt.'); return; }
          const els = druckElemente(s);
          if (!els.length) zeile('', 'Unbedruckt.');
          els.forEach((e, i) => { const d = elementBeschreibung(e); zeile(`${i + 1}. ${e.typ === 'bild' ? 'Logo' : (e.name ? 'Namen' : 'Text')}`, `${d[0]}\n${d[1]}`); });
        });
      }
      if (st.namen.aktiv) {
        abschnitt(`Namensliste (${st.namen.liste.length || 'folgt'})`);
        zeile('Namen', st.namen.liste.length ? st.namen.liste.join(', ') : 'Liste schickt der Kunde nach.');
      }
      abschnitt('Dateien und Hinweise');
      zeile('Logo-Datei', daten.logo_url || 'kein eigenes Logo hochgeladen');
      zeile('Hinweise', daten.hinweise || '(keine)');
      /* Fuß auf jeder Seite */
      const seiten = doc.getNumberOfPages();
      for (let i = 1; i <= seiten; i++) {
        doc.setPage(i);
        schrift(7.5, false, '#8a8a85');
        doc.text('Preisvorschlag, Änderungen vorbehalten. Automatisch erstellt aus dem Online-Konfigurator auf my-swimcap.de', L, 290);
        doc.text(`Seite ${i} von ${seiten}`, L + B, 290, { align: 'right' });
      }
      return { base64: doc.output('datauristring').split(',')[1], name: `MySwimcap-Anfrage-${nr}.pdf` };
    });
  }

  /* ---------- Klassischer Weg: kostenloser Entwurf im Wizard ---------- */
  function hochladen(blob, name) {
    const base = (name || 'logo.png').replace(/[^A-Za-z0-9._-]/g, '_').slice(-48);
    const path = 'konfigurator-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + base;
    return fetch(`${SB_URL}/storage/v1/object/${SB_BUCKET}/${encodeURIComponent(path)}`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + SB_ANON, apikey: SB_ANON, 'Content-Type': blob.type || 'application/octet-stream', 'x-upsert': 'false' },
      body: blob
    }).then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return `${SB_URL}/storage/v1/object/public/${SB_BUCKET}/${encodeURIComponent(path)}`;
    });
  }
  function zumEntwurf() {
    const btn = $('#btnEntwurf');
    const p = rechne();
    const f = FARBTON[st.farbe];
    const teile = konfigZeilen().map((z) => `${z[0]}: ${z[1]}`).join(' · ');
    const notiz = `Aus dem Online-Konfigurator. ${teile}${st.modus === 'service' && st.service.notiz ? ' · Wünsche: ' + st.service.notiz : ''}`;
    const q = new URLSearchParams({
      von: 'gestalten', modell: MODELLE[st.modell].wizard, farbe: f ? f[0] : '',
      menge: mengenBand(p.m), farben: farbenBand(Math.max(p.fv, p.fh)),
      namen: st.namen.aktiv ? 'Ja, mit Namen' : 'Nein', notiz: notiz.slice(0, 900)
    });
    btn.classList.add('laedt');
    btn.disabled = true;
    logoHochladen().then((url) => {
      if (url) q.set('logo', url);
      location.href = '/?' + q.toString() + '#anfrage';
    });
  }
  /* Eigenes Logo unverändert in den Bucket laden: die Originaldatei dieser
     Sitzung, sonst das gespeicherte Bild ohne Freistellen und Umfärben.
     Liefert die öffentliche URL oder '' (kein Logo, Upload fehlgeschlagen). */
  function logoHochladen() {
    const svc = st.modus === 'service';
    const logoEl = alleBilder().find((e) => !e.beispiel && (!svc || e.serviceLogo)) || alleBilder().find((e) => !e.beispiel);
    const datei = svc ? (dateien.service || (logoEl && dateien[logoEl.id])) : ((logoEl && dateien[logoEl.id]) || dateien.service);
    if (!datei && !logoEl) return Promise.resolve('');
    const blobP = datei ? Promise.resolve(datei) : fetch(logoEl.src).then((r) => r.blob());
    return blobP.then((b) => hochladen(b, datei ? datei.name : 'logo-konfigurator.png')).catch(() => '');
  }

  /* =================================================================
     10. Events
     ================================================================= */
  function binde() {
    svg = $('#kappe');
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onUp);
    svg.addEventListener('touchstart', (e) => {
      if (e.target.closest && e.target.closest('.hit,[data-griff]')) e.preventDefault();
    }, { passive: false });

    document.addEventListener('click', (ev) => {
      const t = ev.target;
      const a = t.closest('[data-aktion]');
      if (a) {
        const k = a.dataset.aktion;
        if (k === 'logo') { $('#dateiInput').dataset.ziel = 'selbst'; $('#dateiInput').click(); }
        if (k === 'logo-service') { $('#dateiInput').dataset.ziel = 'service'; $('#dateiInput').click(); }
        if (k === 'text') textHinzu();
        if (k === 'beispiel') beispielLaden();
        if (k === 'namen-datei') $('#namenDatei').click();
        if (k === 'svc-weg') {
          st.service.datei = '';
          delete dateien.service;
          st.elemente.vorne = st.elemente.vorne.filter((e) => !e.serviceLogo);
          renderService(); renderDrucke(); renderPreis(); commit();
        }
        return;
      }
      const pr = t.closest('[data-preset]');
      if (pr) { textHinzu(pr.dataset.preset); return; }
      const mo = t.closest('[data-modell]');
      if (mo) {
        st.modell = mo.dataset.modell;
        if (farbListe(st.modell).indexOf(st.farbe) < 0) st.farbe = standardFarbe(st.modell);
        renderModelle(); renderFarben(); renderKappe(); renderPreis(); renderMenge(); commit();
        return;
      }
      const fa = t.closest('[data-farbe]');
      if (fa) { st.farbe = fa.dataset.farbe; renderFarben(); renderKappe(); renderInspektor(); renderPreis(); commit(); return; }
      const gr = t.closest('#groesse button');
      if (gr) {
        st.groesse = gr.dataset.g;
        /* Junior-Palette ist kleiner: nicht lieferbare Farbe ersetzen und sagen */
        if (farbListe(st.modell).indexOf(st.farbe) < 0) {
          const alt = FARBTON[st.farbe] ? FARBTON[st.farbe][0] : '';
          st.farbe = standardFarbe(st.modell);
          toast(`${alt} gibt es nicht in Kindergröße. Wir haben auf ${FARBTON[st.farbe][0]} gewechselt.`);
          renderKappe(); renderInspektor();
        }
        renderGroesse(); renderFarben(); commit();
        return;
      }
      const se = t.closest('.seiten__btn,[data-seite-go]');
      if (se) {
        st.seite = se.dataset.seite || se.dataset.seiteGo;
        if (st.auswahl && seiteVon(st.auswahl) !== st.seite) st.auswahl = null;
        renderSeiten(); renderKappe(); renderInspektor(); renderEbenen();
        return;
      }
      const rs = t.closest('[data-rs]');
      if (rs) { setRueckseite(rs.dataset.rs); return; }
      const sp = t.closest('[data-step]');
      if (sp) { if (sp.dataset.step === 'kasse') zurKasse(); else geheZu(sp.dataset.step); return; }
      const sg = t.closest('[data-step-go]');
      if (sg) { geheZu(sg.dataset.stepGo); return; }
      const md = t.closest('.mk__btn');
      if (md) { if (md.dataset.modus !== st.modus) setModus(md.dataset.modus); return; }
      const eb = t.closest('[data-ebene]');
      if (eb) { waehle(eb.dataset.ebene); return; }
      const ins = t.closest('[data-ins]');
      if (ins) {
        const id = st.auswahl, e = finde(id), k = ins.dataset.ins;
        if (!e) return;
        if (k === 'dup') dupliziere(id);
        if (k === 'seite') aufAndereSeite(id);
        if (k === 'hoch') ebene(id, 1);
        if (k === 'runter') ebene(id, -1);
        if (k === 'weg') entferne(id);
        if (k === 'zu') waehle(null);
        if (k === 'mitte') { e.x = 300; renderDrucke(); renderInspektor(); commit(); }
        if (k === 'farbreset') { delete e.farbMap; verarbeite(e).then(() => { renderDrucke(); renderInspektor(); renderPreis(); commit(); }); }
        return;
      }
      const sch = t.closest('[data-schrift]');
      if (sch) { const e = finde(st.auswahl); if (e) { e.schrift = sch.dataset.schrift; renderDrucke(); renderInspektor(); commit(); } return; }
      const tf = t.closest('[data-tfarbe]');
      if (tf) { const e = finde(st.auswahl); if (e) { e.farbe = tf.dataset.tfarbe; renderDrucke(); renderInspektor(); renderPreis(); commit(); } return; }
      const mf = t.closest('[data-mfarbe]');
      if (mf) {
        const e = finde(st.auswahl);
        if (e) { e.mono = mf.dataset.mfarbe; verarbeite(e).then(() => { renderDrucke(); renderInspektor(); renderPreis(); commit(); }); }
        return;
      }
      const mc = t.closest('#mengeChips .chip');
      if (mc) { setMenge(+mc.dataset.m); return; }
      const ms = t.closest('[data-menge-setzen]');
      if (ms) { setMenge(+ms.dataset.mengeSetzen); return; }
      const nb = t.closest('.nb button');
      if (nb) { st.netto = nb.dataset.nb === 'netto'; renderPreis(); renderMenge(); renderNamen(); speichernBald(); return; }
      const sz = t.closest('[data-svc-plus],[data-svc-minus]');
      if (sz) {
        const k = sz.dataset.svcPlus || sz.dataset.svcMinus;
        st.service.farben[k] = clamp(st.service.farben[k] + (sz.dataset.svcPlus ? 1 : -1), 1, 6);
        renderService(); renderPreis(); commit();
        return;
      }
    });

    $('#dateiInput').addEventListener('change', (e) => {
      const f = e.target.files[0];
      dateiGewaehlt(f, e.target.dataset.ziel);
      e.target.value = '';
    });
    $('#namenDatei').addEventListener('change', (e) => {
      namenDateiGewaehlt(e.target.files[0]);
      e.target.value = '';
    });
    /* Drag & Drop direkt auf die Bühne */
    const fl = $('#flaeche');
    ['dragenter', 'dragover'].forEach((n) => fl.addEventListener(n, (e) => { e.preventDefault(); fl.classList.add('drop'); }));
    ['dragleave', 'drop'].forEach((n) => fl.addEventListener(n, (e) => { e.preventDefault(); fl.classList.remove('drop'); }));
    fl.addEventListener('drop', (e) => {
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) dateiGewaehlt(f, st.modus === 'service' ? 'service' : 'selbst');
    });

    /* Inspektor: Eingaben + Regler */
    $('#inspektor').addEventListener('input', (ev) => {
      const e = finde(st.auswahl);
      if (!e) return;
      const t = ev.target;
      if (t.id === 'insText') { e.text = t.value; renderDrucke(); renderEbenen(); return; }
      const k = t.dataset.regler;
      if (!k) return;
      const v = +t.value;
      if (k === 's') e.s = v / 100;
      if (k === 'r') e.r = v;
      if (k === 'bogen') e.bogen = Math.abs(v) < 4 ? 0 : v;
      if (k === 'spacing') e.spacing = v / 100;
      if (k === 'staerke') e.staerke = v;
      const out = $(`[data-out="${k}"]`, $('#inspektor'));
      if (k === 'hgTol') { e.hgTol = v; if (out) out.textContent = v + ' %'; freistellenBald(e); return; }
      if (out) out.textContent = k === 's' ? v + ' %' : k === 'r' ? v + '°' : k === 'spacing' ? v + ' %' : k === 'staerke' ? STAERKEN[v] : (e.bogen === 0 ? 'gerade' : (e.bogen > 0 ? 'nach oben' : 'nach unten'));
      if (k === 'bogen' || k === 'spacing' || k === 'staerke') renderDrucke(); else aktualisiereElement(e);
    });
    $('#inspektor').addEventListener('change', (ev) => {
      const e = finde(st.auswahl);
      if (!e) return;
      const fm = ev.target.dataset.farbmap;
      if (fm) {
        const map = Object.assign({}, e.farbMap);
        if (ev.target.value === fm) delete map[fm]; else map[fm] = druckHex(ev.target.value);
        if (Object.keys(map).length) e.farbMap = map; else delete e.farbMap;
        verarbeite(e).then(() => { renderDrucke(); renderInspektor(); renderPreis(); commit(); });
        return;
      }
      if (ev.target.dataset.regler === 'hgTol') { freistellenBald(e, true); return; }
      const cb = ev.target.dataset.insCb;
      if (cb === 'versal') { e.versal = ev.target.checked; renderDrucke(); renderInspektor(); renderEbenen(); commit(); return; }
      if (cb === 'ohneHg') { e.ohneHg = ev.target.checked; verarbeite(e).then(() => { renderDrucke(); renderInspektor(); renderPreis(); commit(); }); return; }
      if (cb === 'mono') {
        e.mono = ev.target.checked ? (luminanz(kappeHex()) < 0.56 ? '#ffffff' : '#14254f') : null;
        verarbeite(e).then(() => { renderDrucke(); renderInspektor(); renderPreis(); commit(); });
        return;
      }
      renderDrucke();
      renderPreis();
      commit();
    });

    /* Namen */
    $('#namenAn').addEventListener('change', (ev) => {
      st.namen.aktiv = ev.target.checked;
      if (st.namen.aktiv) {
        if (!alleElemente().some((e) => e.name)) {
          const n = namenElement();
          st.elemente[n.seite].push(n.e);
          st.seite = n.seite;
          st.auswahl = n.e.id;
          renderSeiten();
          renderKappe();
        }
        toast('Der Name sitzt unter eurem Logo. Zieh den Platzhalter an die gewünschte Stelle.');
      } else {
        ['vorne', 'hinten'].forEach((s) => { st.elemente[s] = st.elemente[s].filter((e) => !e.name); });
        st.auswahl = null;
        renderKappe();
      }
      renderNamen(); renderInspektor(); renderEbenen(); renderPreis(); renderMenge(); commit();
    });
    $('#namenListe').addEventListener('input', (ev) => {
      st.namen.liste = ev.target.value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 2000);
      st.namen.vorschau = 0;
      renderNamen(); renderDrucke();
      speichernBald();
    });
    $('#namenListe').addEventListener('change', () => {
      if (st.namen.liste.length > st.menge) {
        setMenge(st.namen.liste.length);
        toast(`Menge an die Namensliste angepasst: ${st.namen.liste.length} Stück.`);
      }
      commit();
    });
    $('#nVor').addEventListener('click', () => zeigeNamenVorschau(-1));
    $('#nNach').addEventListener('click', () => zeigeNamenVorschau(1));

    /* Service-Modus */
    $('#svcNotiz').addEventListener('input', (ev) => { st.service.notiz = ev.target.value; speichernBald(); });
    $('#svcNotiz').addEventListener('change', commit);
    /* Rückseite: Hebel aus = wie vorne, an = eigenes Motiv (oder unbedruckt) */
    $('#rsAnders').addEventListener('change', (ev) => setRueckseite(ev.target.checked ? 'eigen' : 'gleich'));

    /* Größe gemischt */
    $('#kinderZahl').addEventListener('input', (ev) => { st.kinder = clamp(+ev.target.value || 0, 0, st.menge); speichernBald(); });

    /* Menge */
    const mi = $('#menge');
    mi.addEventListener('input', () => {
      const v = parseInt(mi.value, 10);
      if (v >= PREIS.mindest) { st.menge = Math.min(v, 20000); renderPreis(); renderMengeTeil(); }
    });
    mi.addEventListener('change', () => setMenge(parseInt(mi.value, 10) || PREIS.mindest));
    $('#mMinus').addEventListener('click', () => setMenge(st.menge - (st.menge > 100 ? 10 : 5)));
    $('#mPlus').addEventListener('click', () => setMenge(st.menge + (st.menge >= 100 ? 10 : 5)));

    /* Bühnen-Werkzeuge */
    $('#btnUndo').addEventListener('click', undo);
    $('#btnRedo').addEventListener('click', redo);
    $('#btnBereich').addEventListener('click', () => {
      st.druckbereich = !st.druckbereich;
      pfadSicher.classList.toggle('an', st.druckbereich);
      $('#btnBereich').setAttribute('aria-pressed', st.druckbereich ? 'true' : 'false');
      speichernBald();
    });

    /* Schritt-Navigation */
    $('#btnWeiter').addEventListener('click', schrittWeiter);
    $('#mbarWeiter').addEventListener('click', schrittWeiter);
    $('#btnZurueck').addEventListener('click', schrittZurueck);
    $('#mbarZurueck').addEventListener('click', schrittZurueck);

    /* Preis-CTAs */
    $('#btnAnfordern').addEventListener('click', zurKasse);
    $('#mbarAnfordern').addEventListener('click', zurKasse);
    $('#btnAngebot').addEventListener('click', () => {
      $('#dlgAngebot').hidden = false;
      setTimeout(() => $('#aVerein').focus(), 30);
    });
    $('#btnEntwurf').addEventListener('click', zumEntwurf);
    $('#mbarPreis').addEventListener('click', () => $('#preis').scrollIntoView({ behavior: 'smooth', block: 'center' }));

    /* Angebots-Dialog */
    $('#dlgAngebot').addEventListener('click', (ev) => { if (ev.target.id === 'dlgAngebot' || ev.target.closest('[data-dlg-zu]')) $('#dlgAngebot').hidden = true; });
    $('#formAngebot').addEventListener('submit', (ev) => {
      ev.preventDefault();
      $('#dlgAngebot').hidden = true;
      druckDokument({ verein: $('#aVerein').value.trim(), name: $('#aName').value.trim() });
    });

    /* Kasse */
    $('#kasseForm').addEventListener('submit', anfrageSenden);
    $('#kasseForm').addEventListener('change', (ev) => {
      const feld = ev.target.closest('.field, label');
      if (feld && feld.classList.contains('fehler')) feld.classList.remove('fehler');
    });
    $('#kasseForm').addEventListener('input', (ev) => {
      const feld = ev.target.closest('.field');
      if (feld && feld.classList.contains('fehler')) feld.classList.remove('fehler');
    });
    $('#kasseSumToggle').addEventListener('click', () => {
      const s = $('.kasse__sum');
      s.classList.toggle('offen');
      $('#kasseSumToggle').setAttribute('aria-expanded', s.classList.contains('offen') ? 'true' : 'false');
    });
    $('#btnFertigPdf').addEventListener('click', () => druckDokument(window.__anfrage || {}));

    /* Nav-Buttons »Kostenlos anfragen« (data-open-modal) → klassischer Weg */
    $$('[data-open-modal]').forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault();
      const mm = $('#mmenu');
      if (mm) { mm.classList.remove('open'); document.documentElement.classList.remove('menu-open'); }
      zumEntwurf();
    }));

    /* Tastatur */
    addEventListener('keydown', (ev) => {
      const tag = (ev.target.tagName || '').toLowerCase();
      const tippt = tag === 'input' || tag === 'textarea' || ev.target.isContentEditable;
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'z' && !tippt) {
        ev.preventDefault();
        if (ev.shiftKey) redo(); else undo();
        return;
      }
      if (ev.key === 'Escape') {
        if (!$('#dlgAngebot').hidden) { $('#dlgAngebot').hidden = true; return; }
        if (st.auswahl && !tippt) waehle(null);
        return;
      }
      const e = finde(st.auswahl);
      if (!e || tippt || $('#app').hidden) return;
      const schritt = ev.shiftKey ? 10 : 2;
      const m = { ArrowLeft: [-schritt, 0], ArrowRight: [schritt, 0], ArrowUp: [0, -schritt], ArrowDown: [0, schritt] }[ev.key];
      if (m) { ev.preventDefault(); e.x += m[0]; e.y += m[1]; aktualisiereElement(e); clearTimeout(binde.t); binde.t = setTimeout(() => { renderDrucke(); commit(); }, 300); }
      if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); entferne(e.id); }
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'd') { ev.preventDefault(); dupliziere(e.id); }
    });

    /* Routing (Zurück-Button) */
    addEventListener('popstate', () => geheZu(schrittAusHash(), true));

    /* Neu skalieren: Griffe bleiben gleich groß auf dem Bildschirm */
    let rz = 0;
    addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(() => { navHoehe(); renderDrucke(); }, 120);
    });
  }
  function schrittAusHash() {
    const h = location.hash;
    if (h === '#fertig' && window.__anfrage) return 'fertig';
    const s = Object.keys(HASH).find((k) => HASH[k] && HASH[k] === h);
    if (!s || s === 'fertig') return 'modell';
    return (s === 'menge' || s === 'kasse') && !designOk(true) ? 'design' : s;
  }
  function setMenge(v) {
    st.menge = clamp(Math.round(v) || PREIS.mindest, PREIS.mindest, 20000);
    if (st.kinder > st.menge) st.kinder = st.menge;
    renderMenge(); renderPreis(); renderNamen(); renderGroesse();
    commit();
  }
  function renderMengeTeil() {
    $$('#mengeChips .chip').forEach((c) => c.classList.toggle('sel', +c.dataset.m === st.menge));
  }
  function navHoehe() {
    const n = $('#nav');
    if (n) document.documentElement.style.setProperty('--navh', n.offsetHeight + 'px');
  }

  /* =================================================================
     12. Start
     ================================================================= */
  function start() {
    document.documentElement.classList.add('js');
    const nav = $('#nav');
    if (nav) nav.classList.add('scrolled');
    const burger = $('#burger'), mm = $('#mmenu');
    if (burger && mm) {
      burger.addEventListener('click', () => {
        const o = mm.classList.toggle('open');
        document.documentElement.classList.toggle('menu-open', o);
      });
    }
    if (!ISTPROD) $('#demoPill').hidden = false;
    navHoehe();
    laden();
    binde();
    /* Bilder neu aufbereiten (Ansicht + Farben) */
    Promise.all(alleBilder().map(verarbeite)).then(() => {
      renderAlles();
      if (st.tab === 'menge') renderMengeSeite();
      verlauf = [snapshot()];
      renderVerlaufBtns();
    });
    renderAlles();
    verlauf = [snapshot()];
    renderVerlaufBtns();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => renderDrucke());
    /* Schriften sicher laden, damit Textmaße stimmen */
    if (document.fonts && document.fonts.load) {
      Promise.all(SCHRIFT_LADEN.map((f) => document.fonts.load(f).catch(() => null))).then(() => renderDrucke());
    }
    const s = schrittAusHash();
    geheZu(s, true);
    if ((HASH[s] || '') !== location.hash) history.replaceState({ r: s }, '', HASH[s] || location.pathname + location.search);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
