/* =========================================================
   HÉLIOS — Interações (JavaScript puro)
   ========================================================= */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('menu-principal');
  var toTop = document.getElementById('to-top');

  /* ---------- Menu mobile ---------- */
  function setMenu(open) {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (menu.classList.contains('open') && !menu.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 980) setMenu(false); });

  /* ---------- Navegação suave ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      setMenu(false);
      var top = id === '#inicio' ? 0 : target.getBoundingClientRect().top + window.pageYOffset - header.offsetHeight + 1;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------- Cabeçalho, botão de topo e link ativo ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var trackedSections = navLinks.map(function (l) { return document.querySelector(l.getAttribute('href')); });

  // Seções que não têm link próprio no menu mapeiam para o link mais próximo
  var extraMap = { sobre: 'inicio', plataforma: 'engenharia', diferenciais: 'investimento', encerramento: 'investimento' };

  function onScroll() {
    var y = window.pageYOffset;
    header.classList.toggle('scrolled', y > 24);
    toTop.classList.toggle('visible', y > 700);

    var probe = y + header.offsetHeight + window.innerHeight * 0.25;
    var currentId = 'inicio';
    document.querySelectorAll('main > section[id]').forEach(function (sec) {
      if (sec.offsetTop <= probe) currentId = sec.id;
    });
    var activeId = extraMap[currentId] || currentId;
    navLinks.forEach(function (l) {
      var on = l.getAttribute('href') === '#' + activeId;
      l.classList.toggle('active', on);
      if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
    });
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(function () { onScroll(); ticking = false; }); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Animações de entrada ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        setTimeout(function () { el.classList.add('in'); }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Dados financeiros (plano de negócios) ---------- */
  var investment = [
    { name: 'Prototipagem e engenharia', value: 55000, color: '#F0D69A' },
    { name: 'Matéria-prima e lote inicial', value: 35000, color: '#D8AD62' },
    { name: 'Marketing de lançamento', value: 30000, color: '#B98A3E' },
    { name: 'Capital de giro', value: 20000, color: '#8F8579' },
    { name: 'Burocracia e certificações', value: 10000, color: '#E8E0D2' }
  ];
  var TOTAL = 150000;

  function brl(n) { return 'R$ ' + n.toLocaleString('pt-BR'); }
  function pct(n) { return (n / TOTAL * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%'; }

  // Confere a consistência: a soma das categorias deve ser R$ 150.000
  var sum = investment.reduce(function (a, i) { return a + i.value; }, 0);
  if (sum !== TOTAL) console.warn('HÉLIOS: a soma do investimento (' + sum + ') difere de ' + TOTAL + '.');

  /* ---------- Gráfico de rosca (SVG puro) ---------- */
  var donut = document.getElementById('donut');
  var svg = donut.querySelector('svg');
  var legend = document.getElementById('legend');
  var cLabel = document.getElementById('donut-label');
  var cValue = document.getElementById('donut-value');
  var cPct = document.getElementById('donut-pct');
  var NS = 'http://www.w3.org/2000/svg';
  var R = 76, C = 2 * Math.PI * R, GAP = 3;

  var segs = [], items = [];
  var offset = 0;

  var track = document.createElementNS(NS, 'circle');
  track.setAttribute('cx', 100); track.setAttribute('cy', 100); track.setAttribute('r', R);
  track.setAttribute('fill', 'none'); track.setAttribute('stroke', 'rgba(216,173,98,.08)'); track.setAttribute('stroke-width', 26);
  svg.appendChild(track);

  investment.forEach(function (item, i) {
    var len = item.value / TOTAL * C;

    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('class', 'donut-seg');
    c.setAttribute('cx', 100); c.setAttribute('cy', 100); c.setAttribute('r', R);
    c.setAttribute('stroke', item.color);
    c.setAttribute('stroke-dasharray', '0 ' + C);
    c.setAttribute('stroke-dashoffset', -offset);
    c.dataset.len = Math.max(len - GAP, 1);
    svg.appendChild(c);
    segs.push(c);
    offset += len;

    var li = document.createElement('li');
    li.tabIndex = 0;
    li.innerHTML =
      '<span class="swatch" style="background:' + item.color + '"></span>' +
      '<span class="l-name">' + item.name + '</span>' +
      '<span class="l-val">' + brl(item.value) + '<span class="l-pct">' + pct(item.value) + '</span></span>';
    legend.appendChild(li);
    items.push(li);

    [c, li].forEach(function (el) {
      el.addEventListener('mouseenter', function () { highlight(i); });
      el.addEventListener('mouseleave', reset);
    });
    li.addEventListener('focus', function () { highlight(i); });
    li.addEventListener('blur', reset);
  });

  function highlight(i) {
    segs.forEach(function (s, k) { s.classList.toggle('hl', k === i); s.classList.toggle('dim', k !== i); });
    items.forEach(function (l, k) { l.classList.toggle('hl', k === i); });
    cLabel.textContent = investment[i].name;
    cValue.textContent = brl(investment[i].value);
    cPct.textContent = pct(investment[i].value);
  }
  function reset() {
    segs.forEach(function (s) { s.classList.remove('hl', 'dim'); });
    items.forEach(function (l) { l.classList.remove('hl'); });
    cLabel.textContent = 'Total';
    cValue.textContent = brl(TOTAL);
    cPct.textContent = '100%';
  }

  function drawDonut() {
    segs.forEach(function (s, i) {
      var len = s.dataset.len;
      setTimeout(function () {
        s.style.transition = reduceMotion ? 'none' : 'stroke-dasharray 1s cubic-bezier(.22,.61,.36,1), stroke-width .25s, opacity .25s';
        s.setAttribute('stroke-dasharray', len + ' ' + (C - len));
      }, reduceMotion ? 0 : i * 140);
    });
  }

  /* ---------- Linha do tempo (barras) ---------- */
  function drawTimeline() {
    document.querySelectorAll('#timeline .tl-col').forEach(function (col, i) {
      var v = parseFloat(col.dataset.value), m = parseFloat(col.dataset.max);
      var bar = col.querySelector('.tl-bar');
      setTimeout(function () { bar.style.height = (v / m * 100) + '%'; }, reduceMotion ? 0 : i * 200);
    });
  }

  /* ---------- Contador animado do investimento ---------- */
  function countUp(el) {
    var end = parseInt(el.dataset.count, 10);
    if (reduceMotion) { el.textContent = end.toLocaleString('pt-BR'); return; }
    var start = null, dur = 1600;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased).toLocaleString('pt-BR');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Diagrama de funcionamento (Engenharia) ---------- */
  var flow = document.getElementById('flow');
  var nodes = document.querySelectorAll('.flow-node');
  var dTag = document.getElementById('flow-detail-tag');
  var dTitle = document.getElementById('flow-detail-title');
  var dText = document.getElementById('flow-detail-text');

  if (flow && nodes.length) {
    var steps = Array.prototype.slice.call(flow.querySelectorAll('.flow-node'));
    var pulseIdx = 0, pulseTimer = null, userTouched = false;

    // Destaque sequencial suave que mostra o caminho da energia (para ao primeiro clique)
    var pulse = function () {
      steps.forEach(function (s, k) { s.classList.toggle('pulse', k === pulseIdx); });
      pulseIdx = (pulseIdx + 1) % steps.length;
    };
    var stopPulse = function () {
      clearInterval(pulseTimer); pulseTimer = null;
      steps.forEach(function (s) { s.classList.remove('pulse'); });
    };
    var startPulse = function () {
      if (pulseTimer || userTouched || reduceMotion) return;
      pulse();
      pulseTimer = setInterval(pulse, 1800);
    };

    nodes.forEach(function (btn) {
      btn.addEventListener('click', function () {
        userTouched = true; stopPulse();
        nodes.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        dTag.textContent = btn.dataset.tag;
        dTitle.textContent = btn.dataset.title;
        dText.textContent = btn.dataset.info;
      });
    });

    if ('IntersectionObserver' in window && !reduceMotion) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) startPulse(); else stopPulse();
      }, { threshold: 0.4 }).observe(flow);
    }
  }

  /* Dispara cada animação quando o elemento aparece na tela */
  function whenVisible(el, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var o = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { fn(); o.disconnect(); }
    }, { threshold: 0.3 });
    o.observe(el);
  }
  whenVisible(donut, drawDonut);
  whenVisible(document.getElementById('timeline'), drawTimeline);
  var counter = document.querySelector('[data-count]');
  whenVisible(counter, function () { countUp(counter); });
})();