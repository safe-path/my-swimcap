# Bild-Prompts — MySwimcap Header & Produktbilder

Referenz-Look: `Bilder/hero-swimmer.webp` (die TSC-Berlin-Kappe). Was diesen Look ausmacht:

- **Dreiviertelprofil von hinten/seitlich**, Kopf füllt 55–70 % der Bildhöhe
- **Low-Key-Licht**, eine weiche Lichtquelle von schräg oben-hinten → Kante auf der Kappe
- **Hintergrund stark unscharf** (Blende f/2.0–f/2.8), Bahnleinen nur als Farbflächen
- **Kühle Wassertöne** (Türkis/Petrol) gegen warme Hauttöne
- **Feine Wassertropfen** auf dem Silikon — das verkauft das Material
- Logo **leicht gewölbt** mit der Kappenform, nie flach aufgeklebt

> **Wichtig zum Seitenverhältnis:** Die Header-Bilder werden als **16:9** eingebunden (1800 × 1005 px)
> und links vom Text überlagert. Das Motiv gehört deshalb in die **rechte Bildhälfte** —
> die linke Hälfte darf ruhig leer/dunkel sein.

---

## Baustein A · Stil (an jeden Prompt anhängen)

```
shot on 85mm lens, f/2.0, shallow depth of field, low-key cinematic lighting,
single soft rim light from upper back left, deep shadows, indoor 25m competition pool,
background heavily blurred into bands of teal and deep blue, lane ropes as soft bokeh,
fine water droplets beading on the silicone surface, subtle specular highlights,
muted desaturated color grade with warm skin against cool water, editorial sports
photography, photorealistic, sharp focus on the cap, 16:9, subject positioned in the
right half of the frame with negative space on the left
```

## Baustein B · Negativ-Prompt

```
no text overlay, no watermark, no logo distortion, no stretched or warped print,
not flat lettering, no plastic shine, no harsh direct flash, no busy background,
no crowd, no visible brand names other than the reference logo, no extra limbs,
no smooth AI skin, no oversaturated colors, no centered composition
```

---

## 1 · Header „Badekappen für lange Haare"

**Ziel:** Man muss *sofort* sehen, dass hier jemand mit langen Haaren schwimmt. Das Volumen
im Nacken ist das Verkaufsargument — es muss sichtbar sein.

```
Close-up three-quarter rear view of a female swimmer at the edge of an indoor pool,
wearing a long-hair silicone swim cap with a visibly rounded, domed volume at the back
of the head where a thick braid is tucked in. A few damp strands of long hair escape at
the nape of the neck. She is turned slightly away from camera, goggles pushed up on the
forehead, water still running down her shoulder.
```
→ **+ Baustein A + Baustein B**

**Variante (falls die erste zu „Model"-haft wirkt):** `mid-action, she is pulling the cap
over her head with both hands, braid still half visible` — zeigt die Passform noch direkter.

**Darauf achten:** Die Wölbung im Nacken muss *deutlich* sein. Generatoren machen daraus gern
eine normale runde Kappe. Wenn nötig nachschärfen mit
`exaggerated bulbous volume at the back of the cap, clearly larger than a standard swim cap`.

---

## 2 · Header „Badekappen mit Namen"

**Ziel:** Mehrere Kappen mit **verschiedenen** Namen — die Individualisierung ist der Punkt,
eine einzelne Kappe transportiert das nicht.

**Variante A — Reihe auf der Bank (empfohlen, weil der Name lesbar wird):**
```
Four printed silicone swim caps laid out in a row on a worn wooden changing room bench,
each cap showing a different first name in clean sans-serif lettering above a small club
crest. Shallow angle from the side so the names stay readable. Damp bench, a towel
crumpled at the edge of frame, blurred pool hall in the background.
```

**Variante B — am Menschen:**
```
Close-up three-quarter rear view of a young swimmer at the pool edge wearing a navy
silicone swim cap, a first name printed in clean white sans-serif lettering across the
back of the head, small club crest above it. Two teammates blurred in the background,
their own caps showing different names.
```
→ jeweils **+ Baustein A + Baustein B**

**Darauf achten:** Bildgeneratoren schreiben Text unzuverlässig. Plane ein, die Namen
hinterher in Photoshop/Illustrator sauber zu setzen — dann generierst du die Kappen besser
**ohne** Namen und ergänzt sie selbst. Das ist der verlässlichere Weg.

---

## 3 · Eigenes Kappen-Design als Referenz einspeisen

Wenn du ein fertiges Kappen-Design (Flat-Artwork) hast und es aufs Foto bringen willst:

**Schritt 1 — Referenz hochladen.** Dein Design als PNG mit transparentem Hintergrund.

**Schritt 2 — Prompt mit Referenzbezug:**
```
Apply the uploaded artwork to the swim cap in the scene. The artwork must wrap naturally
around the curved surface of the cap: slight perspective distortion following the dome,
edges softening toward the sides, matte silicone texture showing through the ink, the
print catching the same rim light as the cap itself. Keep all proportions, colors and
letterforms of the artwork exactly as provided — do not redraw, restyle or re-letter it.
```
→ **+ Baustein A + Baustein B**

**Schritt 3 — Kontrolle.** Prüf am Ergebnis genau diese drei Dinge:
1. Sind **Buchstabenformen** unverändert? (Generatoren „verbessern" Schrift gern eigenmächtig)
2. Folgt der Druck der **Wölbung** oder klebt er flach drauf?
3. Stimmen die **Vereinsfarben** exakt? Nachträglich korrigieren ist teurer als neu generieren.

Für echte Verlässlichkeit bei Kundenlogos: Kappe **leer** generieren und das Artwork per
Verkrümmen/Displacement Map in Photoshop aufbringen. Ein KI-generiertes Vereinslogo, das
nicht 100 % stimmt, ist gegenüber dem Kunden ein Problem — kein Stilmittel.

---

## 4 · Nachbearbeitung für den Einsatz als Header

1. Export **1800 × 1005 px**, WebP, Qualität ~82
2. Ablage unter `Bilder/`, Dateiname klein und beschreibend
   (z. B. `hero-langhaar.webp`, `hero-namen.webp`)
3. Im HTML tauschen: `<img src="/Bilder/…" width="1800" height="1005" …>`
   — **Maße müssen zum echten Bild passen**, sonst wird es verzerrt
4. Der Header legt einen dunklen Verlauf über die linke Bildhälfte
   (`.hero__bg::after` in `assets/page.css`) — das Motiv also rechts platzieren
