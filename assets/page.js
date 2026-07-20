/* MySwimcap — Unterseiten. FAQ-Akkordeon, identisch zur Startseite. */
document.querySelectorAll('.q button').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') === 'true';
    var a = btn.parentElement.querySelector('.a');
    btn.setAttribute('aria-expanded', String(!open));
    a.style.maxHeight = open ? null : a.scrollHeight + 'px';
  });
});
