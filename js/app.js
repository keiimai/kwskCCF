// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2016 Takeshi KODAKA (original: CCF 1.3.1)
// Copyright 2023-2026 keiimai (modifications)

(function () {
  'use strict';

  var STATUS_LABELS = {
    idle: '計測待機中',
    measuring: '計測中',
    compressing: '胸骨圧迫中',
    interrupted: '胸骨圧迫中断',
    paused: '計測停止中'
  };

  var timer = CCFTimer.createTimer();
  var format = CCFTimer.formatDuration;

  var el = {
    reset: document.getElementById('button-reset'),
    cc: document.getElementById('button-cc'),
    cpr: document.getElementById('button-cpr'),
    timeCpr: document.getElementById('time_cpr'),
    timeCc: document.getElementById('time_cc'),
    rate: document.getElementById('rate'),
    status: document.getElementById('status-text'),
    log: document.getElementById('log_interruption')
  };

  // 端末の時計（Date.now）を使う。
  // performance.now はスマホのスリープ中に止まることがあるが、心肺蘇生は画面が消えても続くため。
  // 時計合わせで時刻が戻っても、経過時間が減らないようにする。
  var lastNow = 0;
  function now() {
    lastNow = Math.max(lastNow, Date.now());
    return lastNow;
  }

  var shownLogCount = 0;

  function render() {
    var snap = timer.snapshot(now());
    setText(el.timeCpr, format(snap.measured));
    setText(el.timeCc, format(snap.compressed));
    setText(el.rate, String(snap.ccf));
    setText(el.status, STATUS_LABELS[snap.status]);
    el.cc.classList.toggle('active', snap.compressing);
    el.cpr.classList.toggle('active', snap.measuring);
    renderLog(snap.interruptions);
  }

  function renderLog(interruptions) {
    if (interruptions.length < shownLogCount) {
      el.log.textContent = '';
      shownLogCount = 0;
    }
    for (; shownLogCount < interruptions.length; shownLogCount++) {
      var line = document.createElement('div');
      line.textContent = '[' + (shownLogCount + 1) + '] ' + format(interruptions[shownLogCount]);
      el.log.appendChild(line);
    }
  }

  // 同じ値なら書き換えない（毎フレーム呼ぶため）
  function setText(node, text) {
    if (node.textContent !== text) {
      node.textContent = text;
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
    var measuring = timer.snapshot(now()).measuring;
    if (measuring && !wakeLock && !wakeLockPending && document.visibilityState === 'visible') {
      wakeLockPending = true;
      navigator.wakeLock.request('screen').then(function (lock) {
        // 取得を待つ間に計測が止まっていたら、すぐ解放する
        if (!timer.snapshot(now()).measuring) {
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
    } else if (!measuring && wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
  }

  function afterAction() {
    render();
    syncWakeLock();
  }

  el.cc.addEventListener('click', function () {
    timer.toggleCompression(now());
    afterAction();
  });

  el.cpr.addEventListener('click', function () {
    timer.toggleMeasuring(now());
    afterAction();
  });

  el.reset.addEventListener('click', function () {
    if (timer.snapshot(now()).status !== 'idle' &&
        !window.confirm('計測結果を消去してリセットしますか？')) {
      return;
    }
    timer.reset();
    afterAction();
  });

  // タブを離れると wake lock は自動で外れるので、戻ったときに取り直す
  document.addEventListener('visibilitychange', syncWakeLock);

  loop();
})();
