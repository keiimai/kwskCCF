// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

// 画面の言葉。日本語と英語を持ち、アドレスに ?lang=en を付けたときだけ英語にする
(function (root) {
  'use strict';

  var LABELS = {
    ja: {
      title: '川崎ECCトレーニングサイト CCF計測器 ver1.0',
      reset: 'リセット',
      qr: 'QR',
      cc: '胸骨圧迫時間',
      cpr: '心停止時間',
      status: {
        idle: '計測待機中',
        measuring: '計測中',
        compressing: '胸骨圧迫中',
        interrupted: '胸骨圧迫中断',
        paused: '計測停止中'
      },
      resetConfirm: '計測結果を消去してリセットしますか？',
      qrHeading: 'このページの QR コード',
      qrAlt: 'QR コード：',
      qrTrademark: 'QRコードは株式会社デンソーウェーブの登録商標です',
      close: '閉じる'
    },
    en: {
      title: 'Kawasaki ECC Training Site CCF Calculator ver1.0',
      reset: 'Reset',
      qr: 'QR',
      cc: 'Compression time',
      cpr: 'Arrest time',
      status: {
        idle: 'Ready',
        measuring: 'Timing',
        compressing: 'Compressing',
        interrupted: 'Paused',
        paused: 'Stopped'
      },
      resetConfirm: 'Clear the results and reset?',
      qrHeading: 'QR code for this page',
      qrAlt: 'QR code: ',
      qrTrademark: 'QR Code is a registered trademark of DENSO WAVE INCORPORATED.',
      close: 'Close'
    }
  };

  var lang = new URLSearchParams(root.location.search).get('lang') === 'en' ? 'en' : 'ja';
  var L = LABELS[lang];
  root.CCFLabels = L;
  root.CCFLabelSets = LABELS; // テストで、日本語と英語の項目がそろっているか確かめる

  // HTML に書いてある言葉を入れ替える（日本語のときは同じ言葉のまま）。テストのページでは何もしない
  if (!document.querySelector('[data-label]')) {
    return;
  }
  document.documentElement.lang = lang;
  document.title = L.title;
  Array.prototype.forEach.call(document.querySelectorAll('[data-label]'), function (el) {
    el.textContent = L[el.getAttribute('data-label')];
  });
  var overlay = document.getElementById('qr-overlay');
  if (overlay) {
    overlay.setAttribute('aria-label', L.qrHeading);
    var image = overlay.querySelector('.qr-image');
    var url = overlay.querySelector('.qr-url');
    if (image && url) {
      image.alt = L.qrAlt + url.textContent;
    }
  }
})(this);
