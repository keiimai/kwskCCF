// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2016 Takeshi KODAKA (original: CCF 1.3.1)
// Copyright 2023-2026 keiimai (modifications)

(function (root) {
  'use strict';

  var CCF_GOOD = 80;                   // これ以上は良好
  var CCF_ACCEPTABLE = 60;             // これ以上は許容、未満は不可
  var INTERRUPTION_LIMIT_MS = 10000;   // これを超える中断は不可
  var DEFIBRILLATION_LIMIT_MS = 60000; // これを超える初回除細動は遅すぎる

  // 状態: idle（認識前）/ pre（認識後・初回圧迫前）/ compressing（圧迫中）
  //       interrupted（圧迫中断）/ finished（終了）
  function createTimer() {
    var s;

    function reset() {
      s = {
        status: 'idle',
        recognizedAt: 0,
        finishedAt: 0,
        // 直近の圧迫開始より前に積算された圧迫時間
        compressedBefore: 0,
        compressStartedAt: 0,
        // 圧迫していない区間が始まった時刻（心停止認識または圧迫中断）
        gapStartedAt: 0,
        firstCompressionDelay: null,
        firstDefibrillationDelay: null,
        // { start: 認識からの経過, duration, final: 終了直前の区間か }
        interruptions: []
      };
    }

    function measured(now) {
      if (s.status === 'idle') {
        return 0;
      }
      return (s.status === 'finished' ? s.finishedAt : now) - s.recognizedAt;
    }

    function compressed(now) {
      return s.compressedBefore + (s.status === 'compressing' ? now - s.compressStartedAt : 0);
    }

    function inGap() {
      return s.status === 'pre' || s.status === 'interrupted';
    }

    function recordInterruption(now, final) {
      var duration = now - s.gapStartedAt;
      if (duration > 0) {
        s.interruptions.push({
          start: s.gapStartedAt - s.recognizedAt,
          duration: duration,
          final: final
        });
      }
    }

    function recognizeArrest(now) {
      if (s.status !== 'idle') {
        return false;
      }
      s.status = 'pre';
      s.recognizedAt = now;
      s.gapStartedAt = now;
      return true;
    }

    function toggleCompression(now) {
      if (s.status === 'compressing') {
        // 押した瞬間の時刻で積算する（表示更新の周期に左右されない）
        s.compressedBefore = compressed(now);
        s.status = 'interrupted';
        s.gapStartedAt = now;
        return true;
      }
      if (s.status === 'pre') {
        s.firstCompressionDelay = now - s.gapStartedAt;
      } else if (s.status === 'interrupted') {
        recordInterruption(now, false);
      } else {
        // 認識前と終了後は受け付けない
        return false;
      }
      s.status = 'compressing';
      s.compressStartedAt = now;
      return true;
    }

    // 初回除細動は 1 回だけ記録する。認識前と終了後は受け付けない
    function recordDefibrillation(now) {
      if (s.status === 'idle' || s.status === 'finished' || s.firstDefibrillationDelay !== null) {
        return false;
      }
      s.firstDefibrillationDelay = now - s.recognizedAt;
      return true;
    }

    function finish(now) {
      if (s.status === 'compressing') {
        s.compressedBefore = compressed(now);
      } else if (s.status === 'interrupted') {
        // 最後の圧迫中断から終了までも中断として記録する
        recordInterruption(now, true);
      } else if (s.status !== 'pre') {
        return false;
      }
      s.status = 'finished';
      s.finishedAt = now;
      return true;
    }

    function snapshot(now) {
      var m = measured(now);
      var c = compressed(now);
      var ccf = ccfPercent(c, m);
      var interruptions = s.interruptions.map(function (e) {
        return { start: e.start, duration: e.duration, final: e.final };
      });
      return {
        status: s.status,
        finishedAt: s.status === 'finished' ? s.finishedAt : null,
        measured: m,
        compressed: c,
        ccf: ccf,
        rating: s.status === 'idle' ? null : rateCcf(ccf),
        firstCompressionDelay: s.firstCompressionDelay,
        firstDefibrillationDelay: s.firstDefibrillationDelay,
        // 今まさに続いている、圧迫していない時間（初回圧迫前・中断中のみ）
        currentGap: inGap() ? now - s.gapStartedAt : 0,
        interruptions: interruptions,
        overLimitCount: countOverLimit(s.firstCompressionDelay, interruptions)
      };
    }

    // 保存用に、今の状態を写して返す（ページを開き直しても続きから表示するため）
    function exportState() {
      return JSON.parse(JSON.stringify(s));
    }

    // exportState で保存した状態に戻す。形が合わなければ何もせず false を返す
    function importState(saved) {
      if (!isValidState(saved)) {
        return false;
      }
      s = JSON.parse(JSON.stringify(saved));
      return true;
    }

    reset();
    return {
      recognizeArrest: recognizeArrest,
      toggleCompression: toggleCompression,
      recordDefibrillation: recordDefibrillation,
      finish: finish,
      reset: reset,
      snapshot: snapshot,
      exportState: exportState,
      importState: importState
    };
  }

  var STATUSES = ['idle', 'pre', 'compressing', 'interrupted', 'finished'];
  var TIME_KEYS = ['recognizedAt', 'finishedAt', 'compressedBefore', 'compressStartedAt', 'gapStartedAt'];

  function isNumber(v) {
    return typeof v === 'number' && isFinite(v);
  }

  function isValidState(x) {
    if (!x || STATUSES.indexOf(x.status) < 0 || !Array.isArray(x.interruptions)) {
      return false;
    }
    return TIME_KEYS.every(function (key) {
      return isNumber(x[key]);
    }) && [x.firstCompressionDelay, x.firstDefibrillationDelay].every(function (v) {
      return v === null || isNumber(v);
    }) && x.interruptions.every(function (e) {
      return e && isNumber(e.start) && isNumber(e.duration) && typeof e.final === 'boolean';
    });
  }

  // CCF（%）。小数点以下は切り捨て。
  // cc / cpr * 100 だと 0.29 * 100 = 28.999… のように 1 少なく出るので、先に 100 を掛ける
  function ccfPercent(compressedMs, measuredMs) {
    if (!(measuredMs > 0)) {
      return 0;
    }
    return Math.floor(compressedMs * 100 / measuredMs);
  }

  // 切り捨てた整数で判定しても、80・60 の境目は元の値で判定したのと同じになる
  function rateCcf(percent) {
    if (percent >= CCF_GOOD) {
      return 'good';
    }
    if (percent >= CCF_ACCEPTABLE) {
      return 'acceptable';
    }
    return 'poor';
  }

  // 画面と同じ 0.1 秒単位（切り捨て）で比べる。10.0 秒は許容、10.1 秒から超過。
  // ミリ秒のまま比べると「10.0秒」と表示されているのに赤くなることがあるため
  function exceeds(ms, limitMs) {
    return Math.floor(ms / 100) > limitMs / 100;
  }

  function isOverLimit(ms) {
    return exceeds(ms, INTERRUPTION_LIMIT_MS);
  }

  // 10 秒を超えた回数。初回胸骨圧迫までも数える
  function countOverLimit(firstCompressionDelay, interruptions) {
    var count = firstCompressionDelay !== null && isOverLimit(firstCompressionDelay) ? 1 : 0;
    interruptions.forEach(function (e) {
      if (isOverLimit(e.duration)) {
        count++;
      }
    });
    return count;
  }

  // 60.0 秒までは良好、60.1 秒から遅すぎる
  function isDefibrillationLate(ms) {
    return exceeds(ms, DEFIBRILLATION_LIMIT_MS);
  }

  // ミリ秒 → "m:ss"（1 時間以上は "h:mm:ss"）。秒未満は切り捨て
  function formatClock(ms) {
    var totalSec = Math.floor(Math.max(0, ms) / 1000);
    var ss = totalSec % 60;
    var mm = Math.floor(totalSec / 60) % 60;
    var hh = Math.floor(totalSec / 3600);
    return hh > 0 ? hh + ':' + pad2(mm) + ':' + pad2(ss) : mm + ':' + pad2(ss);
  }

  // ミリ秒 → 秒の数字 "12.3"（0.1 秒単位で切り捨て）。整数で計算して小数の誤差を避ける
  function formatSeconds(ms) {
    var tenths = Math.floor(Math.max(0, ms) / 100);
    return Math.floor(tenths / 10) + '.' + (tenths % 10);
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  var api = {
    CCF_GOOD: CCF_GOOD,
    CCF_ACCEPTABLE: CCF_ACCEPTABLE,
    INTERRUPTION_LIMIT_MS: INTERRUPTION_LIMIT_MS,
    DEFIBRILLATION_LIMIT_MS: DEFIBRILLATION_LIMIT_MS,
    createTimer: createTimer,
    ccfPercent: ccfPercent,
    rateCcf: rateCcf,
    isOverLimit: isOverLimit,
    countOverLimit: countOverLimit,
    isDefibrillationLate: isDefibrillationLate,
    formatClock: formatClock,
    formatSeconds: formatSeconds
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.CCFTimer = api;
  }
})(this);
