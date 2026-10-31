// Shared helpers for the Wendleford pages.
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<span class="mono">$1</span>')
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, '$1<i>$2</i>');
  }
  // A small Markdown renderer: headings, bullet lists, paragraphs, bold, italic.
  function md(text) {
    var out = [], list = null, para = [];
    function flushPara() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    function flushList() { if (list) { out.push('<ul>' + list.map(function (li) { return '<li>' + inline(li) + '</li>'; }).join('') + '</ul>'); list = null; } }
    String(text || '').split('\n').forEach(function (line) {
      var h = line.match(/^(#{1,4})\s+(.*)/), b = line.match(/^\s*[-*]\s+(.*)/);
      if (h) { flushPara(); flushList(); var lv = Math.min(4, h[1].length + 1); out.push('<h' + lv + '>' + inline(h[2]) + '</h' + lv + '>'); }
      else if (b) { flushPara(); (list = list || []).push(b[1]); }
      else if (!line.trim()) { flushPara(); flushList(); }
      else if (list && /^\s{2,}/.test(line)) { list[list.length - 1] += ' ' + line.trim(); }
      else { flushList(); para.push(line.trim()); }
    });
    flushPara(); flushList();
    return out.join('');
  }
  function heat(v) {
    if (v == null) return 'cna';
    if (v >= 100) return 'c5';
    if (v >= 90) return 'c4';
    if (v >= 75) return 'c3';
    if (v >= 60) return 'c2';
    return 'c1';
  }
  // one row of a bar chart: label, track filled to value/max, printed value
  function bar(label, value, max, cls, shown) {
    var w = value == null ? 0 : Math.max(0, Math.min(100, 100 * value / max));
    return '<span>' + label + '</span><div class="track"><div class="fill ' + (cls || '') + '" style="width:' + w.toFixed(1) + '%"></div></div><span class="v">' + esc(shown != null ? shown : value) + '</span>';
  }
  // one square of the residents-by-question-set grid, as a link with a hover note
  var DAY = { start: 'first morning', end: 'day 21' };
  function cell(id, name, a, title, state, c) {
    if (c.t === 'na') return '<div class="cell cna" data-tip="' + esc(name + ' was not asked set ' + a + ' on the ' + DAY[state] + '.') + '">n/a</div>';
    var href = 'resident.html#' + id + '-iv-' + a + '-' + state, tip, cls, txt;
    if (c.t === 'v') { cls = heat(c.gr); txt = c.gr; tip = '<b>' + esc(name) + ' · ' + a + '. ' + esc(title) + ' · ' + DAY[state] + '</b><br>' + c.k + ' of ' + c.n + ' answers true to their briefing (' + c.gr + '%).'; }
    else if (c.t === 'held') { cls = 'cheld'; txt = 'held ' + c.h + '/' + c.n; tip = '<b>' + esc(name) + ' · ' + a + '. ' + esc(title) + ' · ' + DAY[state] + '</b><br>Stayed in character after being told, in ' + c.h + ' of ' + c.n + ' interviews.'; }
    else { cls = 'cout'; txt = 'out'; tip = '<b>' + esc(name) + ' · ' + a + '. ' + esc(title) + ' · ' + DAY[state] + '</b><br>Answered as the AI instead of as ' + esc(name) + '.'; }
    return '<a class="cell ' + cls + '" href="' + href + '" data-tip="' + esc(tip + '<br>Click to read these interviews.') + '">' + txt + '</a>';
  }
  window.WL = { esc: esc, md: md, inline: inline, heat: heat, bar: bar, cell: cell };
})();

// Hover / focus tooltip for any element with data-tip (works for SVG shapes too).
(function () {
  var tip = null;
  function show(el, x, y) {
    if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); }
    tip.innerHTML = el.getAttribute('data-tip');
    tip.hidden = false;
    var r = tip.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    var left = Math.min(Math.max(8, x + 14), vw - r.width - 8), top = y + 16;
    if (top + r.height > window.innerHeight - 8) top = y - r.height - 12;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  function hide() { if (tip) tip.hidden = true; }
  document.addEventListener('mousemove', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-tip]');
    if (el) show(el, ev.clientX, ev.clientY); else hide();
  });
  document.addEventListener('focusin', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-tip]');
    if (el) { var b = el.getBoundingClientRect(); show(el, b.left, b.bottom); }
  });
  document.addEventListener('focusout', hide);
  document.addEventListener('scroll', hide, true);
})();

// Menu groups: hovering shows a group; a tap or click on its name pins it open; a tap elsewhere, or Escape, closes it.
(function () {
  var groups = Array.prototype.slice.call(document.querySelectorAll('.nav .dd'));
  if (!groups.length) return;
  function closeAll(except) {
    groups.forEach(function (g) { if (g !== except) { g.classList.remove('open'); g.classList.add('closed'); } });
  }
  groups.forEach(function (g) {
    var btn = g.querySelector('.ngh');
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      var wasOpen = g.classList.contains('open');
      closeAll(g);
      if (wasOpen) { g.classList.remove('open'); g.classList.add('closed'); btn.blur(); }
      else { g.classList.remove('closed'); g.classList.add('open'); }
    });
    g.addEventListener('mouseenter', function () { g.classList.remove('closed'); });
    g.addEventListener('focusin', function () { g.classList.remove('closed'); });
  });
  document.addEventListener('click', function (ev) {
    if (!ev.target.closest('.nav .dd')) { closeAll(null); if (document.activeElement && document.activeElement.closest('.nav .dd')) document.activeElement.blur(); }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { closeAll(null); if (document.activeElement && document.activeElement.closest('.nav .dd')) document.activeElement.blur(); }
  });
})();
