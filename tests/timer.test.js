// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

(function () {
  'use strict';

  var T = CCFTimer;
  var createTimer = T.createTimer;

  test('時間表示: 分:秒（1 時間以上は 時:分:秒）、秒未満は切り捨て', function () {
    equal(T.formatClock(0), '0:00');
    equal(T.formatClock(59999), '0:59');
    equal(T.formatClock(65000), '1:05');
    equal(T.formatClock(3723400), '1:02:03');
  });

  test('秒表示: 0.1 秒単位で切り捨て、小数の誤差を出さない', function () {
    equal(T.formatSeconds(0), '0.0');
    equal(T.formatSeconds(300), '0.3');
    equal(T.formatSeconds(1300), '1.3');
    equal(T.formatSeconds(10099), '10.0');
    equal(T.formatSeconds(65400), '65.4');
  });

  test('CCF: 小数の誤差で 1 少なく出ない', function () {
    equal(T.ccfPercent(290, 1000), 29);
    equal(T.ccfPercent(570, 1000), 57);
    equal(T.ccfPercent(1000, 1000), 100);
    equal(T.ccfPercent(0, 0), 0);
  });

  test('CCF の判定: 80% 以上 良好、60〜79% 許容、60% 未満 不可', function () {
    equal(T.rateCcf(100), 'good');
    equal(T.rateCcf(80), 'good');
    equal(T.rateCcf(79), 'acceptable');
    equal(T.rateCcf(60), 'acceptable');
    equal(T.rateCcf(59), 'poor');
    equal(T.rateCcf(0), 'poor');
  });

  test('10 秒超の判定: 表示が 10.0 秒なら許容、10.1 秒から超過', function () {
    equal(T.isOverLimit(10000), false);
    equal(T.isOverLimit(10099), false);
    equal(T.isOverLimit(10100), true);
    equal(T.isOverLimit(25000), true);
  });

  test('初回除細動の判定: 表示が 60.0 秒なら良好、60.1 秒から遅すぎる', function () {
    equal(T.isDefibrillationLate(60000), false);
    equal(T.isDefibrillationLate(60099), false);
    equal(T.isDefibrillationLate(60100), true);
  });

  test('心停止認識の前は、圧迫ボタンも終了も受け付けない', function () {
    var t = createTimer();
    equal(t.toggleCompression(1000), false);
    equal(t.finish(2000), false);
    var s = t.snapshot(5000);
    equal(s.status, 'idle');
    equal(s.measured, 0);
    equal(s.rating, null);
  });

  test('心停止認識は 1 回だけ', function () {
    var t = createTimer();
    equal(t.recognizeArrest(0), true);
    equal(t.recognizeArrest(3000), false);
    equal(t.snapshot(5000).measured, 5000);
  });

  test('認識から初回圧迫までの時間を、中断とは別に記録する', function () {
    var t = createTimer();
    t.recognizeArrest(0);
    var s = t.snapshot(3000);
    equal(s.status, 'pre');
    equal(s.currentGap, 3000);
    t.toggleCompression(4000);
    s = t.snapshot(4000);
    equal(s.status, 'compressing');
    equal(s.firstCompressionDelay, 4000);
    equal(s.currentGap, 0);
    equalList(s.interruptions, []);
  });

  test('圧迫の中断と再開: 時間・CCF・判定・中断の開始時刻', function () {
    var t = createTimer();
    t.recognizeArrest(0);
    t.toggleCompression(4000);   // 初回圧迫（認識から 4 秒）
    t.toggleCompression(14000);  // 圧迫中断
    var s = t.snapshot(16500);
    equal(s.status, 'interrupted');
    equal(s.currentGap, 2500);
    t.toggleCompression(17000);  // 圧迫再開（中断 3 秒）
    s = t.snapshot(20000);
    equal(s.measured, 20000);
    equal(s.compressed, 13000);
    equal(s.ccf, 65);
    equal(s.rating, 'acceptable');
    equalList(s.interruptions, [{ start: 14000, duration: 3000, final: false }]);
  });

  test('押した瞬間の時刻で積算する（0.1 秒刻みに丸めない）', function () {
    var t = createTimer();
    t.recognizeArrest(0);
    t.toggleCompression(0);
    t.toggleCompression(1050);
    t.toggleCompression(2030);
    t.toggleCompression(3070);
    var s = t.snapshot(4000);
    equal(s.compressed, 1050 + 1040);
    equal(s.interruptions[0].duration, 980);
  });

  test('圧迫中に終了: 圧迫時間はそこで止まり、以後の操作は受け付けない', function () {
    var t = createTimer();
    t.recognizeArrest(0);
    t.toggleCompression(5000);
    equal(t.finish(30000), true);
    var s = t.snapshot(50000);
    equal(s.status, 'finished');
    equal(s.measured, 30000);
    equal(s.compressed, 25000);
    equal(s.ccf, 83);
    equal(s.rating, 'good');
    equal(t.toggleCompression(51000), false);
    equal(t.recognizeArrest(52000), false);
    equal(t.finish(53000), false);
    equal(t.snapshot(60000).measured, 30000);
  });

  test('中断中に終了: 最後の中断も「終了前」として記録する', function () {
    var t = createTimer();
    t.recognizeArrest(0);
    t.toggleCompression(2000);
    t.toggleCompression(20000);
    t.finish(26000);
    var s = t.snapshot(30000);
    equal(s.measured, 26000);
    equal(s.compressed, 18000);
    equalList(s.interruptions, [{ start: 20000, duration: 6000, final: true }]);
  });

  test('一度も圧迫せずに終了: 初回圧迫までは記録なし、CCF 0%', function () {
    var t = createTimer();
    t.recognizeArrest(0);
    t.finish(8000);
    var s = t.snapshot(9000);
    equal(s.firstCompressionDelay, null);
    equalList(s.interruptions, []);
    equal(s.ccf, 0);
    equal(s.rating, 'poor');
  });

  test('10 秒超の件数: 初回圧迫までと各中断を数える', function () {
    var t = createTimer();
    t.recognizeArrest(0);
    t.toggleCompression(12000);  // 初回圧迫まで 12 秒（超過）
    t.toggleCompression(20000);
    t.toggleCompression(30000);  // 中断 10.0 秒（許容）
    t.toggleCompression(40000);
    t.toggleCompression(55000);  // 中断 15 秒（超過）
    var s = t.snapshot(60000);
    equal(s.overLimitCount, 2);
    equal(s.interruptions.length, 2);
  });

  test('初回除細動: 認識からの時間を 1 回だけ記録し、圧迫の状態は変えない', function () {
    var t = createTimer();
    equal(t.recordDefibrillation(1000), false);  // 認識前は受け付けない
    t.recognizeArrest(2000);
    t.toggleCompression(5000);
    t.toggleCompression(40000);
    equal(t.recordDefibrillation(54300), true);
    equal(t.recordDefibrillation(70000), false); // 2 回目は受け付けない
    var s = t.snapshot(60000);
    equal(s.firstDefibrillationDelay, 52300);
    equal(s.status, 'interrupted');
    equal(s.compressed, 35000);
  });

  test('初回除細動: 初回圧迫の前でも押せる。終了後は受け付けない', function () {
    var t = createTimer();
    t.recognizeArrest(0);
    equal(t.recordDefibrillation(3000), true);
    equal(t.snapshot(4000).firstDefibrillationDelay, 3000);
    var u = createTimer();
    u.recognizeArrest(0);
    u.finish(5000);
    equal(u.recordDefibrillation(6000), false);
    equal(u.snapshot(7000).firstDefibrillationDelay, null);
  });

  test('リセットで最初の状態に戻る', function () {
    var t = createTimer();
    t.recognizeArrest(0);
    t.toggleCompression(2000);
    t.recordDefibrillation(3000);
    t.finish(5000);
    t.reset();
    var s = t.snapshot(9000);
    equal(s.status, 'idle');
    equal(s.measured, 0);
    equal(s.compressed, 0);
    equal(s.firstCompressionDelay, null);
    equal(s.firstDefibrillationDelay, null);
    equalList(s.interruptions, []);
    equal(t.recognizeArrest(9000), true);
  });
})();
