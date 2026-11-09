// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

// スマホ版とタブレット版の切り替え。
// <html> に layout-large を付けると、タブレット版（大きな画面用）の CSS が効く。
// ふだんは画面の大きさで決め、「スマホ版へ」「タブレット版へ」で選んだときは、その表示をこの端末に残す。
// 切り替えるのは見た目だけで、ページを読み込み直さないので、計測の状態や結果はそのまま残る。
// 読み込んだ直後に表示が入れ替わらないよう、<head> で読み込む
(function (root) {
  'use strict';

  // 公開版と試験版で分ける。計測画面と結果ページは同じ設定にする
  var STORAGE_KEY = 'ccf-layout:' + location.pathname.replace(/[^\/]*$/, '');
  var LARGE_CLASS = 'layout-large';

  // ふだんタブレット版にする大きさ。機種ではなく画面の大きさで決める（iPad の Safari は Mac と名乗ることがあるため）。
  // iPhone の横向きは高さが足りないので、スマホ版のままにする
  var largeScreen = root.matchMedia('(min-width: 768px) and (min-height: 600px)');

  // 切り替えボタンを出す端末の、画面の短い辺（px）。スマホより大きい端末（タブレットや PC）だけに出す。
  // ウィンドウではなく端末の画面で決めるので、iPad mini の縦向きや、狭いウィンドウでも出る
  var SWITCHABLE_SHORT_SIDE = 600;

  var html = document.documentElement;

  // 保存できない端末で選んだ表示（開いている間だけ使う）
  var chosen = null;

  function canSwitch() {
    return Math.min(root.screen.width, root.screen.height) >= SWITCHABLE_SHORT_SIDE;
  }

  // 'phone' か 'tablet'。選んでいなければ null
  function savedChoice() {
    try {
      var choice = root.localStorage.getItem(STORAGE_KEY);
      return choice === 'phone' || choice === 'tablet' ? choice : null;
    } catch (e) {
      return null;
    }
  }

  function save(choice) {
    try {
      root.localStorage.setItem(STORAGE_KEY, choice);
    } catch (e) {
      chosen = choice;
    }
  }

  function isLarge() {
    var choice = canSwitch() ? (savedChoice() || chosen) : null;
    return choice ? choice === 'tablet' : largeScreen.matches;
  }

  function apply() {
    var large = isLarge();
    html.classList.toggle(LARGE_CLASS, large);
    var button = document.getElementById('button-layout');
    if (button && root.CCFLabels) {
      button.hidden = !canSwitch();
      button.textContent = large ? root.CCFLabels.toPhoneLayout : root.CCFLabels.toTabletLayout;
    }
  }

  apply();

  // 向きを変えたときなど。選んでいなければ、画面の大きさに合わせ直す
  if (largeScreen.addEventListener) {
    largeScreen.addEventListener('change', apply);
  } else {
    largeScreen.addListener(apply);
  }

  document.addEventListener('DOMContentLoaded', function () {
    apply();
    document.getElementById('button-layout').addEventListener('click', function () {
      save(html.classList.contains(LARGE_CLASS) ? 'phone' : 'tablet');
      apply();
    });
  });
})(this);
