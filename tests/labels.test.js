// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

(function () {
  'use strict';

  var sets = window.CCFLabelSets;

  // 言葉の項目の一覧（関数と null は、それ以上たどらない）
  function keysOf(obj, prefix) {
    return Object.keys(obj).reduce(function (list, key) {
      var value = obj[key];
      var nested = value !== null && typeof value === 'object';
      return list.concat(nested ? keysOf(value, prefix + key + '.') : [prefix + key + ':' + typeof value]);
    }, []).sort();
  }

  test('画面の言葉: 日本語と英語の項目と種類がそろっている', function () {
    equalList(keysOf(sets.en, ''), keysOf(sets.ja, ''));
  });

  test('画面の言葉: 英語の関数も、日本語と同じ引数で文を返す', function () {
    equal(typeof sets.en.legend(80, 60), 'string');
    equal(sets.en.summary(3, 10, 1, '12.1'), 'Pauses 3 · over 10 s: 1 · longest 12.1 s');
    equal(sets.ja.summary(3, 10, 1, '12.1'), '中断 3回 ・ 10秒超 1回 ・ 最長 12.1秒');
    equal(sets.en.resultMeta(2, '2026-11-08 10:03'), 'Result 2 · ended 2026-11-08 10:03');
    equal(sets.ja.resultMeta(2, '2026-11-08 10:03'), '結果 2 ・ 2026-11-08 10:03 終了');
  });

  test('画面の言葉: アドレスに lang がなければ日本語', function () {
    equal(window.CCFLang, 'ja');
    equal(window.CCFLabels, sets.ja);
  });
})();
