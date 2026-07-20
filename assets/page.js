/* MySwimcap — Unterseiten.
   Dieselben Verhaltensweisen wie auf der Startseite, nur ohne Wizard/Modal.
   Die Komponenten (Nav, Ablauf, FAQ, CTA, Footer) sind identisch, also muss
   auch das Verhalten identisch sein. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* Reveals (IntersectionObserver) — sonst bleibt alles unsichtbar */
  var els = [].slice.call(document.querySelectorAll('.reveal'));
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (e) { e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* Nav: Zustand beim Scrollen */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', scrollY > 12); };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Mobilmenü */
  var burger = document.getElementById('burger'), mmenu = document.getElementById('mmenu');
  if (burger && mmenu) {
    burger.addEventListener('click', function () {
      var open = mmenu.classList.toggle('open');
      document.documentElement.classList.toggle('menu-open', open);
    });
    mmenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mmenu.classList.remove('open');
        document.documentElement.classList.remove('menu-open');
      });
    });
  }

  /* Sticky-Ablauf — identisch zur Startseite */
  (function () {
    var fill = document.getElementById('railFill'),
        steps = [].slice.call(document.querySelectorAll('#railSteps li')),
        blocks = [].slice.call(document.querySelectorAll('#pblocks .pb'));
    if (!fill || !blocks.length) return;
    function upd() {
      var c = innerHeight * 0.5, active = -1;
      blocks.forEach(function (b, i) { if (b.getBoundingClientRect().top < c) active = i; });
      if (active < 0) active = 0;
      steps.forEach(function (l, i) { l.classList.toggle('on', i <= active); });
      fill.style.height = ((active + 1) / blocks.length * 100) + '%';
    }
    addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd);
    upd();
  })();

  /* FAQ-Akkordeon — identisch zur Startseite */
  document.querySelectorAll('.q button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true',
          a = btn.parentElement.querySelector('.a');
      btn.setAttribute('aria-expanded', String(!open));
      a.style.maxHeight = open ? null : a.scrollHeight + 'px';
      var faq = document.getElementById('faq');
      if (faq) faq.classList.toggle('faq-open', !!document.querySelector('.q button[aria-expanded="true"]'));
    });
  });

  /* Die Bestell-Buttons stammen aus den Startseiten-Komponenten und tragen
     data-open-modal. Hier gibt es kein Modal -> zum Formular der Startseite. */
  document.querySelectorAll('[data-open-modal]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      location.href = '/#anfrage';
    });
  });
})();
