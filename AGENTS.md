# Analytics Tracking — Mixpanel

Dieses Projekt nutzt **Mixpanel** für Produkt-Analytics. Mixpanel ist die einzige
Quelle für Event-Tracking. Keine weiteren Analyse-Werkzeuge, SDKs oder Tracking-
Bibliotheken einbauen, ohne dass der Betreiber es ausdrücklich verlangt.

---

## Bevor du Tracking hinzufügst oder änderst

⛔ **Keinen Mixpanel-Code schreiben, ohne diese Datei gelesen zu haben.**

### Pflicht-Checkliste

- [ ] Richtiges SDK für die Plattform? (siehe Tech Stack)
- [ ] Läuft ein CDP dazwischen? (hier: nein)
- [ ] **Ist das Consent-Gate berührt? Diese Seite richtet sich an deutsche
      Vereine — vor der Einwilligung darf kein einziges Event feuern.**
- [ ] Existiert das Event schon im Tracking-Plan unten?

---

## Tech Stack

| Detail | Wert |
|---|---|
| **Plattform** | Statisches HTML/CSS/JS, kein Build-Schritt, Hosting auf Vercel |
| **Mixpanel SDK** | `mixpanel-2-latest.min.js`, **selbst gehostet** unter `/js/mixpanel.min.js` |
| **Tracking-Methode** | Client-seitig |
| **CDP** | keins |
| **Consent nötig** | **ja** (EU/Deutschland) |
| **Token** | fest in `assets/analytics.js` (`TOKEN`) |
| **API-Host** | `https://api-eu.mixpanel.com` (`API_HOST` in `assets/analytics.js`) |

**Abweichung vom Mixpanel-Standard, bewusst:**
Die Vorlage verlangt, den Token aus einer Environment-Config zu lesen. Das Projekt
hat keinen Build-Schritt und keine Env-Variablen — der Token steht deshalb direkt in
`assets/analytics.js`. Das ist unkritisch: Mixpanel-Projekt-Tokens sind für den
Client-Einsatz gedacht und ohnehin im Quelltext sichtbar. Sie sind **kein** Secret.
(Ein Secret wäre der API-Secret für Exporte — der gehört niemals ins Frontend.)

---

## Initialisierung und Consent-Gate

**Datei:** `assets/analytics.js` — einzige Stelle, an der Mixpanel initialisiert wird.

Ablauf:

1. Beim Seitenaufruf passiert **nichts**. Kein SDK, kein Request, kein Speichereintrag.
2. Ohne gespeicherte Entscheidung erscheint das Einwilligungs-Banner (`.cc`).
3. **„Ablehnen"** → `sc_consent=denied` im Local Storage. Dauerhaft nichts.
4. **„Statistik erlauben"** → `sc_consent=granted`, erst *dann*:
   `MIXPANEL_CUSTOM_LIB_URL` setzen → offizielles Snippet ausführen →
   `init()` → `opt_in_tracking()` → `register(superProps)`.

**Warum strenger als Mixpanels Empfehlung:** `reference.md` schlägt
`opt_out_tracking_by_default: true` vor. Das lädt das SDK aber schon vor der
Einwilligung — die IP wäre damit bereits übertragen. Nach § 25 TDDDG reicht das
nicht. Hier wird das SDK erst nach dem Klick geladen; `opt_out_tracking_by_default`
bleibt zusätzlich als zweite Sperre gesetzt.

**Zwei Fallstricke, die Zeit gekostet haben:**

- `mixpanel-2-latest.min.js` funktioniert **nicht allein**. Die Bibliothek prüft
  `window.mixpanel.__SV` und bricht sonst mit einer Konsolen-Warnung ab. Das
  offizielle Snippet (in `analytics.js` als `snippet()` eingebettet) muss vorher
  laufen. Die Angabe in Mixpanels `reference.md`, es genüge ein `<script src=…>`,
  ist falsch.
- Der Guard in `track()` prüft ein **eigenes** Flag (`erlaubt`), nicht
  `has_opted_in_tracking()`. Solange nur der Stub geladen ist, liefert die
  SDK-Abfrage `undefined` und würde jedes Event verschlucken.

---

## Identity

**Nicht anwendbar.** Die Seite hat keine Anmeldung. Es gibt keine
`identify()`- oder `reset()`-Aufrufe und keine User-Profile.
Alle Events laufen auf der anonymen `distinct_id` des SDKs.

Sollte später ein Login dazukommen: `identify()` erst nach bestätigtem
Datenbank-Eintrag, niemals mit der E-Mail-Adresse als ID.

---

## Tracking-Plan

### Namenskonventionen

