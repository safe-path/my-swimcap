const B = require('./komponenten.js');
const fs = require('fs');

const heroBtns = (anker) => `
    <div class="phero__cta reveal">
      <button class="btn btn--light btn--lg" data-open-modal><span class="btn__t"><span>Angebot anfragen</span><span>Angebot anfragen</span></span></button>
      <a class="btn btn--lightghost btn--lg" href="${anker}"><span class="btn__t"><span>So läuft&rsquo;s ab</span><span>So läuft&rsquo;s ab</span></span></a>
    </div>`;

const FAQ_NAMEN = [
  { q: 'Was kostet eine Badekappe mit Namen?', a: 'Ab 50 Stück liegt ihr bei ungefähr 12,00 € pro Kappe. Der genaue Preis hängt von Modell, Menge, Druckseiten und Farbanzahl ab – nach eurer Anfrage bekommt ihr ein kostenloses, unverbindliches Angebot samt Design-Entwurf.' },
  { q: 'Ab wie vielen Kappen mit Namen kann ich bestellen?', a: 'Ab 50 Stück. Wichtig dabei: Die Menge zählt für die ganze Bestellung, nicht pro Name. Fünfzig verschiedene Namen kosten also keinen Cent mehr als fünfzig gleiche.' },
  { q: 'Wie liefere ich die Namensliste?', a: 'Am liebsten als Excel- oder Sheets-Liste mit einem Namen pro Zeile. Ihr könnt sie gleich bei der Anfrage mitschicken oder später per Mail nachreichen. Wir prüfen Schreibweisen und Sonderzeichen und schicken euch die Liste vor dem Druck noch einmal zur Freigabe.' },
  { q: 'Kann ich Name und Vereinslogo kombinieren?', a: 'Das ist sogar der Normalfall. Meistens kommen Logo und Vereinsname auf die eine Seite, der individuelle Name auf die andere. Bedrucken lassen sich beide Seiten mit bis zu sechs Farben.' },
  { q: 'Wie lange dauert die Produktion mit Namen?', a: 'Nach eurer Freigabe fünf bis sechs Wochen – rund eine Woche mehr als bei einheitlichem Druck, weil jede Kappe einzeln durch die Maschine geht. Wenn es schneller gehen muss, ist Express gegen Aufpreis möglich.' },
  { q: 'Was passiert, wenn jemand später dazukommt?', a: 'Nachbestellen geht, unterliegt aber wieder der Mindestmenge. Deshalb der Rat aus der Praxis: Plant ein paar Reservekappen ohne Namen ein. Das ist deutlich günstiger als eine zweite Bestellung im Frühjahr.' }
];
const FAQ_HAAR = [
  { q: 'Welche Badekappe ist die beste für lange Haare?', a: 'Eine Langhaar-Kappe aus Silikon. Sie hat das Extra-Volumen schon eingebaut, statt es aus dem Material herauszudehnen – der Zopf bekommt Platz, der Haaransatz Ruhe. Normale Silikonkappen sind für viel Haar schlicht zu knapp geschnitten. Stoffkappen tragen sich angenehm, halten aber kaum Wasser ab.' },
  { q: 'Bleiben die Haare unter der Badekappe trocken?', a: 'Ganz trocken nicht – dafür ist keine Badekappe gebaut. Eine gut sitzende Silikonkappe hält aber den Großteil des Wassers draußen und damit auch das meiste Chlor. Ein Trick aus dem Vereinsalltag: Haare vorher nass machen und etwas Conditioner einarbeiten. Gesättigtes Haar nimmt deutlich weniger Chlorwasser auf.' },
  { q: 'Wie setze ich eine Badekappe bei langen Haaren richtig auf?', a: 'Haare anfeuchten, flach zusammenbinden, tief im Nacken fixieren. Dann die Kappe mit beiden Händen aufspannen, an der Stirn ansetzen und nach hinten überziehen – nicht von oben aufstülpen, dabei verheddern sich Strähnen. Zum Schluss die Ränder an Ohren und Nacken glattstreichen.' },
  { q: 'Warum rutscht meine Badekappe ständig ab?', a: 'Meistens sitzt der Dutt zu hoch. Er wirkt dann wie ein Hebel und schiebt die Kappe bei jedem Abstoßen ein Stück nach vorn. Der zweite Klassiker ist eine zu kleine Kappe: Material, das schon gedehnt ist, hat keine Reserve mehr. Beides erledigt sich mit einer Langhaar-Kappe.' },
  { q: 'Zieht eine Badekappe an den Haaren?', a: 'Silikon deutlich weniger als Latex, die Oberfläche ist glatter. Gezogen wird ohnehin meist beim Ausziehen, nicht beim Schwimmen. Wer die Kappe von der Stirn nach hinten abrollt, statt sie ruckartig hochzureißen, verliert kaum Haare.' },
  { q: 'Gibt es Langhaar-Badekappen auch bedruckt für Vereine?', a: 'Ja, genau wie jedes andere Modell – mit Vereinslogo, Schriftzug, bis zu sechs Farben pro Seite, ab 50 Stück. Und ihr müsst euch nicht festlegen: In einer Bestellung könnt ihr Langhaar- und Standardkappen mischen, das Druckbild bleibt identisch.' }
];

