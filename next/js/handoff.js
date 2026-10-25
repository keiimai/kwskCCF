// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

// 「結果を渡す」画面。結果ページのリンクを、カメラで読み取る図とリンクの欄で出す。
// カメラで読めない PC へは、共有メニュー（AirDrop・LINE・メールなど）で送るか、コピーする。
// 計測画面と結果ページの両方で使う
(function (root) {
  'use strict';

  var L = root.CCFLabels;
  var Q = root.CCFQrCode;

  var el = {
    overlay: document.getElementById('handoff-overlay'),
    canvas: document.getElementById('handoff-qr'),
    url: document.getElementById('handoff-url'),
    send: document.getElementById('handoff-send'),
    message: document.getElementById('handoff-message')
  };
  var shownUrl = '';

  // 拡大してもぼやけないよう、1 マスを整数のピクセルで大きめに描く
  function draw(url) {
    var qr = Q.encode(url);
    var border = 4;
    var count = qr.size + border * 2;
    var scale = Math.max(1, Math.floor(600 / count));
    var canvas = el.canvas;
    canvas.width = count * scale;
    canvas.height = count * scale;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    qr.modules.forEach(function (row, r) {
      row.forEach(function (dark, c) {
        if (dark) {
          ctx.fillRect((c + border) * scale, (r + border) * scale, scale, scale);
        }
      });
    });
  }

  function open(url, opener) {
    if (url !== shownUrl) {
      shownUrl = url;
      draw(url);
      el.url.value = url;
    }
    el.message.textContent = '';
    el.send.textContent = navigator.share ? L.sendLink : L.copyLink;
    CCFOverlay.show(el.overlay, opener);
  }

  // 共有メニューのない端末や、共有メニューを開けなかったときはコピーする
  el.send.addEventListener('click', function () {
    if (!navigator.share) {
      copy();
      return;
    }
    navigator.share({ title: L.shareTitle, url: shownUrl }).catch(function (e) {
      // 共有メニューを自分で閉じたときは、何もしない
      if (!e || e.name !== 'AbortError') {
        copy();
      }
    });
  });

  // ブラウザの小窓（alert・prompt）は出ない環境があるので、結果は画面の中に出す
  function copy() {
    var copying = navigator.clipboard && navigator.clipboard.writeText ?
      navigator.clipboard.writeText(shownUrl) : Promise.reject(new Error('no clipboard'));
    copying.then(function () {
      el.message.textContent = L.copied;
    }, function () {
      el.message.textContent = L.copyPrompt;
      el.url.focus();
      el.url.select();
    });
  }

  root.CCFHandoff = { open: open };
})(this);
