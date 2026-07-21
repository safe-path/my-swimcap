/* ============================================================
   MySwimcap — Analytics (Mixpanel) mit Einwilligung
   ------------------------------------------------------------
   WICHTIG: Vor der Einwilligung geht KEIN Request an Mixpanel.
   Das SDK liegt lokal unter /js/mixpanel.min.js und wird erst
   nach aktivem Klick auf "Statistik erlauben" nachgeladen.
   Das ist strenger als Mixpanels eigene Empfehlung
   (opt_out_tracking_by_default) — die laedt das SDK bereits vor
   der Einwilligung, womit die IP schon uebertragen waere.

   Getrackt werden ausschliesslich anonyme Auswahlwerte.
   NIEMALS: Name, E-Mail, Verein, Notiz, Dateiname des Logos.
   ============================================================ */
(function () {
  'use strict';

  var TOKEN    = 'fc1e9e34ed261361678df8ef05a87c68';
  /* EU-Datenresidenz. Voraussetzung: Das Mixpanel-Projekt muss in der
     EU-Region liegen. Liegt es in den USA, hier auf
     'https://api.mixpanel.com' aendern — sonst kommen keine Daten an. */
  var API_HOST = 'https://api-eu.mixpanel.com';
  var LIB      = '/js/mixpanel.min.js';
  var KEY      = 'sc_consent';          /* 'granted' | 'denied' */
  var bereit = false, erlaubt = false;

  /* Offizielles Mixpanel-Snippet (Stand: Mixpanel-Doku "Connect your data").
     Wird NICHT beim Seitenaufruf ausgefuehrt, sondern erst nach Einwilligung.
     Es legt den Stub an (window.mixpanel, __SV) und laedt die Bibliothek aus
     MIXPANEL_CUSTOM_LIB_URL — deshalb muss die Variable vorher gesetzt sein.
     Die Bibliothek allein funktioniert nicht: sie prueft __SV und bricht sonst ab. */
  function snippet() {
    (function (f, b) { if (!b.__SV) { var e, g, i, h; window.mixpanel = b; b._i = []; b.init = function (e, f, c) { function g(a, d) { var b = d.split("."); 2 == b.length && ((a = a[b[0]]), (d = b[1])); a[d] = function () { a.push([d].concat(Array.prototype.slice.call(arguments, 0))); }; } var a = b; "undefined" !== typeof c ? (a = b[c] = []) : (c = "mixpanel"); a.people = a.people || []; a.toString = function (a) { var d = "mixpanel"; "mixpanel" !== c && (d += "." + c); a || (d += " (stub)"); return d; }; a.people.toString = function () { return a.toString(1) + ".people (stub)"; }; i = "disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" "); for (h = 0; h < i.length; h++) g(a, i[h]); var j = "set set_once union unset remove delete".split(" "); a.get_group = function () { function b(c) { d[c] = function () { call2_args = arguments; call2 = [c].concat(Array.prototype.slice.call(call2_args, 0)); a.push([e, call2]); }; } for (var d = {}, e = ["get_group"].concat(Array.prototype.slice.call(arguments, 0)), c = 0; c < j.length; c++) b(j[c]); return d; }; b._i.push([e, f, c]); }; b.__SV = 1.2; e = f.createElement("script"); e.type = "text/javascript"; e.async = !0; e.src = "undefined" !== typeof MIXPANEL_CUSTOM_LIB_URL ? MIXPANEL_CUSTOM_LIB_URL : "file:" === f.location.protocol && "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\/\//) ? "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js" : "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"; g = f.getElementsByTagName("script")[0]; g.parentNode.insertBefore(e, g); } })(document, window.mixpanel || []);
  }

  function status()      { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function merke(v)      { try { localStorage.setItem(KEY, v); } catch (e) {} }

  /* ---------- Kontext, der an jedes Event geht (Super Properties) ---------- */
  function seitentyp() {
    var p = location.pathname.replace(/\/$/, '');
    if (p === '' ) return 'startseite';
    if (p === '/badekappen-mit-namen') return 'spoke_namen';
    if (p === '/badekappen-fuer-lange-haare') return 'spoke_langhaar';
    if (p === '/impressum' || p === '/datenschutz') return 'rechtliches';
    return 'sonstige';
  }
  function superProps() {
    return {
      platform:  'web',
      page_type: seitentyp(),
      site_language: (window.__lang || document.documentElement.lang || 'de')
    };
  }

  /* ---------- SDK erst nach Einwilligung laden ---------- */
  function starten(cb) {
    if (bereit) { cb && cb(); return; }
    window.MIXPANEL_CUSTOM_LIB_URL = LIB;   /* muss VOR dem Snippet stehen */
    snippet();
    if (!window.mixpanel) return;
    /* Der Stub puffert diese Aufrufe und spielt sie ab, sobald die
       Bibliothek geladen ist — deshalb kein onload-Warten noetig. */
    window.mixpanel.init(TOKEN, {
      api_host: API_HOST,
      persistence: 'localStorage',        /* keine Cookies */
      ip: false,                          /* keine IP-Speicherung/Geo-Anreicherung */
      opt_out_tracking_by_default: true,  /* zweite Sperre */
      debug: false
    });
    window.mixpanel.opt_in_tracking();    /* erst jetzt — nach echtem Klick */
    window.mixpanel.register(superProps());
    bereit = true; erlaubt = true;
    cb && cb();
  }

  /* ---------- Oeffentliche Track-Funktion ---------- */
  function track(name, props) {
    /* Guard auf eigenem Flag statt has_opted_in_tracking(): solange nur der
       Stub da ist, liefert die SDK-Abfrage undefined und wuerde alles blocken. */
    if (!erlaubt || !window.mixpanel) return;
    try { window.mixpanel.track(name, props || {}); } catch (e) {}
  }
  window.scTrack = track;

  /* ---------- Einwilligungs-Banner ---------- */
  function banner() {
    var el = document.createElement('div');
    el.className = 'cc';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Einwilligung Statistik');
    var en = (window.__lang === 'en');
    el.innerHTML =
      '<div class="cc__in">' +
        '<p class="cc__t">' + (en
          ? 'We would like to measure anonymously which pages are used and where requests break off. Nothing is loaded or transmitted until you agree. No cookies, no advertising, no data sale.'
          : 'Wir würden gern anonym messen, welche Seiten genutzt werden und wo Anfragen abbrechen. Vor deiner Zustimmung wird nichts geladen und nichts übertragen. Keine Cookies, keine Werbung, kein Datenverkauf.') +
          ' <a href="/datenschutz">' + (en ? 'Privacy policy' : 'Datenschutzerklärung') + '</a></p>' +
        '<div class="cc__btns">' +
          '<button type="button" class="cc__b" data-cc="denied">'  + (en ? 'Decline'  : 'Ablehnen') + '</button>' +
          '<button type="button" class="cc__b cc__b--ja" data-cc="granted">' + (en ? 'Allow statistics' : 'Statistik erlauben') + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    /* setTimeout statt requestAnimationFrame: rAF feuert in Hintergrund-Tabs
       gar nicht — das Banner waere dort unsichtbar und nicht bedienbar. */
    setTimeout(function () { el.classList.add('show'); }, 40);

    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cc]'); if (!b) return;
      var wahl = b.dataset.cc;
      merke(wahl);
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 320);
      if (wahl === 'granted') starten(function () { seitenaufruf(); });
    });
  }

  /* ---------- Events ---------- */
  function seitenaufruf() {
    var ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname : '(direkt)'; } catch (e) { ref = '(unbekannt)'; }
    if (ref === location.hostname) ref = '(intern)';
    track('page_viewed', { page_path: location.pathname, referrer_domain: ref });
  }

  function verdrahten() {
    /* Anfrage-Modal: geoeffnet / Schritt geschafft / abgeschickt / abgebrochen.
       Die Signale kommen als CustomEvent aus dem Wizard in index.html. */
    document.addEventListener('sc:modal-opened', function (e) {
      track('request_modal_opened', { source: (e.detail && e.detail.source) || 'unbekannt' });
    });
    document.addEventListener('sc:step-completed', function (e) {
      track('request_step_completed', {
        step_number: e.detail && e.detail.step,
        step_name:   e.detail && e.detail.name
      });
    });
    document.addEventListener('sc:request-submitted', function (e) {
      track('request_submitted', e.detail || {});     /* Value Moment */
    });
    document.addEventListener('sc:modal-abandoned', function (e) {
      track('request_abandoned', { last_step: e.detail && e.detail.step });
    });

    /* FAQ */
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.q button'); if (!b) return;
      if (b.getAttribute('aria-expanded') === 'true') return;   /* nur beim Aufklappen */
      var f = b.querySelector('span');
      track('faq_opened', { question: f ? f.textContent.trim().slice(0, 90) : '' });
    });

    /* CTA-Klicks */
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-open-modal], .btn'); if (!b) return;
      if (b.closest('.modal') || b.closest('.cc')) return;
      var t = (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      if (!t) return;
      var sek = b.closest('section');
      track('cta_clicked', {
        cta_label: t,
        cta_location: b.closest('.nav') ? 'nav'
          : b.closest('.footer') ? 'footer'
          : (sek && (sek.id || sek.className.split(' ')[0])) || 'sonstige'
      });
    });

    /* Sprachwechsel */
    document.addEventListener('langchange', function () {
      if (bereit && window.mixpanel) window.mixpanel.register(superProps());
      track('language_switched', { to_language: window.__lang || 'de' });
    });
  }

  /* ---------- Start ---------- */
  function los() {
    verdrahten();
    var s = status();
    if (s === 'granted') { starten(function () { seitenaufruf(); }); }
    else if (s !== 'denied') { banner(); }
    /* 'denied' -> gar nichts, kein Banner, kein Request */
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los);
  else los();

  /* Widerruf: window.scConsentZuruecksetzen() in der Konsole
     -> Banner erscheint beim naechsten Laden erneut. */
  window.scConsentZuruecksetzen = function () {
    try {
      localStorage.removeItem(KEY);
      if (window.mixpanel) window.mixpanel.opt_out_tracking();
    } catch (e) {}
    location.reload();
  };
})();