function ld(slug, name, bild, offers, faq, crumb) {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://my-swimcap.de/' },
      { '@type': 'ListItem', position: 2, name: crumb || name, item: 'https://my-swimcap.de/' + slug }]},
    Object.assign({ '@type': 'Product', name: name, image: 'https://my-swimcap.de/Bilder/' + bild,
      material: 'Silikon', brand: { '@type': 'Organization', name: 'MySwimcap', '@id': 'https://my-swimcap.de/#organisation' } }, offers),
    { '@type': 'FAQPage', inLanguage: 'de-DE', mainEntity: faq.map(x => ({
      '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }] }, null, 2);
}

/* ---------------- Seite 1: Badekappen mit Namen ---------------- */
let p1 = B.head({ slug: 'badekappen-mit-namen',
  title: 'Badekappen mit Namen bedrucken – ab 50 Stück | MySwimcap',
  desc: 'Badekappen mit Namen bedrucken: jede Kappe mit eigenem Namen plus Vereinslogo. Ab 50 Stück, ab 12,00 € pro Kappe, kostenloser Design-Entwurf.',
  ogTitle: 'Badekappen mit Namen bedrucken – für jedes Teammitglied',
  ogDesc: 'Jede Kappe mit individuellem Namen, dazu euer Vereinslogo. Ab 50 Stück, ab 12,00 € pro Kappe, kostenloser Design-Entwurf.',
  jsonld: ld('badekappen-mit-namen', 'Badekappen mit Namen bedruckt', 'hero-namen.webp', {
    description: 'Badekappen mit individuellem Namen pro Kappe, kombiniert mit Vereinslogo. Siebdruck, bis zu 6 Farben pro Seite, Produktion in Europa.',
    offers: { '@type': 'Offer', priceCurrency: 'EUR', price: '12.00', priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/InStock', url: 'https://my-swimcap.de/badekappen-mit-namen',
      eligibleQuantity: { '@type': 'QuantitativeValue', minValue: 50, unitCode: 'C62' },
      seller: { '@type': 'Organization', name: 'ssM swimsportMedia GmbH' } } }, FAQ_NAMEN) })
+ `
<section class="phero">
  <div class="phero__bg"><img src="/Bilder/hero-namen.webp" alt="Schwimmerin mit bedruckter Vereins-Badekappe – Vereinslogo und individueller Name" width="1800" height="1005" fetchpriority="high" decoding="async" /></div>
  <div class="wrap">
    <span class="eyebrow reveal">Personalisierte Teamkappen</span>
    <h1 class="reveal">Badekappen mit Namen bedrucken – für jedes <em>Teammitglied</em>.</h1>
    <p class="lead reveal">Jede Kappe trägt ihren eigenen Namen, dazu euer Vereinslogo. Nichts wird mehr verwechselt, nichts mehr gesucht – und beim Wettkampf sieht man auf einen Blick, wer zusammengehört.</p>
    <div class="phero__tags reveal"><span>Ab 50 Stück</span><span>Ab 12,00 € pro Kappe</span><span>Kostenloser Design-Entwurf</span><span>Produktion in Europa</span></div>${heroBtns('#ablauf')}
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Warum Namen</span>
      <h2 style="margin-top:16px">Aus 50 gleichen Kappen werden 50 <em>persönliche</em>.</h2>
      <p class="lead" style="margin-top:14px">Ein paar Euro mehr pro Kappe. Dafür verschwinden drei Dinge, die im Vereinsalltag jede Woche nerven.</p>
    </div>
    <div class="scards reveal">
      <div class="scard"><b>01</b><h3>Schluss mit Verwechslungen</h3><p>Fünfzig gleiche schwarze Kappen auf einer Bank – da ist Streit programmiert. Steht ein Name drauf, ist die Sache in einer Sekunde geklärt.</p></div>
      <div class="scard"><b>02</b><h3>Trainer erkennen ihre Leute</h3><p>Vom Beckenrand aus sieht man vor allem Kappen. Wer auf Bahn drei gerade zu früh atmet, lässt sich mit Namen deutlich schneller ansprechen als mit „du da hinten".</p></div>
      <div class="scard"><b>03</b><h3>Bindung ans Team</h3><p>Eine Kappe mit dem eigenen Namen ist kein Ausrüstungsteil mehr, sondern etwas Eigenes. Wer schon mal gesehen hat, wie Zehnjährige ihre erste Vereinskappe auspacken, weiß, was gemeint ist.</p></div>
    </div>
  </div>
</section>

<section class="sec sec--linen">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Preis &amp; Menge</span>
      <h2 style="margin-top:16px">Was Badekappen mit Namen <em>kosten</em>.</h2>
      <p class="lead" style="margin-top:14px">Richtwerte zum Einordnen. Was ihr am Ende zahlt, hängt von Modell, Menge, Druckseiten und Farbanzahl ab – das Angebot bekommt ihr vorab und unverbindlich.</p>
    </div>
    <div class="ptable reveal"><table>
      <thead><tr><th scope="col">Variante</th><th scope="col">Ab Menge</th><th scope="col">Ab Preis</th><th scope="col">Passt für</th></tr></thead>
      <tbody>
        <tr><td><strong>Mit individuellen Namen</strong></td><td>50 Stück</td><td>ab 12,00 € / Kappe</td><td>Jede Kappe trägt einen eigenen Namen – plus Logo</td></tr>
        <tr><td><strong>Teambadekappe</strong></td><td>50 Stück</td><td>ab 6,50 € / Kappe</td><td>Einheitlicher Druck für Jahrgänge, Staffeln, Gruppen</td></tr>
        <tr><td><strong>Vereinsbadekappen</strong></td><td>100 Stück</td><td>ab 4,50 € / Kappe</td><td>Der ganze Verein, ein Auftritt – bester Stückpreis</td></tr>
      </tbody></table></div>
    <p class="pnote reveal">Die 50 Stück gelten für die <strong>ganze Bestellung</strong>, nicht pro Name. Fünfzig verschiedene Namen kosten also nicht mehr als fünfzig gleiche.</p>
  </div>
</section>

` + B.ablauf('Von der Namensliste zur fertigen <em>Kappe</em>.',
  ['01 — Anfrage', '02 — Kostenloses Design', '03 — Namensliste', '04 — Lieferung'],
  [{ h: 'Anfrage', p: 'Modell, Menge, Farben, Wunschtermin. Zwei Minuten im Formular – die Namensliste könnt ihr euch für später aufheben.', meta: '~ heute' },
   { h: 'Kostenloses Design', p: 'Wir setzen euer Logo auf die Kappe und zeigen an einem Beispielnamen, wie das Ganze wirkt. Kostenlos und unverbindlich.', meta: '1–2 Tage' },
   { h: 'Namensliste einreichen', p: 'Eine Excel- oder Sheets-Liste, ein Name pro Zeile. Wir gehen Schreibweisen, Umlaute und Sonderzeichen durch und schicken sie zur Freigabe zurück.', meta: 'vor dem Druck' },
   { h: 'Freigabe &amp; Lieferung', p: 'Erst nach eurem Go geht es in den Siebdruck. Express ist gegen Aufpreis möglich.', meta: '5–6 Wochen' }])
+ '\n\n' + B.faq('Häufige Fragen zu Badekappen mit <em>Namen</em>.', FAQ_NAMEN)
+ '\n\n' + B.cta('Schickt uns eure <em>Namensliste</em>.',
  'Den Rest machen wir. Entwurf kostenlos, ab 50 Stück, produziert in Europa.',
  'Ab <b>12,00 €</b> pro Kappe · ab 50 Stück',
  '/Bilder/hero-namen.webp', 'Bedruckte Badekappe mit Vereinslogo und individuellem Namen')
+ `

<section class="sec sec--stone">
  <div class="wrap">
    <div class="sec-head reveal"><span class="eyebrow">Weiterlesen</span><h2 style="margin-top:16px">Passt vielleicht auch.</h2></div>
    <div class="plinks reveal">
      <a href="/badekappen-fuer-lange-haare"><span>Ratgeber</span><b>Badekappen für lange Haare</b><p>Welche Kappe hält wirklich, wenn die Haare lang sind – und was das für euer Team bedeutet.</p></a>
      <a href="/"><span>Übersicht</span><b>Badekappen bedrucken lassen</b><p>Alle Modelle, Preise und der komplette Ablauf für Vereine und Teams.</p></a>
    </div>
  </div>
</section>
` + B.tail;
fs.writeFileSync(__dirname + '/../badekappen-mit-namen.html', p1);

/* ---------------- Seite 2: Badekappen für lange Haare ---------------- */
let p2 = B.head({ slug: 'badekappen-fuer-lange-haare',
  title: 'Badekappe für lange Haare – welche passt wirklich? | MySwimcap',
  desc: 'Welche Badekappe für lange Haare? Silikon, Stoff, 3D und Langhaar-Kappe im Vergleich – plus Tipps zum Aufsetzen und bedruckte Kappen für Vereine.',
  ogTitle: 'Badekappe für lange Haare – welche passt wirklich?',
  ogDesc: 'Silikon, Stoff, 3D und Langhaar-Kappe im Vergleich – plus Tipps zum Aufsetzen und bedruckte Langhaar-Kappen für Vereine.',
  jsonld: ld('badekappen-fuer-lange-haare', 'Langhaar-Badekappe, bedruckt', 'hero-langhaar.webp', {
    description: 'Badekappe mit extra Volumen für lange Haare, individuell mit Vereinslogo bedruckt. Siebdruck, bis zu 6 Farben pro Seite, Produktion in Europa.',
    offers: { '@type': 'AggregateOffer', priceCurrency: 'EUR', lowPrice: '4.50', highPrice: '12.00',
      availability: 'https://schema.org/InStock', url: 'https://my-swimcap.de/badekappen-fuer-lange-haare',
      eligibleQuantity: { '@type': 'QuantitativeValue', minValue: 50, unitCode: 'C62' },
      seller: { '@type': 'Organization', name: 'ssM swimsportMedia GmbH' } } }, FAQ_HAAR, 'Badekappen für lange Haare') })
+ `
<section class="phero phero--low">
  <div class="phero__bg"><img src="/Bilder/hero-langhaar.webp" alt="Schwimmerin von hinten mit bedruckter Vereins-Badekappe, lange Haare im Nacken" width="1800" height="1005" fetchpriority="high" decoding="async" /></div>
  <div class="wrap">
    <span class="eyebrow reveal">Ratgeber</span>
    <h1 class="reveal">Badekappe für lange Haare – welche passt <em>wirklich</em>?</h1>
    <p class="lead reveal">Zu eng, rutscht weg, zieht beim Ausziehen. Bei langen Haaren scheitern die meisten Kappen nicht am Material, sondern am Schnitt. Was wirklich hilft – und woran du eine passende Kappe erkennst.</p>
    <div class="phero__tags reveal"><span>Vier Modelle im Vergleich</span><span>Richtig aufsetzen</span><span>Für Vereine ab 50 Stück</span></div>${heroBtns('#vergleich')}
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Das Problem</span>
      <h2 style="margin-top:16px">Warum die meisten Kappen bei langen Haaren <em>aufgeben</em>.</h2>
    </div>
    <div class="ptext reveal">
      <p>Standardkappen sind für einen Kopf gerechnet – nicht für einen Kopf plus Zopf. Genau da liegt das Problem: Das zusätzliche Volumen muss irgendwo hin. Findet es keinen Platz, macht sich das auf drei Arten bemerkbar.</p>
      <p><strong>Sie sitzt zu stramm.</strong> Das Silikon ist schon am Anschlag gedehnt, bevor der Zopf überhaupt drin ist. Nach zweitausend Metern spürt man jeden Millimeter davon am Haaransatz.</p>
      <p><strong>Sie rutscht.</strong> Ein Dutt weit oben am Hinterkopf wirkt wie ein Hebel: Beim Abstoßen von der Wand schiebt er die Kappe Richtung Stirn. Spätestens nach der zweiten Wende sitzt sie schief.</p>
      <p><strong>Sie zieht.</strong> Gedehntes Material greift beim Abziehen mit. Wer nach jedem Training Haare in der Kappe findet, hat meist keine schlechte Kappe, sondern die falsche Größe.</p>
      <p>Eine Nummer größer löst das übrigens nicht – die sitzt am Kopf dann zu locker und läuft voll. Was hilft, ist Volumen an der richtigen Stelle: hinten, wo das Haar auch tatsächlich liegt.</p>
    </div>
  </div>
</section>

<section class="sec sec--linen" id="vergleich">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Vergleich</span>
      <h2 style="margin-top:16px">Vier Modelle, ehrlich <em>eingeordnet</em>.</h2>
      <p class="lead" style="margin-top:14px">Wir verkaufen alle vier. Deshalb steht hier auch, wo sie jeweils an ihre Grenze kommen.</p>
    </div>
    <div class="ptable reveal"><table>
      <thead><tr><th scope="col">Modell</th><th scope="col">Für lange Haare</th><th scope="col">Spricht dafür</th><th scope="col">Spricht dagegen</th></tr></thead>
      <tbody>
        <tr><td><strong>Langhaar-Badekappe</strong></td><td>Erste Wahl</td><td>Volumen sitzt schon im Schnitt, nicht in der Dehnung. Platz für Zopf und Dutt, Ruhe am Haaransatz</td><td>Bei kurzem Haar bleibt Luft in der Kappe</td></tr>
        <tr><td><strong>3D-Badekappe</strong></td><td>Funktioniert gut</td><td>Vorgeformt, legt sich faltenfrei an, überzeugende Passform bei mittellangem Haar</td><td>Bei sehr viel Haar reicht das Volumen nicht mehr</td></tr>
        <tr><td><strong>Silikon Premium</strong></td><td>Kommt an Grenzen</td><td>Hält Wasser zuverlässig ab, langlebig, kräftige Druckfarben</td><td>Der Standardschnitt wird bei viel Haar schnell zu knapp</td></tr>
        <tr><td><strong>Stoff (Lycra)</strong></td><td>Nur als Komfortlösung</td><td>Dünn, leicht, zieht praktisch nicht – angenehm bei empfindlicher Kopfhaut</td><td>Hält kaum Wasser ab und schützt die Haare entsprechend wenig</td></tr>
      </tbody></table></div>
    <p class="pnote reveal">Ein Trick, den man in Vereinen oft sieht: Stoffkappe direkt aufs Haar, Silikonkappe darüber. Das verbindet Tragekomfort und Wasserschutz – kostet allerdings zwei Kappen pro Person.</p>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Richtig aufsetzen</span>
      <h2 style="margin-top:16px">Der Sitz entscheidet mehr als das <em>Modell</em>.</h2>
      <p class="lead" style="margin-top:14px">Auch die richtige Kappe rutscht, wenn die Haare falsch liegen. Vier Handgriffe, die den Unterschied machen.</p>
    </div>
    <div class="bigband reveal" style="margin-top:34px">
      <img src="/Bilder/hero-aufsetzen.webp" alt="Schwimmerin zieht ihre bedruckte Vereins-Badekappe von vorn nach hinten über den Kopf" width="1800" height="1005" loading="lazy" decoding="async" />
    </div>
    <div class="scards scards--2 reveal">
      <div class="scard"><b>01</b><h3>Haare anfeuchten</h3><p>Nasses Haar liegt flach und gleitet unter das Material, statt sich davor zu stauen. Ein Klecks Conditioner dazu – dann nimmt es später auch weniger Chlorwasser auf.</p></div>
      <div class="scard"><b>02</b><h3>Tief binden, nicht hoch</h3><p>Flacher Zopf oder Dutt, aber tief im Nacken. Weiter oben wird jede Frisur zum Hebel, der die Kappe nach vorn drückt. Das ist mit Abstand der häufigste Grund fürs Rutschen.</p></div>
      <div class="scard"><b>03</b><h3>Von der Stirn nach hinten</h3><p>Kappe mit beiden Händen aufspannen, an der Stirn ansetzen, nach hinten überziehen. Wer sie von oben aufstülpt, zieht sich Strähnen mit hinein.</p></div>
      <div class="scard"><b>04</b><h3>Ränder nachziehen</h3><p>Zum Schluss an Ohren und Nacken glattstreichen. Jede Falte ist eine Stelle, an der Wasser hineinläuft und die Kappe sich zu lösen beginnt.</p></div>
    </div>
  </div>
</section>

` + B.ablauf('In vier Schritten ins <em>Becken</em>.',
  ['01 — Anfrage', '02 — Kostenloses Design', '03 — Freigabe &amp; Druck', '04 — Lieferung'],
  [{ h: 'Anfrage', p: 'Modell, ungefähre Stückzahl und euer Logo schicken – dauert keine drei Minuten. Langhaar- und Standardkappen könnt ihr mischen.', meta: '~ heute' },
   { h: 'Kostenloses Design', p: 'Wir legen euer Logo auf die Kappe, bereiten den Druck auf und schicken euch einen Entwurf samt Angebot.', meta: '1–2 Tage' },
   { h: 'Freigabe &amp; Druck', p: 'Ihr gebt frei, wir produzieren im Siebdruck in Europa. Erst nach eurem Go.', meta: 'Produktion' },
   { h: 'Lieferung', p: 'Fertig verpackt bei euch, inklusive Sendungsverfolgung. Express ist gegen Aufpreis möglich.', meta: '4–5 Wochen' }])
+ '\n\n' + B.faq('Häufige Fragen zu langen Haaren <em>unter</em> der Kappe.', FAQ_HAAR)
+ '\n\n' + B.cta('Eine Bestellung, <em>jede</em> Kopfform.',
  'Schickt uns euer Logo – den Rest machen wir. Entwurf kostenlos, ab 50 Stück, produziert in Europa.',
  'Schon ab <b>4,50 €</b> pro Stück · ab 50 Stück',
  '/Bilder/hero-langhaar.webp', 'Schwimmerin mit bedruckter Langhaar-Badekappe')
+ `

<section class="sec sec--stone">
  <div class="wrap">
    <div class="sec-head reveal"><span class="eyebrow">Weiterlesen</span><h2 style="margin-top:16px">Passt vielleicht auch.</h2></div>
    <div class="plinks reveal">
      <a href="/badekappen-mit-namen"><span>Personalisierung</span><b>Badekappen mit Namen bedrucken</b><p>Jede Kappe mit eigenem Namen – ab 50 Stück, ab 12,00 € pro Kappe.</p></a>
      <a href="/"><span>Übersicht</span><b>Badekappen bedrucken lassen</b><p>Alle Modelle, Preise und der komplette Ablauf für Vereine und Teams.</p></a>
    </div>
  </div>
</section>
` + B.tail;
fs.writeFileSync(__dirname + '/../badekappen-fuer-lange-haare.html', p2);

console.log('badekappen-mit-namen.html:      ' + Math.round(p1.length / 1024) + ' KB');
console.log('badekappen-fuer-lange-haare.html: ' + Math.round(p2.length / 1024) + ' KB');
