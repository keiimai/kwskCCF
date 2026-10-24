// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

(function () {
  'use strict';

  // QR コードを画面いっぱいに重ねて出す。開くボタンは data-opener に書く
  Array.prototype.forEach.call(document.querySelectorAll('.qr-overlay'), function (overlay) {
    var button = document.getElementById(overlay.getAttribute('data-opener'));
    if (!button) {
      return;
    }
    var closeButton = overlay.querySelector('.qr-close');

    function show() {
      overlay.hidden = false;
      closeButton.focus();
    }

    function hide() {
      overlay.hidden = true;
      button.focus();
    }

    button.addEventListener('click', show);

    // 画面全体を覆い、どこを押しても閉じる（表示中に下の計測ボタンを押してしまわないように）
    overlay.addEventListener('click', hide);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !overlay.hidden) {
        hide();
      }
    });
  });
})();
