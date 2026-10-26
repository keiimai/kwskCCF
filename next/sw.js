// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

'use strict';

// このページで使うファイル。ファイルを足したり消したりしたら、ここも直す
var FILES = [
  './',
  'index.html',
  'result.html',
  'manifest.webmanifest',
  'css/style.css',
  'css/qr.css',
  'css/result.css',
  'js/timer.js',
  'js/labels.js',
  'js/layout.js',
  'js/qrcode.js',
  'js/share.js',
  'js/handoff.js',
  'js/app.js',
  'js/result.js',
  'js/qr.js',
  'js/offline.js',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

var TIMEOUT_MS = 3000;

// 公開版と試験版は同じサイトにあるので、保存場所の名前をページの場所で分ける
var CACHE = 'ccf:' + self.registration.scope;

// 保存の目印は、? 以降を除いた URL にする
function keyOf(url) {
  var u = new URL(url, self.registration.scope);
  return u.origin + u.pathname;
}

var OWN = new Set(FILES.map(keyOf));

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(FILES);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') {
    return;
  }
  var key = keyOf(request.url);
  // このページのファイル以外（試験版のページなど）は扱わない
  if (!OWN.has(key)) {
    return;
  }
  event.respondWith(networkThenCache(request, key));
});

function networkThenCache(request, key) {
  return new Promise(function (resolve, reject) {
    var settled = false;

    function finish(response) {
      if (!settled) {
        settled = true;
        resolve(response);
      }
    }

    function fromCache() {
      return caches.match(key).then(function (cached) {
        if (cached) {
          finish(cached);
        }
        return cached;
      });
    }

    // 返事が遅いときは、保存しておいたファイルを先に使う
    var timer = setTimeout(fromCache, TIMEOUT_MS);

    fetch(request).then(function (response) {
      clearTimeout(timer);
      if (response.ok) {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) {
          return cache.put(key, copy);
        });
      }
      finish(response);
    }, function (error) {
      clearTimeout(timer);
      fromCache().then(function (cached) {
        if (!cached && !settled) {
          settled = true;
          reject(error);
        }
      });
    });
  });
}
