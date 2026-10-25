// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

(function (root) {
  'use strict';

  // 画面いっぱいに重ねる表示。開くボタンは data-opener に書く（JavaScript から開くものは書かない）
  var openedBy = null;

  function show(overlay, opener) {
    openedBy = opener || null;
    overlay.hidden = false;
    overlay.querySelector('.qr-close').focus();
  }

  function hide(overlay) {
    overlay.hidden = true;
    if (openedBy) {
      openedBy.focus();
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('.qr-overlay'), function (overlay) {
    var opener = document.getElementById(overlay.getAttribute('data-opener'));
    if (opener) {
      opener.addEventListener('click', function () {
        show(overlay, opener);
      });
    }

    // 画面全体を覆い、どこを押しても閉じる（表示中に下の計測ボタンを押してしまわないように）。
    // リンクの欄など .qr-keep の上を押したときは閉じない
    overlay.addEventListener('click', function (e) {
      if (!e.target.closest('.qr-keep')) {
        hide(overlay);
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') {
      return;
    }
    Array.prototype.forEach.call(document.querySelectorAll('.qr-overlay'), function (overlay) {
      if (!overlay.hidden) {
        hide(overlay);
      }
    });
  });

  root.CCFOverlay = { show: show };
})(this);
