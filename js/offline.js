// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

(function () {
  'use strict';

  if (!('serviceWorker' in navigator) || location.protocol === 'file:') {
    return;
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () {
      // 登録できなくても、計測はそのまま使える
    });
  });
})();