- Events: `snake_case`, Vergangenheit, Objekt + Verb → `request_submitted`
- Properties: `snake_case`, ausgeschrieben → `quantity_band`, nicht `qty`
- Boolean-Properties mit `is_`/`has_`-Präfix → `has_logo`

### Super Properties (an jedem Event)

| Property | Werte |
|---|---|
| `platform` | `web` |
| `page_type` | `startseite`, `spoke_namen`, `spoke_langhaar`, `rechtliches`, `sonstige` |
| `site_language` | `de`, `en` |

### Events

| Event | Auslöser | Properties | Datei |
|---|---|---|---|
| `page_viewed` | Nach erteilter Einwilligung, einmal pro Seitenaufruf | `page_path`, `referrer_domain` | `assets/analytics.js` |
| `request_modal_opened` | Anfrage-Modal geht auf | `source` (`nav`, `hero`, `footer`, `cta_final`, `mobilmenue`, `unterseite`) | `index.html` → `open()` |
| `request_step_completed` | Wizard-Schritt geschafft | `step_number` (1–4), `step_name` | `index.html` → `next.onclick` |
| **`request_submitted`** | **Value Moment** — Anfrage raus | `model`, `quantity_band`, `colors`, `names_option`, `has_logo`, `lead_time_days`, `language` | `index.html` → `submit()` |
| `request_abandoned` | Modal zu, ohne abzuschicken | `last_step` | `index.html` → `close()` |
| `faq_opened` | FAQ-Eintrag aufgeklappt | `question` | `assets/analytics.js` |
| `cta_clicked` | Klick auf einen Button außerhalb des Modals | `cta_label`, `cta_location` | `assets/analytics.js` |
| `language_switched` | DE/EN umgeschaltet | `to_language` | `assets/analytics.js` |

Die Ereignisse aus `index.html` kommen als `CustomEvent` (`sc:modal-opened`,
`sc:step-completed`, `sc:request-submitted`, `sc:modal-abandoned`) und werden in
`analytics.js` abgefangen. So bleibt der Wizard frei von Analytics-Code.

### Die wichtigste Auswertung

`request_step_completed` → `request_submitted` als Funnel. Sie beantwortet die
Frage, die Geld bringt: **In welchem Schritt springen Vereine ab?**
`request_abandoned.last_step` zeigt dieselbe Stelle direkt.

---

## Neues Event hinzufügen

1. Tracking-Plan oben prüfen — Doppelungen vermeiden.
2. Namen nach Konvention wählen.
3. Aus `index.html` per `CustomEvent` melden, in `analytics.js` abfangen.
   Nicht `mixpanel.track()` direkt in die Seitenlogik schreiben.
4. Event **nach** der erfolgreichen Aktion feuern, nicht beim Klick.
5. Tabelle oben ergänzen.
6. In Mixpanel Live View gegenprüfen.
7. **Wenn das Event neue Datenarten erfasst: Datenschutzerklärung Punkt 9
   anpassen.** Der Abschnitt zählt konkret auf, was erhoben wird — wächst das
   Tracking, ohne dass der Text mitwächst, wird die Erklärung falsch.

---

## Was nicht zu tun ist

- **Keine personenbezogenen Daten an Mixpanel.** Konkret verboten:
  `verein`, `name`, `email`, `notiz`, Dateiname des Logos. Die Formulardaten
  gehen ausschließlich an Make/Supabase (siehe Datenschutzerklärung Punkt 6).
  In `submit()` wird bewusst ein reduziertes Objekt an das Analytics-Event
  übergeben — dieses Objekt nicht durch `data` ersetzen.
- **Keine weiteren Analyse-Werkzeuge** einbauen.
- **Nichts vor der Einwilligung feuern.**
- **Kein zweites Mixpanel-Init** an anderer Stelle.
- **Events nicht in Schleifen** feuern — jedes Event ist ein Request.

---

## Offen

- **EU-Datenresidenz prüfen.** `API_HOST` zeigt auf `api-eu.mixpanel.com`, und
  der Endpunkt nimmt den Token an (`{"error":null,"status":1}`). Das belegt aber
  nur die Annahme, nicht den Speicherort. In den Mixpanel-Projekteinstellungen
  prüfen, ob das Projekt EU-Residenz hat — falls nicht, dort beantragen oder
  Datenschutzerklärung Punkt 9 entsprechend anpassen.
- **Auftragsverarbeitungsvertrag mit Mixpanel** abschließen. Punkt 9 der
  Datenschutzerklärung behauptet ihn bereits.
- Beim Setup wurden Testereignisse gesendet (`setup_verification` sowie einige
  `request_*`-Events aus dem lokalen Durchlauf). Vor der ersten echten
  Auswertung in Mixpanel herausfiltern oder löschen.
