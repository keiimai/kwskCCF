// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

// 画面の言葉。日本語と英語を持ち、アドレスに ?lang=en を付けたときだけ英語にする
(function (root) {
  'use strict';

  var LABELS = {};

  LABELS.ja = {
    // ページの題名と、HTML に書いてある言葉（data-label で入れ替える）
    pageTitle: '川崎ECCトレーニングサイト CCF計測器 ver2.0',
    resultPageTitle: '川崎ECCトレーニングサイト CCF計測結果 ver2.0',
    appName: 'CCF計測器',
    siteName: '川崎ECCトレーニングサイト CCF計測器',
    trial: '試験版',
    shareApp: 'アプリを共有',
    reset: 'リセット',
    close: '閉じる',
    arrestTime: '心停止時間',
    compressionTime: '胸骨圧迫時間',
    qrAlt: 'QR コード：',
    handoffNote: 'iPad などのカメラで読み取ると、\n大きな画面で結果が開きます。',
    handoffCheck: '開いた結果の終了時刻と CCF が、\n上と同じか確かめてください。',
    handoffHint: 'カメラで読めない PC には、リンクを送ります。',
    handoffQrLabel: '結果ページを開く図',
    handoffUrlLabel: '結果ページのリンク',
    backToTimer: '計測画面へ',
    list: '一覧',
    clearList: '一覧を消去',
    interruptionsLabel: '中断',
    timeline: '経過',
    keyCompress: '胸骨圧迫',
    keyGap: '中断',
    keyOver: '10秒を超えた中断',
    keyDefib: '初回除細動',
    sep: ' ・ ',

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
    // 中断が始まった時刻（ログの各行）
    startedAt: function (clock) {
      return clock + '〜';
    },

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
    // 「結果を渡す」で、受け取った端末の結果ページと見比べるための表示
    handoffFinished: function (clock) {
      return clock + ' 終了';
    },

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

  LABELS.en = {
    pageTitle: 'Kawasaki ECC Training Site CCF Calculator ver2.0',
    resultPageTitle: 'Kawasaki ECC Training Site CCF Results ver2.0',
    appName: 'CCF Calculator',
    siteName: 'Kawasaki ECC Training Site CCF Calculator',
    trial: 'trial',
    shareApp: 'Share app',
    reset: 'Reset',
    close: 'Close',
    arrestTime: 'Arrest time',
    compressionTime: 'Compression time',
    qrAlt: 'QR code: ',
    handoffNote: 'Scan with an iPad or another camera\nto open the results on a large screen.',
    handoffCheck: 'Check that the end time and CCF\nmatch the ones above.',
    handoffHint: 'For a PC without a camera, send the link.',
    handoffQrLabel: 'QR code that opens the results page',
    handoffUrlLabel: 'Link to the results page',
    backToTimer: 'Back to timer',
    list: 'List',
    clearList: 'Clear list',
    interruptionsLabel: 'Pauses',
    timeline: 'Timeline',
    keyCompress: 'Compressions',
    keyGap: 'Pause',
    keyOver: 'Pause over 10 s',
    keyDefib: 'First defibrillation',
    sep: ' · ',

    status: {
      idle: { text: 'Waiting for recognition of cardiac arrest', tone: 'neutral' },
      pre: { text: 'Time to first compression', tone: 'warning' },
      compressing: { text: 'Chest compressions', tone: 'good' },
      interrupted: { text: 'Pause', tone: 'warning' },
      finished: { text: 'Finished', tone: 'neutral' }
    },

    mainButton: {
      idle: { text: 'Cardiac arrest recognized', tone: 'arrest' },
      pre: { text: 'Start chest compressions', tone: 'start' },
      interrupted: { text: 'Start chest compressions', tone: 'start' },
      compressing: { text: 'Pause chest compressions', tone: 'stop' },
      finished: null
    },

    finishButton: 'End (ROSC / termination of resuscitation)',
    defibButton: 'First defibrillation',
    resetConfirm: 'Clear the results and reset?',

    toPhoneLayout: 'Phone view',
    toTabletLayout: 'Tablet view',

    rating: { good: 'Good', acceptable: 'Acceptable', poor: 'Poor' },

    legend: function (good, acceptable) {
      return 'CCF = compression time ÷ arrest time\n' +
        good + '% or more good · ' + acceptable + '–' + (good - 1) + '% acceptable · under ' + acceptable + '% poor';
    },

    seconds: ' s',
    firstCompression: 'Time to first compression',
    noCompression: 'No compressions',
    firstDefibrillation: 'Time to first defibrillation',
    noDefibrillation: 'No defibrillation',
    finalTag: 'until end',
    startedAt: function (clock) {
      return 'from ' + clock;
    },

    summary: function (count, limitSeconds, overCount, longest) {
      var text = 'Pauses ' + count + ' · over ' + limitSeconds + ' s: ' + overCount;
      return longest === null ? text : text + ' · longest ' + longest + ' s';
    },

    showResultButton: 'Show results',
    handoffButton: 'Hand off results',
    sendLink: 'Send link',
    copyLink: 'Copy link',
    shareTitle: 'CCF results',
    copied: 'Link copied.\nPaste it into an email or a message to send it.',
    copyPrompt: 'Select the link above and copy it.',
    handoffFinished: function (clock) {
      return 'Ended ' + clock;
    },

    resultTitle: 'CCF results',
    resultMeta: function (number, finished) {
      return (number === null ? '' : 'Result ' + number + ' · ') + 'ended ' + finished;
    },
    resultNumber: function (number) {
      return 'Result ' + number;
    },
    measuredLabel: 'Arrest time',
    times: '',
    overLabel: function (limitSeconds) {
      return 'over ' + limitSeconds + ' s:';
    },
    longest: 'longest',
    overInterruptions: function (limitSeconds) {
      return 'Pauses over ' + limitSeconds + ' s';
    },
    defibMark: 'Defibrillation',
    listTitle: 'Results',
    listMeta: function (count) {
      return 'Opened on this device · ' + count;
    },
    listHint: 'Tap a result to open its details.',
    listEmpty: 'No results yet.\nEnd the timing on the phone, then scan its “Hand off results” code with this device’s camera.',
    clearConfirm: 'Clear the list of results?',
    invalid: 'The result could not be loaded.\nScan the QR code again or send the link again.'
  };

  var lang = new URLSearchParams(root.location.search).get('lang') === 'en' ? 'en' : 'ja';
  var L = LABELS[lang];
  root.CCFLang = lang;
  root.CCFLabels = L;
  root.CCFLabelSets = LABELS; // テストで、日本語と英語の項目がそろっているか確かめる

  // 同じ言語のまま開くアドレス（英語のときは ?lang=en を付ける）
  root.CCFWithLang = function (url) {
    var u = new URL(url, root.location.href);
    if (lang === 'en') {
      u.searchParams.set('lang', 'en');
    }
    return u.href;
  };

  // 改行（\n）は <br> にして入れる
  function setText(el, text) {
    el.textContent = '';
    text.split('\n').forEach(function (part, i) {
      if (i > 0) {
        el.appendChild(document.createElement('br'));
      }
      el.appendChild(document.createTextNode(part));
    });
  }

  // 英語のときだけ、HTML に書いてある言葉を入れ替える。日本語のときは HTML のまま使う
  if (lang !== 'en' || !document.querySelector('[data-label]')) {
    return;
  }
  var trial = document.title.indexOf(LABELS.ja.trial) >= 0; // 試験版のページ
  document.documentElement.lang = lang;
  Array.prototype.forEach.call(document.querySelectorAll('[data-label]'), function (el) {
    setText(el, L[el.getAttribute('data-label')]);
  });
  if (trial) {
    document.title += ' (' + L.trial + ')';
    Array.prototype.forEach.call(document.querySelectorAll('small'), function (el) {
      el.textContent = el.textContent.replace(LABELS.ja.trial, L.trial);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-label-aria]'), function (el) {
    el.setAttribute('aria-label', L[el.getAttribute('data-label-aria')]);
  });
  Array.prototype.forEach.call(document.querySelectorAll('a.back-link'), function (a) {
    a.href = root.CCFWithLang(a.getAttribute('href'));
  });
  Array.prototype.forEach.call(document.querySelectorAll('.qr-overlay'), function (overlay) {
    var image = overlay.querySelector('img.qr-image');
    var url = overlay.querySelector('.qr-url');
    if (image && url) {
      image.alt = L.qrAlt + url.textContent;
    }
  });
})(this);
