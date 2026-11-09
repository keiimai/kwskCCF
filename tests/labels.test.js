// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

(function () {
  'use strict';

  var sets = window.CCFLabelSets;

  function keysOf(obj, prefix) {
    return Object.keys(obj).reduce(function (list, key) {
      var value = obj[key];
      return list.concat(typeof value === 'object' ? keysOf(value, prefix + key + '.') : [prefix + key]);
    }, []).sort();
  }

  test('画面の言葉: 日本語と英語の項目がそろっている', function () {
    equalList(keysOf(sets.en, ''), keysOf(sets.ja, ''));
  });

  test('画面の言葉: 空の言葉がない', function () {
    ['ja', 'en'].forEach(function (lang) {
      keysOf(sets[lang], '').forEach(function (key) {
        var value = key.split('.').reduce(function (o, k) { return o[k]; }, sets[lang]);
        if (!value) {
          throw new Error(lang + ' の ' + key + ' が空です');
        }
      });
    });
  });

  test('画面の言葉: 計測の状態すべてに言葉がある', function () {
    ['idle', 'measuring', 'compressing', 'interrupted', 'paused'].forEach(function (status) {
      equal(typeof sets.ja.status[status], 'string');
      equal(typeof sets.en.status[status], 'string');
    });
  });
})();
