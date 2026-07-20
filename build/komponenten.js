const fs = require('fs');
const idx = fs.readFileSync(__dirname + '/../index.html', 'utf8');

function grab(startRe, endTag, label) {
  const s = idx.search(startRe); if (s < 0) throw new Error('fehlt: ' + label);
  const e = idx.indexOf(endTag, s); if (e < 0) throw new Error('Ende fehlt: ' + label);
  return idx.slice(s, e + endTag.length);
}
const NAV = grab(/<header[^>]*class="nav"/, '</header>', 'nav');
const MMENU = grab(/<div class="mmenu"/, '</div>', 'mmenu');
const ABLAUF = grab(/<section[^>]*id="ablauf"/, '</section>', 'ablauf');
const CTA = grab(/<section class="cta-final"/, '</section>', 'cta');
const FOOTER = grab(/<footer class="footer"/, '</footer>', 'footer');
const FAQCAPS = (() => { const s = idx.search(/<div class="faq-caps"/); if (s < 0) return '';
  const e = idx.indexOf('</section>', s); return idx.slice(s, idx.lastIndexOf('</div>', e) + 6); })();

// Links/Pfade für Unterseiten korrigieren
const fix = s => s
  .replace(/href="#top"/g, 'href="/"')
  .replace(/href="#(modelle|ablauf|vereine|faq|anfrage)"/g, 'href="/#$1"')
  .replace(/<a href="#" data-open-modal/g, '<a href="/#anfrage" data-open-modal')
  .replace(/(src|href)="Bilder\//g, '$1="/Bilder/');
// Sprachumschalter entfernen (Unterseiten sind DE-only)
const noLang = s => s.replace(/<div class="langsw"[\s\S]*?<\/div>\s*(?=<button)/, '');

const NAVS = noLang(fix(NAV)), MMENUS = fix(MMENU), FOOTERS = fix(FOOTER);

function ablauf(h2, rails, steps, imgs) {
  let a = fix(ABLAUF);
  a = a.replace(/(<h2 class="reveal"[^>]*>)[\s\S]*?(<\/h2>)/, '$1' + h2 + '$2');
  let i = 0; a = a.replace(/<li[^>]*>[\s\S]*?<\/li>/g, () => '<li>' + rails[i++] + '</li>');
  let j = 0; a = a.replace(/<div class="pb__n">[\s\S]*?<div class="meta"[^>]*>[\s\S]*?<\/div>/g, () => {
    const st = steps[j]; const n = String(++j).padStart(2, '0');
    return '<div class="pb__n">' + n + '</div>\n<h3>' + st.h + '</h3>\n<p>' + st.p +
           '</p>\n<div class="meta">' + st.meta + '</div>';
  });
  if (imgs) { let k = 0; a = a.replace(/src="\/Bilder\/step-[^"]+"/g, () => 'src="' + imgs[k++] + '"'); }
  return a;
}

function faq(h2, qa) {
  const blocks = qa.map(x =>
    '        <div class="q">\n          <button aria-expanded="false"><span>' + x.q +
    '</span><span class="pm"></span></button>\n          <div class="a"><p>' + x.a +
    '</p></div>\n        </div>').join('\n');
  return '<section class="sec sec--stone" id="faq">\n  <div class="wrap">\n' +
    '    <div class="sec-head reveal">\n      <span class="eyebrow">FAQ</span>\n' +
    '      <h2 style="margin-top:16px">' + h2 + '</h2>\n    </div>\n' +
    '    <div class="faq reveal">\n' + blocks + '\n    </div>\n' +
    (FAQCAPS ? '    ' + fix(FAQCAPS) + '\n' : '') + '  </div>\n</section>';
}

function cta(h2, p, preis, bg, alt) {
  let c = fix(CTA);
  c = c.replace(/(<h2[^>]*>)[\s\S]*?(<\/h2>)/, '<h2>' + h2 + '</h2>');
  c = c.replace(/<p data-en="Send us your logo[^"]*">[\s\S]*?<\/p>/, '<p>' + p + '</p>');
  c = c.replace(/<p class="cta-final__price"[^>]*>[\s\S]*?<\/p>/, '<p class="cta-final__price">' + preis + '</p>');
  if (bg) c = c.replace(/(<img class="cta-final__bg" src=")[^"]*(")([^>]*alt=")[^"]*(")/, '$1' + bg + '$2$3' + alt + '$4');
  return c;
}

function head(o) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${o.title}</title>
<meta name="description" content="${o.desc}" />
<link rel="canonical" href="https://my-swimcap.de/${o.slug}" />
<link rel="icon" href="/Bilder/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/Bilder/favicon.svg" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="MySwimcap" />
<meta property="og:locale" content="de_DE" />
<meta property="og:url" content="https://my-swimcap.de/${o.slug}" />
<meta property="og:title" content="${o.ogTitle}" />
<meta property="og:description" content="${o.ogDesc}" />
<meta property="og:image" content="https://my-swimcap.de/Bilder/og-image.jpg" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${o.ogTitle}" />
<meta name="twitter:image" content="https://my-swimcap.de/Bilder/og-image.jpg" />
<!-- IBM Plex lokal gehostet — keine Verbindung zu Google (DSGVO + Performance) -->
<link rel="preload" href="/fonts/ibm-plex-serif-400-latin.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/ibm-plex-sans-400-latin.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/fonts/fonts.css" />
<!-- dasselbe Stylesheet wie die Startseite -> identische Komponenten -->
<link rel="stylesheet" href="/assets/site.css" />
<script type="application/ld+json">
${o.jsonld}
</script>
</head>
<body id="top">
${NAVS}
${MMENUS}
<main>`;
}
const tail = `</main>
${FOOTERS}
<script src="/assets/page.js"></script>
</body>
</html>
`;

module.exports = { head, tail, ablauf, faq, cta, fix };
