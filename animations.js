/* Animaciones de Dental Gastelum (JS propio, sin librerías).
   - ?captura=1 o prefers-reduced-motion: no hace nada (todo en su estado final).
   - Si algo falla: deshace todo y el contenido queda completo.
   - Nunca toca lo marcado con [data-hide] (reseñas, chip de calificación). */
(function () {
  'use strict';

  var root = document.documentElement;
  var CLEAN_MS = 900; // transición (800 ms máx) + margen, antes de soltar el estado animado

  function qsa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function allowed(el) { return !el.closest('[data-hide]') && !el.hasAttribute('data-anim'); }

  function undo() {
    qsa('[data-anim]').forEach(function (el) {
      el.removeAttribute('data-anim');
      el.removeAttribute('data-anim-step');
      el.classList.remove('is-in');
      el.style.removeProperty('--anim-d');
    });
    qsa('[data-anim-pulse]').forEach(function (el) { el.removeAttribute('data-anim-pulse'); });
    root.classList.remove('anim-on');
  }

  // Suelta el estado animado: el estado final equivale al estilo base, sin salto visual.
  function release(el, delay) {
    setTimeout(function () {
      el.removeAttribute('data-anim');
      el.removeAttribute('data-anim-step');
      el.classList.remove('is-in');
      el.style.removeProperty('--anim-d');
    }, delay + CLEAN_MS);
  }

  function init() {
    var hero = [];
    var reveal = [];

    // kind: 'hero' (al cargar) o 'reveal' (al hacer scroll); step: escalonado en ms
    function tag(sel, kind, opts) {
      opts = opts || {};
      var list = qsa(sel).filter(allowed);
      list.forEach(function (el, i) {
        el.setAttribute('data-anim', kind);
        if (kind === 'hero') {
          el.style.setProperty('--anim-d', ((opts.base || 0) + i * (opts.step || 0)) + 'ms');
          hero.push(el);
        } else {
          if (opts.step) el.setAttribute('data-anim-step', String(opts.step));
          reveal.push(el);
        }
      });
    }

    // ---------- Escritorio ----------
    var D = '#view-desktop ';
    tag(D + '#inicio .grid > div:first-child > *', 'hero', { step: 110 });
    tag(D + '#inicio .grid > div:last-child', 'hero', { base: 380 });
    tag(D + '#sobre-el-doctor > div', 'reveal');
    tag(D + '#servicios .text-center', 'reveal');
    tag(D + '#servicios [data-purpose="service-card"]', 'reveal', { step: 100 });
    var ctaBtn = document.querySelector(D + '[data-purpose="intermediate-whatsapp-cta"]');
    var ctaBox = ctaBtn && ctaBtn.closest('section > div');
    if (ctaBox) { ctaBox.setAttribute('data-cta-box', ''); tag('[data-cta-box]', 'reveal'); }
    tag(D + '#horario-ubicacion .text-center', 'reveal');
    tag(D + '#horario-ubicacion .grid > div', 'reveal', { step: 120 });
    tag(D + 'footer > div > *', 'reveal', { step: 100 });

    // ---------- Móvil ----------
    var M = '#view-mobile ';
    tag(M + '#m-inicio > *', 'hero', { step: 110 });
    tag(M + '#m-sobre-el-doctor > *', 'reveal', { step: 100 });
    tag(M + '#m-servicios > div:first-child', 'reveal');
    tag(M + '#m-servicios > div:last-child > div', 'reveal', { step: 100 });
    tag(M + '#m-servicios + section', 'reveal'); // banner intermedio
    tag(M + '#m-horario-ubicacion > *', 'reveal', { step: 100 });
    tag(M + '#m-horario-ubicacion + section > *', 'reveal', { step: 100 }); // cierre + contacto

    // Botón flotante de WhatsApp: pulso (3 ciclos, definido en el CSS)
    var fab = document.querySelector(M + '[data-path="chat-support"]');
    if (fab && !fab.closest('[data-hide]')) fab.setAttribute('data-anim-pulse', '');

    // El JS cargó: a partir de aquí sí se ocultan los elementos
    root.classList.add('anim-on');
    void root.offsetWidth; // fija el estado inicial antes de animar

    // Hero: entra al cargar (texto y luego imagen)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        hero.forEach(function (el) {
          el.classList.add('is-in');
          release(el, parseInt(el.style.getPropertyValue('--anim-d'), 10) || 0);
        });
      });
    });

    // Secciones: una sola vez, al entrar en pantalla
    var io = new IntersectionObserver(function (entries) {
      var k = 0; // posición dentro del lote, para el escalonado
      entries.forEach(function (en) {
        var el = en.target;
        var passed = !en.isIntersecting && en.boundingClientRect.top < 0; // ya quedó arriba (ancla/scroll rápido)
        if (!en.isIntersecting && !passed) return;
        io.unobserve(el);
        var step = parseInt(el.getAttribute('data-anim-step'), 10) || 0;
        var delay = 0;
        if (passed) {
          el.style.transition = 'none';
        } else if (step) {
          delay = k * step;
          k++;
        }
        el.style.setProperty('--anim-d', delay + 'ms');
        el.classList.add('is-in');
        release(el, delay);
        if (passed) setTimeout(function () { el.style.removeProperty('transition'); }, 50);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveal.forEach(function (el) { io.observe(el); });
  }

  try {
    var captura = new URLSearchParams(window.location.search).get('captura') === '1';
    var reducir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (captura || reducir || !('IntersectionObserver' in window)) return;
    init();
  } catch (e) {
    undo();
    if (window.console) console.warn('animations.js desactivado:', e);
  }
})();
