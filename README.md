# swimcap — Homepage (Halden-Miller-Designsystem)

Bedruckte Badekappen für Vereine. Ein Service der **Teamfreaks**.
SEO-Landingpage, die Vereine, Staffeln & Schwimmschulen abholt und in eine Anfrage führt.

> Stand: **production-ready HTML-Entwurf** der Homepage im Halden-Miller-Stil. Noch ohne Backend (Formular).

## Dateien
- `index.html` — **die Homepage** (editorial, hell, Halden-Miller-System). Self-contained: HTML + CSS + JS inline.
- `Bilder/` — Bildassets (saubere Namen: `hero-swimmer`, `cap-hand-pool`, `vereine-cluster`, `action-swimmer`, `packaging-box`, `caps-rainbow`, `model-3d/-silikon/-stoff/-frauen`). Originale (openart-*) bleiben daneben.
- `Vereinsbadekappen/` — 72 echte Vereins-Badekappen-Produktfotos (aus der Teamfreaks-Suche).
- `Badekappen Produktbilder/` — einfarbige Silikon-/Stoff-Muster.
- `keyword-research.md` — DataForSEO-Keyword-Analyse + SEO-Seitenarchitektur.
- `formular-demo.html` — älterer Formular-Modal-Entwurf (durch das integrierte Formular in index.html überholt).
- `index-konzept-teal.html` — gesicherte erste Version (Teal/Oswald-Konzept).

## Designsystem (Halden Miller)
- Surfaces: Parchment `#f7f7f2` · Linen `#efede7` · Stone `#e1dcd5` · Obsidian `#1e1c1b` · Walnut `#22201f`
- Text/Primary: Midnight Ink `#191818`. Utility nur für States (amber/red/fern). Keine weiteren Sattfarben.
- Fonts: **IBM Plex Serif** (Headlines, italic = Betonung) · **Plex Sans** (Body) · **Plex Mono** (Eyebrows/Tags)
- Pill-Buttons (16px), Text-Scroll-Hover, 1px-Bevel · keine harten Schatten · 80–120px Section-Rhythmus
- Smooth-Scroll: **Lenis** · Animationen: **GSAP** (Parallax, Count-up, Prozess) · Reveals: IntersectionObserver (robust)

## Sektionen
Hero (Schwimmer + Overlay-Tags) → Vereins-Marquee → 3 USPs → 4 Modelle (Bildkarten) → Prozess (dunkel, gestapelte Plates) → Proof/Stats → FAQ → **Anfrage-Formular** (Multistep links / Bild rechts, 4 Modelle als Bildkarten, optionaler Logo-Upload) → dunkle CTA → Footer. Responsive für Mobil.

## Lokal ansehen
```bash
npx serve -l 4321 .
# oder index.html direkt im Browser öffnen
```

## Deploy (Vercel + GitHub)
Statisch, kein Build.
```bash
git init && git add . && git commit -m "swimcap homepage (halden miller)"
gh repo create my-swimcap --public --source=. --push
npx vercel
```

## Offene Punkte
1. **Formular-Backend** anbinden — `submit()` in `index.html` ist noch `console.log`. Auf echten POST umstellen (Formspree / Supabase + Make.com analog Sockfab), inkl. Logo-Datei-Upload.
2. **Echte Testimonials** statt Platzhalter; ggf. weitere Sektionen im selben Stil.
3. **SEO-Unterseiten** aus `keyword-research.md` (z. B. /badekappen-mit-namen, /badekappen-fuer-lange-haare).
4. Meta/OG-Tags, Favicon, `sitemap.xml`, `robots.txt`, Impressum/Datenschutz.
5. Bild-Optimierung (WebP/AVIF, Lazy-Load) vor Go-Live.
