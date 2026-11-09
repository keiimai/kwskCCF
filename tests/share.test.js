// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

(function () {
  'use strict';

  var S = CCFShare;
  var createTimer = CCFTimer.createTimer;
  var BASE = 1792800000000; // 2026-10-24 頃の時刻（ミリ秒）

  function finishedSnapshot() {
    var t = createTimer();
    t.recognizeArrest(BASE);
    t.toggleCompression(BASE + 4800);
    t.toggleCompression(BASE + 47000);
    t.recordDefibrillation(BASE + 52300);
    t.toggleCompression(BASE + 59400);   // 中断 12.4 秒（超過）
    t.toggleCompression(BASE + 120000);
    t.finish(BASE + 126500);             // 中断のまま終了（終了前 6.5 秒）
    return t.snapshot(BASE + 200000);
  }

  test('結果の受け渡し: 文字列にして戻すと、同じ結果になる', function () {
    var snap = finishedSnapshot();
    var code = S.encodeResult(snap);
    equal(/^[0-9a-z._-]+$/.test(code), true);
    var r = S.decodeResult(code);
    equal(r.status, 'finished');
    equal(r.finishedAt, Math.floor((BASE + 126500) / 1000) * 1000);
    equal(r.measured, snap.measured);
    equal(r.compressed, snap.compressed);
    equal(r.ccf, snap.ccf);
    equal(r.rating, snap.rating);
    equal(r.firstCompressionDelay, 4800);
    equal(r.firstDefibrillationDelay, 52300);
    equalList(r.interruptions, snap.interruptions);
    equal(r.interruptions[1].final, true);
    equal(r.overLimitCount, snap.overLimitCount);
  });

  test('結果の受け渡し: 胸骨圧迫も除細動もなく終了した場合', function () {
    var t = createTimer();
    t.recognizeArrest(BASE);
    t.finish(BASE + 9000);
    var r = S.decodeResult(S.encodeResult(t.snapshot(BASE + 9000)));
    equal(r.firstCompressionDelay, null);
    equal(r.firstDefibrillationDelay, null);
    equalList(r.interruptions, []);
    equal(r.ccf, 0);
    equal(r.overLimitCount, 0);
  });

  test('結果の受け渡し: 読めない文字列は null', function () {
    var code = S.encodeResult(finishedSnapshot());
    equal(S.decodeResult(''), null);
    equal(S.decodeResult('2' + code.slice(1)), null);
    equal(S.decodeResult(code + '.0'), null);
    equal(S.decodeResult(code.replace(/\.[01]$/, '.x')), null);
    equal(S.decodeResult('1.a.b.c...d.0'), null);           // 中断の形が違う
    equal(S.decodeResult('1.a.10.20...'.concat('.0')), null); // 胸骨圧迫時間が心停止時間より長い
  });
})();
