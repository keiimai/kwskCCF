// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

(function () {
  'use strict';

  var createTimer = CCFTimer.createTimer;
  var ccfPercent = CCFTimer.ccfPercent;
  var format = CCFTimer.formatDuration;

  test('時間表示: 0.1 秒単位で切り捨てる', function () {
    equal(format(0), '00:00:00.0');
    equal(format(99), '00:00:00.0');
    equal(format(300), '00:00:00.3');
    equal(format(1300), '00:00:01.3');
    equal(format(59999), '00:00:59.9');
    equal(format(3723400), '01:02:03.4');
  });

  test('CCF: 小数の誤差で 1 少なく出ない', function () {
    equal(ccfPercent(290, 1000), 29);
    equal(ccfPercent(570, 1000), 57);
    equal(ccfPercent(1000, 1000), 100);
    equal(ccfPercent(0, 0), 0);
  });

  test('心停止時間ボタンで開始し、5 秒後に圧迫開始 → 中断 5 秒を記録', function () {
    var t = createTimer();
    t.toggleMeasuring(0);
    equal(t.snapshot(0).status, 'measuring');
    t.toggleCompression(5000);
    var s = t.snapshot(5000);
    equal(s.status, 'compressing');
    equalList(s.interruptions, [5000]);
  });

  test('圧迫の中断と再開: 計測時間・圧迫時間・CCF', function () {
    var t = createTimer();
    t.toggleMeasuring(0);
    t.toggleCompression(5000);   // 圧迫開始（中断 5 秒）
    t.toggleCompression(15000);  // 圧迫中断
    equal(t.snapshot(15000).status, 'interrupted');
    t.toggleCompression(18000);  // 圧迫再開（中断 3 秒）
    var s = t.snapshot(20000);
    equal(s.measured, 20000);
    equal(s.compressed, 12000);
    equal(s.ccf, 60);
    equalList(s.interruptions, [5000, 3000]);
  });

  test('押した瞬間の時刻で積算する（0.1 秒刻みに丸めない）', function () {
    var t = createTimer();
    t.toggleCompression(0);
    t.toggleCompression(1050);
    t.toggleCompression(2030);
    t.toggleCompression(3070);
    var s = t.snapshot(4000);
    equal(s.compressed, 1050 + 1040);
    equal(s.measured, 4000);
    equalList(s.interruptions, [980]);
  });

  test('胸骨圧迫時間ボタンで開始すると計測も始まり、中断は記録しない', function () {
    var t = createTimer();
    t.toggleCompression(1000);
    var s = t.snapshot(3000);
    equal(s.measuring, true);
    equal(s.compressing, true);
    equal(s.measured, 2000);
    equal(s.compressed, 2000);
    equalList(s.interruptions, []);
  });

  test('圧迫中に計測停止 → 停止中の時間は数えず、圧迫ボタンで再開しても中断 0 秒は記録しない', function () {
    var t = createTimer();
    t.toggleCompression(0);
    t.toggleMeasuring(10000);
    var s = t.snapshot(20000);
    equal(s.status, 'paused');
    equal(s.compressing, false);
    equal(s.measured, 10000);
    equal(s.compressed, 10000);
    t.toggleCompression(20000);
    s = t.snapshot(25000);
    equal(s.measured, 15000);
    equal(s.compressed, 15000);
    equalList(s.interruptions, []);
  });

  test('計測停止をはさんだ中断は、停止中の時間を含めない', function () {
    var t = createTimer();
    t.toggleCompression(0);
    t.toggleCompression(4000);   // 圧迫中断
    t.toggleMeasuring(6000);     // 計測停止（ここまでの中断 2 秒）
    t.toggleMeasuring(30000);    // 計測再開
    t.toggleCompression(31000);  // 圧迫再開（中断 2 + 1 = 3 秒）
    var s = t.snapshot(31000);
    equal(s.measured, 7000);
    equalList(s.interruptions, [3000]);
  });

  test('リセットで最初の状態に戻る', function () {
    var t = createTimer();
    t.toggleMeasuring(0);
    t.toggleCompression(2000);
    t.reset();
    var s = t.snapshot(9000);
    equal(s.status, 'idle');
    equal(s.measuring, false);
    equal(s.measured, 0);
    equal(s.compressed, 0);
    equal(s.ccf, 0);
    equalList(s.interruptions, []);
  });
})();
