// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

(function (root) {
  'use strict';

  root.CCFLabels = {
    // 上の帯（今の状態）
    status: {
      idle: { text: '心停止の認識を待っています', tone: 'neutral' },
      pre: { text: '初回胸骨圧迫まで', tone: 'warning' },
      compressing: { text: '胸骨圧迫中', tone: 'good' },
      interrupted: { text: '中断中', tone: 'warning' },
      finished: { text: '計測終了', tone: 'neutral' }
    },

    // 一番下の大きなボタン（押すと起こること）。終了後は表示しない
    mainButton: {
      idle: { text: '心停止認識', tone: 'arrest' },
      pre: { text: '胸骨圧迫開始', tone: 'start' },
      interrupted: { text: '胸骨圧迫開始', tone: 'start' },
      compressing: { text: '胸骨圧迫中断', tone: 'stop' },
      finished: null
    },

    finishButton: '終了（ROSC・蘇生中止）',
    defibButton: '初回除細動',
    resetConfirm: '計測結果を消去してリセットしますか？',

    // タブレットや PC で出す、表示の切り替えボタン（押すと切り替わる先）
    toPhoneLayout: 'スマホ版へ',
    toTabletLayout: 'タブレット版へ',

    rating: { good: '良好', acceptable: '許容', poor: '不可' },

    legend: function (good, acceptable) {
      return 'CCF = 胸骨圧迫時間 ÷ 心停止時間\n' +
        good + '%以上 良好 ・ ' + acceptable + '〜' + (good - 1) + '% 許容 ・ ' + acceptable + '%未満 不可';
    },

    seconds: '秒',
    firstCompression: '初回胸骨圧迫まで',
    noCompression: '胸骨圧迫なし',
    firstDefibrillation: '初回除細動まで',
    noDefibrillation: '除細動なし',
    finalTag: '終了前',

    summary: function (count, limitSeconds, overCount, longest) {
      var text = '中断 ' + count + '回 ・ ' + limitSeconds + '秒超 ' + overCount + '回';
      return longest === null ? text : text + ' ・ 最長 ' + longest + '秒';
    },

    // 終了後の結果の表示と受け渡し
    showResultButton: '結果を表示',
    handoffButton: '結果を渡す',
    sendLink: 'リンクを送る',
    copyLink: 'リンクをコピー',
    shareTitle: 'CCF 計測結果',
    copied: 'リンクをコピーしました。\nメールや LINE などに貼り付けて送ってください。',
    copyPrompt: '上のリンクを選んで、コピーしてください。',

    // 結果ページ（result.html）
    resultTitle: 'CCF 計測結果',
    resultMeta: function (number, finished) {
      return (number === null ? '' : '結果 ' + number + ' ・ ') + finished + ' 終了';
    },
    resultNumber: function (number) {
      return '結果 ' + number;
    },
    measuredLabel: '心停止時間',
    times: '回',
    overLabel: function (limitSeconds) {
      return limitSeconds + '秒超';
    },
    longest: '最長',
    overInterruptions: function (limitSeconds) {
      return limitSeconds + '秒超の中断';
    },
    defibMark: '除細動',
    listTitle: '結果の一覧',
    listMeta: function (count) {
      return 'この端末で開いた結果 ・ ' + count + ' 件';
    },
    listHint: 'それぞれの結果を押すと、その結果の詳しいページが開きます。',
    listEmpty: 'まだ結果がありません。\nスマホで計測を終了し、「結果を渡す」の図をこの端末のカメラで読み取ってください。',
    clearConfirm: '結果の一覧を消去しますか？',
    invalid: '結果を読み込めませんでした。\nQR コードを読み取り直すか、リンクを送り直してください。'
  };
})(this);
