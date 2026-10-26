// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

// 結果ページ。リンクの # より後ろに結果があれば詳しく出し、なければこの端末で開いた結果の一覧を出す
(function () {
  'use strict';

  var T = CCFTimer;
  var L = CCFLabels;
  var S = CCFShare;

  // 一覧はこの端末のブラウザにだけ残す。公開版と試験版で分ける
  var STORAGE_KEY = 'ccf-results:' + location.pathname.replace(/[^\/]*$/, '');
  var MAX_RESULTS = 100;
  var LIMIT_SECONDS = T.INTERRUPTION_LIMIT_MS / 1000;

  var el = {
    title: document.getElementById('page-title'),
    meta: document.getElementById('page-meta'),
    handoffButton: document.getElementById('button-handoff'),
    listButton: document.getElementById('button-list'),
    clearButton: document.getElementById('button-clear'),
    detail: document.getElementById('detail'),
    ccfBlock: document.getElementById('r-ccf-block'),
    ccf: document.getElementById('r-ccf'),
    rating: document.getElementById('r-rating'),
    legend: document.getElementById('r-legend'),
    measured: document.getElementById('r-measured'),
    compressed: document.getElementById('r-compressed'),
    firstRow: document.getElementById('r-first-row'),
    first: document.getElementById('r-first'),
    defibRow: document.getElementById('r-defib-row'),
    defib: document.getElementById('r-defib'),
    interruptions: document.getElementById('r-interruptions'),
    bar: document.getElementById('r-bar'),
    ticks: document.getElementById('r-ticks'),
    chips: document.getElementById('r-chips'),
    list: document.getElementById('list'),
    cards: document.getElementById('list-cards'),
    hint: document.getElementById('list-hint'),
    message: document.getElementById('message')
  };

  function loadList() {
    try {
      var list = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveList(list) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      // 保存できない端末でも、開いた結果は表示できる
    }
  }

  // 一覧に足して、何番目かを返す（保存できなければ null）
  function remember(code) {
    var list = loadList();
    if (list.indexOf(code) < 0) {
      list.push(code);
      saveList(list.slice(-MAX_RESULTS));
    }
    var index = loadList().indexOf(code);
    return index < 0 ? null : index + 1;
  }

  function seconds(ms) {
    return T.formatSeconds(ms) + L.seconds;
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function clockOfDay(time) {
    var d = new Date(time);
    return d.getHours() + ':' + pad2(d.getMinutes());
  }

  function dateTime(time) {
    var d = new Date(time);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + clockOfDay(time);
  }

  function node(tag, className, text) {
    var n = document.createElement(tag);
    if (className) {
      n.className = className;
    }
    if (text !== undefined) {
      n.textContent = text;
    }
    return n;
  }

  function showOnly(section) {
    el.detail.hidden = section !== el.detail;
    el.list.hidden = section !== el.list;
    el.message.hidden = section !== el.message;
  }

  function showDetail(r, number) {
    showOnly(el.detail);
    el.title.textContent = L.resultTitle;
    el.meta.textContent = L.resultMeta(number, dateTime(r.finishedAt));
    el.handoffButton.hidden = false;
    el.listButton.hidden = false;
    el.clearButton.hidden = true;

    el.ccf.textContent = String(r.ccf);
    el.rating.textContent = L.rating[r.rating];
    el.ccfBlock.className = 'r-ccf rating-' + r.rating;
    el.legend.textContent = L.legend(T.CCF_GOOD, T.CCF_ACCEPTABLE);

    el.measured.textContent = T.formatClock(r.measured);
    el.compressed.textContent = T.formatClock(r.compressed);

    var first = r.firstCompressionDelay;
    el.first.textContent = first === null ? L.noCompression : seconds(first);
    el.firstRow.className = first !== null && T.isOverLimit(first) ? 'over' : '';

    var defib = r.firstDefibrillationDelay;
    el.defib.textContent = defib === null ? L.noDefibrillation : seconds(defib);
    el.defibRow.className = defib === null ? '' : (T.isDefibrillationLate(defib) ? 'over' : 'good');

    renderInterruptionSummary(r);
    renderTimeline(r);
    renderChips(r);
  }

  // 「5回 ・ 10秒超 2回 ・ 最長 12.4秒」。10 秒超が 1 回以上なら赤にする
  function renderInterruptionSummary(r) {
    var dd = el.interruptions;
    dd.textContent = r.interruptions.length + L.times + ' ・ ' + L.overLabel(LIMIT_SECONDS) + ' ';
    dd.appendChild(node('b', r.overLimitCount > 0 ? 'over' : '', r.overLimitCount + L.times));
    var longest = null;
    r.interruptions.forEach(function (e) {
      longest = longest === null ? e.duration : Math.max(longest, e.duration);
    });
    if (longest !== null) {
      dd.appendChild(document.createTextNode(' ・ ' + L.longest + ' ' + seconds(longest)));
    }
  }

  // 心停止時間を横 1 本の帯にし、胸骨圧迫していない区間を重ねる
  function renderTimeline(r) {
    el.bar.textContent = '';
    el.ticks.textContent = '';
    if (!(r.measured > 0)) {
      return;
    }
    function percent(ms) {
      return Math.min(100, ms / r.measured * 100) + '%';
    }
    function gap(start, duration) {
      var g = node('div', 'gap' + (T.isOverLimit(duration) ? ' over' : ''));
      g.style.left = percent(start);
      g.style.width = percent(duration);
      el.bar.appendChild(g);
    }

    // 初回胸骨圧迫の前も、圧迫していない区間として示す
    gap(0, r.firstCompressionDelay === null ? r.measured : r.firstCompressionDelay);
    r.interruptions.forEach(function (e) {
      gap(e.start, e.duration);
    });

    if (r.firstDefibrillationDelay !== null) {
      var mark = node('div', 'defib-mark');
      var at = r.firstDefibrillationDelay / r.measured;
      mark.style.left = percent(r.firstDefibrillationDelay);
      var label = node('span', at < 0.1 ? 'start' : (at > 0.9 ? 'end' : ''),
        L.defibMark + ' ' + T.formatClock(r.firstDefibrillationDelay));
      mark.appendChild(label);
      el.bar.appendChild(mark);
    }

    // 目盛りは 8 本以下になる間隔にする
    var steps = [10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];
    var step = steps[steps.length - 1];
    for (var i = 0; i < steps.length; i++) {
      if (r.measured / 1000 / steps[i] <= 8) {
        step = steps[i];
        break;
      }
    }
    for (var t = 0; t * 1000 <= r.measured; t += step) {
      var tick = node('span', '', T.formatClock(t * 1000));
      tick.style.left = percent(t * 1000);
      el.ticks.appendChild(tick);
    }
  }

  // 計測画面のログと同じく「見出し・長さ・始まった時刻」。大きな画面では列に分けて並べる
  function renderChips(r) {
    el.chips.textContent = '';
    var first = r.firstCompressionDelay;
    chip(first !== null && T.isOverLimit(first), L.firstCompression,
      first === null ? L.noCompression : seconds(first), '');
    r.interruptions.forEach(function (e, i) {
      var note = T.formatClock(e.start) + '〜' + (e.final ? ' ' + L.finalTag : '');
      chip(T.isOverLimit(e.duration), '#' + (i + 1), seconds(e.duration), note);
    });

    function chip(over, label, value, note) {
      var li = node('li', over ? 'over' : '');
      li.appendChild(node('span', 'chip-label', label));
      li.appendChild(node('span', 'chip-value', value));
      li.appendChild(node('span', 'chip-note', note));
      el.chips.appendChild(li);
    }
  }

  function showList() {
    showOnly(el.list);
    var list = loadList();
    el.title.textContent = L.listTitle;
    el.meta.textContent = L.listMeta(list.length);
    el.handoffButton.hidden = true;
    el.listButton.hidden = true;
    el.clearButton.hidden = list.length === 0;
    el.cards.textContent = '';
    el.hint.textContent = list.length === 0 ? L.listEmpty : L.listHint;

    list.forEach(function (code, i) {
      var r = S.decodeResult(code);
      if (!r) {
        return;
      }
      var card = node('button', 'card');
      card.type = 'button';
      var head = node('span', 'card-head');
      head.appendChild(node('b', '', L.resultNumber(i + 1)));
      head.appendChild(node('span', '', clockOfDay(r.finishedAt)));
      card.appendChild(head);

      var ccf = node('span', 'card-ccf rating-' + r.rating);
      ccf.appendChild(node('b', 'num', String(r.ccf)));
      ccf.appendChild(node('small', '', '%'));
      ccf.appendChild(node('em', '', L.rating[r.rating]));
      card.appendChild(ccf);

      card.appendChild(row('', L.measuredLabel, T.formatClock(r.measured)));
      card.appendChild(row(r.overLimitCount > 0 ? 'over' : '', L.overInterruptions(LIMIT_SECONDS), r.overLimitCount + L.times));
      var defib = r.firstDefibrillationDelay;
      card.appendChild(row(defib === null ? '' : (T.isDefibrillationLate(defib) ? 'over' : 'good'),
        L.firstDefibrillation, defib === null ? L.noDefibrillation : seconds(defib)));

      card.addEventListener('click', function () {
        location.hash = code;
      });
      el.cards.appendChild(card);
    });

    function row(className, label, value) {
      var r = node('span', 'card-row' + (className ? ' ' + className : ''));
      r.appendChild(node('span', '', label));
      r.appendChild(node('span', 'num', value));
      return r;
    }
  }

  function showMessage(text) {
    showOnly(el.message);
    el.title.textContent = L.resultTitle;
    el.meta.textContent = '';
    el.handoffButton.hidden = true;
    el.listButton.hidden = false;
    el.clearButton.hidden = true;
    el.message.textContent = text;
  }

  function route() {
    var code = location.hash.slice(1);
    if (!code) {
      showList();
      return;
    }
    var r = S.decodeResult(code);
    if (r) {
      showDetail(r, remember(code));
    } else {
      showMessage(L.invalid);
    }
    window.scrollTo(0, 0);
  }

  el.handoffButton.addEventListener('click', function () {
    CCFHandoff.open(location.href, el.handoffButton);
  });

  el.listButton.addEventListener('click', function () {
    location.hash = '';
  });

  el.clearButton.addEventListener('click', function () {
    if (window.confirm(L.clearConfirm)) {
      saveList([]);
      showList();
    }
  });

  window.addEventListener('hashchange', route);
  route();
})();
