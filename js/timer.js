// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2016 Takeshi KODAKA (original: CCF 1.3.1)
// Copyright 2023-2026 keiimai (modifications)

(function (root) {
  'use strict';

  // 状態: idle（待機）/ measuring（計測中・圧迫前）/ compressing（圧迫中）
  //       interrupted（圧迫中断）/ paused（計測停止中）
  function createTimer() {
    var s;

    function reset() {
      s = {
        status: 'idle',
        measuring: false,
        compressing: false,
        // 直近の再開より前に積算された計測時間・圧迫時間
        measuredBefore: 0,
        compressedBefore: 0,
        measureStartedAt: 0,
        compressStartedAt: 0,
        // 直近の圧迫終了時点の計測時間（計測開始直後は 0）
        lastCompressionEndMeasured: 0,
        interruptions: []
      };
    }

    function measured(now) {
      return s.measuredBefore + (s.measuring ? now - s.measureStartedAt : 0);
    }

    function compressed(now) {
      return s.compressedBefore + (s.compressing ? now - s.compressStartedAt : 0);
    }

    function startMeasuring(now) {
      s.measuring = true;
      s.measureStartedAt = now;
      s.status = 'measuring';
    }

    function startCompression(now) {
      if (!s.measuring) {
        // 圧迫開始なら計測も開始する
        startMeasuring(now);
      }
      // 中断時間は計測時間の差で数えるので、計測停止中の時間は含まない
      var interruption = measured(now) - s.lastCompressionEndMeasured;
      if (interruption > 0) {
        s.interruptions.push(interruption);
      }
      s.compressing = true;
      s.compressStartedAt = now;
      s.status = 'compressing';
    }

    function stopCompression(now) {
      // 押した瞬間の時刻で積算する（表示更新の周期に左右されない）
      s.compressedBefore = compressed(now);
      s.compressing = false;
      s.lastCompressionEndMeasured = measured(now);
      s.status = 'interrupted';
    }

    function toggleCompression(now) {
      if (s.compressing) {
        stopCompression(now);
      } else {
        startCompression(now);
      }
    }

    function toggleMeasuring(now) {
      if (!s.measuring) {
        // 計測を再開しても圧迫開始とはみなさない
        startMeasuring(now);
        return;
      }
      if (s.compressing) {
        stopCompression(now);
      }
      s.measuredBefore = measured(now);
      s.measuring = false;
      s.status = 'paused';
    }

    function snapshot(now) {
      var m = measured(now);
      var c = compressed(now);
      return {
        status: s.status,
        measuring: s.measuring,
        compressing: s.compressing,
        measured: m,
        compressed: c,
        ccf: ccfPercent(c, m),
        interruptions: s.interruptions.slice()
      };
    }

    reset();
    return {
      toggleCompression: toggleCompression,
      toggleMeasuring: toggleMeasuring,
      reset: reset,
      snapshot: snapshot
    };
  }

  // CCF（%）。小数点以下は切り捨て。
  // cc / cpr * 100 だと 0.29 * 100 = 28.999… のように 1 少なく出るので、先に 100 を掛ける
  function ccfPercent(compressedMs, measuredMs) {
    if (!(measuredMs > 0)) {
      return 0;
    }
    return Math.floor(compressedMs * 100 / measuredMs);
  }

  // ミリ秒 → "HH:MM:SS.t"（0.1 秒単位で切り捨て）。整数で計算して小数の誤差を避ける
  function formatDuration(ms) {
    var tenths = Math.floor(Math.max(0, ms) / 100);
    var t = tenths % 10;
    var totalSec = Math.floor(tenths / 10);
    var ss = totalSec % 60;
    var mm = Math.floor(totalSec / 60) % 60;
    var hh = Math.floor(totalSec / 3600);
    return pad2(hh) + ':' + pad2(mm) + ':' + pad2(ss) + '.' + t;
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  var api = {
    createTimer: createTimer,
    ccfPercent: ccfPercent,
    formatDuration: formatDuration
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.CCFTimer = api;
  }
})(this);
