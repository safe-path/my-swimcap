# Unterseiten neu bauen

Die Unterseiten (`/badekappen-mit-namen`, `/badekappen-fuer-lange-haare`)
verwenden **dieselben Komponenten wie die Startseite**: Nav, Mobilmenü,
Sticky-Ablauf, FAQ-Akkordeon, CTA und Footer werden beim Bauen direkt aus
`index.html` gezogen. Dadurch können sie nicht auseinanderlaufen.

Nach Änderungen an einer dieser Komponenten in `index.html`:

    node build/unterseiten.js

Das überschreibt die beiden HTML-Dateien im Projektwurzelverzeichnis.
Seiten-eigene Inhalte (Texte, FAQ, Bilder) stehen in `build/unterseiten.js`.

Das Styling liegt komplett in `assets/site.css` — ein Stylesheet für alle
Seiten. `assets/page.js` enthält das Verhalten der Unterseiten
(Reveals, Nav, Burger, Sticky-Ablauf, FAQ).
