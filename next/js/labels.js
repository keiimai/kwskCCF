// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

(function (root) {
  'use strict';

  root.CCFLabels = {
    // 上の帯（今の状態）
    status: {
      idle: { text: '心停止の確知を待っています', tone: 'neutral' },
      pre: { text: '初回胸骨圧迫まで', tone: 'warning' },
      compressing: { text: '胸骨圧迫中', tone: 'good' },
      interrupted: { text: '中断中', tone: 'warning' },
      finished: { text: '計測終了', tone: 'neutral' }
    },

    // 一番下の大きなボタン（押すと起こること）。終了後は表示しない
    mainButton: {
      idle: { text: '心停止確知', tone: 'arrest' },
      pre: { text: '胸骨圧迫開始', tone: 'start' },
      interrupted: { text: '胸骨圧迫開始', tone: 'start' },
      compressing: { text: '胸骨圧迫中断', tone: 'stop' },
      finished: null
    },

    finishButton: '終了（ROSC・蘇生中止）',
    resetConfirm: '計測結果を消去してリセットしますか？',

    rating: { good: '良好', acceptable: '許容', poor: '不可' },

    legend: function (good, acceptable) {
      return 'CCF = 胸骨圧迫時間 ÷ 心停止時間\n' +
        good + '%以上 良好 ・ ' + acceptable + '〜' + (good - 1) + '% 許容 ・ ' + acceptable + '%未満 不可';
    },

    seconds: '秒',
    firstCompression: '初回胸骨圧迫まで',
    noCompression: '胸骨圧迫なし',
    finalTag: '終了前',

    summary: function (count, limitSeconds, overCount, longest) {
      var text = '中断 ' + count + '回 ・ ' + limitSeconds + '秒超 ' + overCount + '回';
      return longest === null ? text : text + ' ・ 最長 ' + longest + '秒';
    }
  };
})(this);
