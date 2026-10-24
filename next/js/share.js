// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

// 計測結果を、結果ページのリンクの # より後ろに入れる文字列にする・戻す。
// # より後ろはサーバーに送られないので、結果は端末の外に出ない。
// 時間はミリ秒を 36 進数で書く。CCF や判定は、受け取った側で計算し直す
(function (root) {
  'use strict';

  var T = root.CCFTimer;
  var FORMAT = '1';

  // 終了後の snapshot だけを受け付ける
  function encodeResult(snap) {
    var list = snap.interruptions;
    return [
      FORMAT,
      Math.floor(snap.finishedAt / 1000).toString(36),
      number(snap.measured),
      number(snap.compressed),
      optional(snap.firstCompressionDelay),
      optional(snap.firstDefibrillationDelay),
      list.map(function (e) {
        return number(e.start) + '-' + number(e.duration);
      }).join('_'),
      list.length > 0 && list[list.length - 1].final ? '1' : '0'
    ].join('.');
  }

  function number(ms) {
    return Math.round(ms).toString(36);
  }

  function optional(ms) {
    return ms === null ? '' : number(ms);
  }

  // 読めない文字列なら null を返す
  function decodeResult(code) {
    var parts = String(code).split('.');
    if (parts.length !== 8 || parts[0] !== FORMAT) {
      return null;
    }
    var finishedAt = parse(parts[1]);
    var measured = parse(parts[2]);
    var compressed = parse(parts[3]);
    var first = parts[4] === '' ? null : parse(parts[4]);
    var defib = parts[5] === '' ? null : parse(parts[5]);
    if (isNaN(finishedAt) || isNaN(measured) || isNaN(compressed) || compressed > measured ||
      Number.isNaN(first) || Number.isNaN(defib)) {
      return null;
    }

    var interruptions = [];
    var items = parts[6] === '' ? [] : parts[6].split('_');
    for (var i = 0; i < items.length; i++) {
      var pair = items[i].split('-');
      var start = pair.length === 2 ? parse(pair[0]) : NaN;
      var duration = pair.length === 2 ? parse(pair[1]) : NaN;
      if (isNaN(start) || isNaN(duration)) {
        return null;
      }
      interruptions.push({ start: start, duration: duration, final: false });
    }
    if (parts[7] === '1' && interruptions.length > 0) {
      interruptions[interruptions.length - 1].final = true;
    } else if (parts[7] !== '0') {
      return null;
    }

    var ccf = T.ccfPercent(compressed, measured);
    return {
      status: 'finished',
      finishedAt: finishedAt * 1000,
      measured: measured,
      compressed: compressed,
      ccf: ccf,
      rating: T.rateCcf(ccf),
      firstCompressionDelay: first,
      firstDefibrillationDelay: defib,
      interruptions: interruptions,
      overLimitCount: T.countOverLimit(first, interruptions)
    };
  }

  function parse(text) {
    return /^[0-9a-z]{1,10}$/.test(text) ? parseInt(text, 36) : NaN;
  }

  root.CCFShare = {
    encodeResult: encodeResult,
    decodeResult: decodeResult
  };
})(this);
