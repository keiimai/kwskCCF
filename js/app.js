// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2016 Takeshi KODAKA (original: CCF 1.3.1)
// Copyright 2023-2026 keiimai (modifications)

(function () {
  'use strict';

  var T = CCFTimer;
  var L = CCFLabels;
  var timer = T.createTimer();

  // 心停止認識と初回除細動の直後は、ボタンの幅が変わる。
  // 続けて押しても、隣のボタンや次の操作として受け付けない
  var GUARD_MS = 500;

  var el = {
    reset: document.getElementById('button-reset'),
    banner: document.getElementById('status-banner'),
    statusText: document.getElementById('status-text'),
    liveGap: document.getElementById('live-gap'),
    ccfBlock: document.getElementById('ccf-block'),
    ccf: document.getElementById('ccf-value'),
    rating: document.getElementById('ccf-rating'),
    legend: document.getElementById('legend'),
    timeArrest: document.getElementById('time-arrest'),
    timeCompression: document.getElementById('time-compression'),
    summary: document.getElementById('log-summary'),
    log: document.getElementById('log'),
    finish: document.getElementById('button-finish'),
    main: document.getElementById('button-main'),
    defib: document.getElementById('button-defib'),
    defibLabel: document.getElementById('defib-label'),
    defibElapsed: document.getElementById('defib-elapsed')
  };

  // 端末の時計（Date.now）を使う。
  // performance.now はスマホのスリープ中に止まることがあるが、心肺蘇生は画面が消えても続くため。
  // 時計合わせで時刻が戻っても、経過時間が減らないようにする。
  var lastNow = 0;
  function now() {
    lastNow = Math.max(lastNow, Date.now());
    return lastNow;
  }

  var guardUntil = 0;
  var shownLogKey = '';

  function isRunning(status) {
    return status === 'pre' || status === 'compressing' || status === 'interrupted';
  }

  function seconds(ms) {
    return T.formatSeconds(ms) + L.seconds;
  }

  function render() {
    var t = now();
    var snap = timer.snapshot(t);
    var status = L.status[snap.status];
    var gapOpen = snap.status === 'pre' || snap.status === 'interrupted';

    setText(el.statusText, status.text);
    setText(el.liveGap, gapOpen ? seconds(snap.currentGap) : '');
    setClass(el.banner, 'banner tone-' + (gapOpen && T.isOverLimit(snap.currentGap) ? 'danger' : status.tone));

    setText(el.ccf, String(snap.ccf));
    setText(el.rating, snap.rating ? L.rating[snap.rating] : '');
    setClass(el.ccfBlock, 'ccf' + (snap.rating ? ' rating-' + snap.rating : ''));

    setText(el.timeArrest, T.formatClock(snap.measured));
    setText(el.timeCompression, T.formatClock(snap.compressed));

    renderLog(snap);

    var main = L.mainButton[snap.status];
    el.main.hidden = !main;
    if (main) {
      setText(el.main, main.text);
      setClass(el.main, 'tone-' + main.tone);
    }
    el.finish.hidden = !isRunning(snap.status);

    // 初回除細動ボタンは、認識から押すまでの間だけ出す。経過時間は心停止時間と同じ
    el.defib.hidden = !isRunning(snap.status) || snap.firstDefibrillationDelay !== null;
    if (!el.defib.hidden) {
      setText(el.defibElapsed, T.formatClock(snap.measured));
      setClass(el.defib, T.isDefibrillationLate(snap.measured) ? 'tone-late' : 'tone-defib');
    }
  }

  // ログは追記されるだけなので、件数などが変わったときだけ作り直す
  function renderLog(snap) {
    var list = snap.interruptions;
    var key = snap.status + '/' + snap.firstCompressionDelay + '/' + snap.firstDefibrillationDelay + '/' + list.length;
    if (key === shownLogKey) {
      return;
    }
    shownLogKey = key;

    if (snap.status === 'idle') {
      el.summary.textContent = '';
    } else {
      var longest = null;
      list.forEach(function (e) {
        longest = longest === null ? e.duration : Math.max(longest, e.duration);
      });
      el.summary.textContent = L.summary(list.length, T.INTERRUPTION_LIMIT_MS / 1000, snap.overLimitCount,
        longest === null ? null : T.formatSeconds(longest));
    }

    el.log.textContent = '';
    var first = snap.firstCompressionDelay;
    if (first !== null) {
      el.log.appendChild(logItem(T.isOverLimit(first) ? 'over' : '', L.firstCompression, seconds(first), ''));
    } else if (snap.status === 'finished') {
      el.log.appendChild(logItem('', L.firstCompression, L.noCompression, ''));
    }
    var defib = snap.firstDefibrillationDelay;
    if (defib !== null) {
      el.log.appendChild(logItem(T.isDefibrillationLate(defib) ? 'over' : 'good', L.firstDefibrillation, seconds(defib), ''));
    } else if (snap.status === 'finished') {
      el.log.appendChild(logItem('', L.firstDefibrillation, L.noDefibrillation, ''));
    }
    list.forEach(function (e, i) {
      var note = T.formatClock(e.start) + '〜' + (e.final ? ' ' + L.finalTag : '');
      el.log.appendChild(logItem(T.isOverLimit(e.duration) ? 'over' : '', '#' + (i + 1), seconds(e.duration), note));
    });
  }

  // 1 行を「見出し・長さ・始まった時刻」の 3 列で作る。列の幅は CSS でそろえる
  function logItem(tone, label, value, note) {
    var li = document.createElement('li');
    li.className = 'log-item' + (tone ? ' ' + tone : '');
    li.appendChild(span('log-label', label));
    li.appendChild(span('log-duration', value));
    li.appendChild(span('log-note', note));
    return li;
  }

  function span(className, text) {
    var node = document.createElement('span');
    node.className = className;
    node.textContent = text;
    return node;
  }

  // 同じ値なら書き換えない（毎フレーム呼ぶため）
  function setText(node, text) {
    if (node.textContent !== text) {
      node.textContent = text;
    }
  }

  function setClass(node, className) {
    if (node.className !== className) {
      node.className = className;
    }
  }

  function loop() {
    render();
    requestAnimationFrame(loop);
  }

  // 計測中は画面が消えないようにする（Screen Wake Lock API。未対応の端末では何もしない）。
  // 毎フレームではなく、ボタン操作とタブ復帰のときだけ取得・解放する
  var wakeLock = null;
  var wakeLockPending = false;

  function syncWakeLock() {
    if (!('wakeLock' in navigator)) {
      return;
    }
    var running = isRunning(timer.snapshot(now()).status);
    if (running && !wakeLock && !wakeLockPending && document.visibilityState === 'visible') {
      wakeLockPending = true;
      navigator.wakeLock.request('screen').then(function (lock) {
        // 取得を待つ間に計測が終わっていたら、すぐ解放する
        if (!isRunning(timer.snapshot(now()).status)) {
          lock.release();
          return;
        }
        wakeLock = lock;
        lock.addEventListener('release', function () {
          wakeLock = null;
        });
      }).catch(function () {
        // 拒否された場合は次のボタン操作で再試行する
      }).then(function () {
        wakeLockPending = false;
      });
    } else if (!running && wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
  }

  function afterAction() {
    render();
    syncWakeLock();
  }

  el.main.addEventListener('click', function () {
    var t = now();
    if (timer.snapshot(t).status === 'idle') {
      timer.recognizeArrest(t);
      guardUntil = t + GUARD_MS;
    } else if (t >= guardUntil) {
      timer.toggleCompression(t);
    }
    afterAction();
  });

  el.defib.addEventListener('click', function () {
    var t = now();
    if (t >= guardUntil && timer.recordDefibrillation(t)) {
      guardUntil = t + GUARD_MS;
    }
    afterAction();
  });

  // 終了は 1 回押すだけで確定する（押し間違いは、大きなボタンとの間を空けて防ぐ）
  el.finish.addEventListener('click', function () {
    timer.finish(now());
    afterAction();
  });

  el.reset.addEventListener('click', function () {
    if (timer.snapshot(now()).status !== 'idle' && !window.confirm(L.resetConfirm)) {
      return;
    }
    timer.reset();
    guardUntil = 0;
    afterAction();
  });

  // タブを離れると wake lock は自動で外れるので、戻ったときに取り直す
  document.addEventListener('visibilitychange', syncWakeLock);

  el.legend.textContent = L.legend(T.CCF_GOOD, T.CCF_ACCEPTABLE);
  el.finish.textContent = L.finishButton;
  el.defibLabel.textContent = L.defibButton;
  loop();
})();
