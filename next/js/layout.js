// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

// スマホ版とタブレット版の切り替え。
// 大きな画面では、ふだんは画面に合わせた表示（タブレット版）にし、
// 「スマホ版へ」を押すと、<html> から layout-auto を外してスマホ用の表示にする。
// 切り替えるのは見た目だけで、ページを読み込み直さないので、計測の状態や結果はそのまま残る。
// 選んだ表示はこの端末に残す。読み込んだ直後に表示が入れ替わらないよう、<head> で読み込む
(function () {
  'use strict';

  // 公開版と試験版で分ける。計測画面と結果ページは同じ設定にする
  var STORAGE_KEY = 'ccf-layout:' + location.pathname.replace(/[^\/]*$/, '');
  var AUTO_CLASS = 'layout-auto';
  var html = document.documentElement;

  function savedPhone() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'phone';
    } catch (e) {
      return false;
    }
  }

  function save(phone) {
    try {
      if (phone) {
        window.localStorage.setItem(STORAGE_KEY, 'phone');
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      // 保存できない端末でも、開いている間は切り替えられる
    }
  }

  // phone が true ならスマホ版、false なら画面の大きさに合わせる
  function apply(phone) {
    html.classList.toggle(AUTO_CLASS, !phone);
    var button = document.getElementById('button-layout');
    if (button) {
      button.textContent = phone ? CCFLabels.toTabletLayout : CCFLabels.toPhoneLayout;
    }
  }

  apply(savedPhone());

  document.addEventListener('DOMContentLoaded', function () {
    apply(savedPhone());
    document.getElementById('button-layout').addEventListener('click', function () {
      var phone = html.classList.contains(AUTO_CLASS);
      save(phone);
      apply(phone);
    });
  });
})();
