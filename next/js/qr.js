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

  // 英語で開いているときは、「アプリを共有」の QR コードを、英語で開くアドレスで描き直す
  if (root.CCFLang === 'en' && root.CCFQrCode) {
    Array.prototype.forEach.call(document.querySelectorAll('.qr-overlay img.qr-image'), function (image) {
      var urlText = image.parentNode.querySelector('.qr-url');
      var url = root.CCFWithLang(urlText.textContent);
      var qr = root.CCFQrCode.encode(url);
      var border = 4;
      var count = qr.size + border * 2;
      // 1 マス = 1 ピクセルで描き、画面では CSS で拡大する（もとの画像と同じ作り）
      var canvas = document.createElement('canvas');
      canvas.width = count;
      canvas.height = count;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, count, count);
      ctx.fillStyle = '#000';
      qr.modules.forEach(function (row, r) {
        row.forEach(function (dark, c) {
          if (dark) {
            ctx.fillRect(c + border, r + border, 1, 1);
          }
        });
      });
      image.src = canvas.toDataURL('image/png');
      image.width = count;
      image.height = count;
      urlText.textContent = url;
      image.alt = root.CCFLabels.qrAlt + url;
    });
  }

  root.CCFOverlay = { show: show };
})(this);
