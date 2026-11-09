// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

// QR コード（誤り訂正レベル M、8 ビットバイトモード）を作る。外部のライブラリは使わない。
// Python の qrcode と同じ結果になることを tests/qrcode.test.js で確かめている
(function (root) {
  'use strict';

  // 型番 1〜40 の [1 ブロックの誤り訂正コード語数, ブロック数, データコード語数, ブロック数, データコード語数]
  var BLOCKS = [
    [10, 1, 16], [16, 1, 28], [26, 1, 44], [18, 2, 32], [24, 2, 43],
    [16, 4, 27], [18, 4, 31], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44],
    [30, 1, 50, 4, 51], [22, 6, 36, 2, 37], [22, 8, 37, 1, 38], [24, 4, 40, 5, 41], [24, 5, 41, 5, 42],
    [28, 7, 45, 3, 46], [28, 10, 46, 1, 47], [26, 9, 43, 4, 44], [26, 3, 44, 11, 45], [26, 3, 41, 13, 42],
    [26, 17, 42], [28, 17, 46], [28, 4, 47, 14, 48], [28, 6, 45, 14, 46], [28, 8, 47, 13, 48],
    [28, 19, 46, 4, 47], [28, 22, 45, 3, 46], [28, 3, 45, 23, 46], [28, 21, 45, 7, 46], [28, 19, 47, 10, 48],
    [28, 2, 46, 29, 47], [28, 10, 46, 23, 47], [28, 14, 46, 21, 47], [28, 14, 46, 23, 47], [28, 12, 47, 26, 48],
    [28, 6, 47, 34, 48], [28, 29, 46, 14, 47], [28, 13, 46, 32, 47], [28, 40, 47, 7, 48], [28, 18, 47, 31, 48]
  ];

  var LEVEL_M = 0; // 形式情報での M の値

  var MASKS = [
    function (r, c) { return (r + c) % 2 === 0; },
    function (r) { return r % 2 === 0; },
    function (r, c) { return c % 3 === 0; },
    function (r, c) { return (r + c) % 3 === 0; },
    function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; },
    function (r, c) { return (r * c) % 2 + (r * c) % 3 === 0; },
    function (r, c) { return ((r * c) % 2 + (r * c) % 3) % 2 === 0; },
    function (r, c) { return ((r * c) % 3 + (r + c) % 2) % 2 === 0; }
  ];

  // GF(256) の指数表と対数表（x^8 + x^4 + x^3 + x^2 + 1）
  var EXP = [];
  var LOG = [];
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) {
        x ^= 0x11d;
      }
    }
    for (i = 255; i < 512; i++) {
      EXP[i] = EXP[i - 255];
    }
  })();

  function multiply(a, b) {
    return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
  }

  // data を生成多項式で割った余りが、誤り訂正コード語になる
  function errorCorrection(data, length) {
    var generator = [1];
    var i, j;
    for (i = 0; i < length; i++) {
      var next = zeros(generator.length + 1);
      for (j = 0; j < generator.length; j++) {
        next[j] ^= generator[j];
        next[j + 1] ^= multiply(generator[j], EXP[i]);
      }
      generator = next;
    }
    var remainder = zeros(length);
    for (i = 0; i < data.length; i++) {
      var factor = data[i] ^ remainder.shift();
      remainder.push(0);
      for (j = 0; j < length; j++) {
        remainder[j] ^= multiply(generator[j + 1], factor);
      }
    }
    return remainder;
  }

  function zeros(n) {
    var a = [];
    for (var i = 0; i < n; i++) {
      a.push(0);
    }
    return a;
  }

  function dataCodewords(blocks) {
    return blocks[1] * blocks[2] + (blocks.length > 3 ? blocks[3] * blocks[4] : 0);
  }

  // データを型番に合わせたコード語の並びにする（誤り訂正コード語を足し、ブロックを交互に並べる）
  function codewords(bytes, version) {
    var blocks = BLOCKS[version - 1];
    var capacity = dataCodewords(blocks) * 8;
    var bits = [];

    function put(value, length) {
      for (var i = length - 1; i >= 0; i--) {
        bits.push((value >>> i) & 1);
      }
    }

    put(4, 4);
    put(bytes.length, version < 10 ? 8 : 16);
    bytes.forEach(function (b) {
      put(b, 8);
    });
    put(0, Math.min(4, capacity - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) {
      put(pad, 8);
    }

    var data = [];
    for (var i = 0; i < bits.length; i += 8) {
      var byte = 0;
      for (var k = 0; k < 8; k++) {
        byte = (byte << 1) | bits[i + k];
      }
      data.push(byte);
    }

    var dataBlocks = [];
    var offset = 0;
    for (var g = 1; g < blocks.length; g += 2) {
      for (var n = 0; n < blocks[g]; n++) {
        dataBlocks.push(data.slice(offset, offset + blocks[g + 1]));
        offset += blocks[g + 1];
      }
    }
    var ecBlocks = dataBlocks.map(function (block) {
      return errorCorrection(block, blocks[0]);
    });

    var result = [];
    interleave(dataBlocks, result);
    interleave(ecBlocks, result);
    return result;
  }

  function interleave(list, out) {
    var longest = 0;
    list.forEach(function (block) {
      longest = Math.max(longest, block.length);
    });
    for (var i = 0; i < longest; i++) {
      list.forEach(function (block) {
        if (i < block.length) {
          out.push(block[i]);
        }
      });
    }
  }

  function alignmentPositions(version) {
    if (version === 1) {
      return [];
    }
    var size = version * 4 + 17;
    var count = Math.floor(version / 7) + 2;
    var step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
    var result = [6];
    for (var pos = size - 7; result.length < count; pos -= step) {
      result.splice(1, 0, pos);
    }
    return result;
  }

  // BCH 符号（data の後ろに、poly で割った余りを付ける）
  function bch(data, poly, shift) {
    var d = data << shift;
    var polyLength = bitLength(poly);
    while (bitLength(d) >= polyLength) {
      d ^= poly << (bitLength(d) - polyLength);
    }
    return (data << shift) | d;
  }

  function bitLength(n) {
    var length = 0;
    while (n !== 0) {
      length++;
      n >>>= 1;
    }
    return length;
  }

  // 位置検出・位置合わせ・タイミングのパターン。データを置くマスは null のまま残す
  function functionPatterns(version) {
    var size = version * 4 + 17;
    var m = [];
    for (var r = 0; r < size; r++) {
      m.push([]);
      for (var c = 0; c < size; c++) {
        m[r].push(null);
      }
    }

    [[0, 0], [size - 7, 0], [0, size - 7]].forEach(function (p) {
      for (var dr = -1; dr <= 7; dr++) {
        for (var dc = -1; dc <= 7; dc++) {
          var row = p[0] + dr;
          var col = p[1] + dc;
          if (row < 0 || row >= size || col < 0 || col >= size) {
            continue;
          }
          m[row][col] = (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
            (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) ||
            (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
        }
      }
    });

    var positions = alignmentPositions(version);
    positions.forEach(function (row) {
      positions.forEach(function (col) {
        if (m[row][col] !== null) {
          return;
        }
        for (var dr = -2; dr <= 2; dr++) {
          for (var dc = -2; dc <= 2; dc++) {
            m[row + dr][col + dc] = dr === -2 || dr === 2 || dc === -2 || dc === 2 || (dr === 0 && dc === 0);
          }
        }
      });
    });

    for (var i = 8; i < size - 8; i++) {
      if (m[i][6] === null) {
        m[i][6] = i % 2 === 0;
      }
      if (m[6][i] === null) {
        m[6][i] = i % 2 === 0;
      }
    }

    // 形式情報と型番情報の場所は、マスクを選ぶあいだ明るいマスにしておく
    drawFormat(m, 0, false);
    if (version >= 7) {
      drawVersion(m, version, false);
    }
    return m;
  }

  function drawFormat(m, mask, on) {
    var size = m.length;
    var bits = on ? bch((LEVEL_M << 3) | mask, 0x537, 10) ^ 0x5412 : 0;
    for (var i = 0; i < 15; i++) {
      var dark = ((bits >> i) & 1) === 1;
      if (i < 6) {
        m[i][8] = dark;
      } else if (i < 8) {
        m[i + 1][8] = dark;
      } else {
        m[size - 15 + i][8] = dark;
      }
      if (i < 8) {
        m[8][size - i - 1] = dark;
      } else if (i < 9) {
        m[8][15 - i] = dark;
      } else {
        m[8][14 - i] = dark;
      }
    }
    m[size - 8][8] = on;
  }

  function drawVersion(m, version, on) {
    var size = m.length;
    var bits = on ? bch(version, 0x1f25, 12) : 0;
    for (var i = 0; i < 18; i++) {
      var dark = ((bits >> i) & 1) === 1;
      m[Math.floor(i / 3)][i % 3 + size - 11] = dark;
      m[i % 3 + size - 11][Math.floor(i / 3)] = dark;
    }
  }

  // 右下から 2 列ずつ、上下に折り返しながらデータを置く
  function placeData(base, data, mask) {
    var size = base.length;
    var m = base.map(function (row) {
      return row.slice();
    });
    var apply = MASKS[mask];
    var index = 0;
    var total = data.length * 8;
    var row = size - 1;
    var step = -1;
    for (var right = size - 1; right > 0; right -= 2) {
      // 縦のタイミングパターン（6 列目）は飛ばす
      var col = right <= 6 ? right - 1 : right;
      for (;;) {
        for (var k = 0; k < 2; k++) {
          var c = col - k;
          if (m[row][c] === null) {
            var dark = index < total && ((data[index >> 3] >>> (7 - (index & 7))) & 1) === 1;
            m[row][c] = apply(row, c) ? !dark : dark;
            index++;
          }
        }
        row += step;
        if (row < 0 || row >= size) {
          row -= step;
          step = -step;
          break;
        }
      }
    }
    return m;
  }

  // マスクの良し悪しの点数（小さいほど良い）
  function penalty(m) {
    var n = m.length;
    var score = 0;
    var a, b;

    // 同じ色が 5 個以上続く
    for (a = 0; a < n; a++) {
      for (var dir = 0; dir < 2; dir++) {
        var previous = null;
        var length = 0;
        for (b = 0; b < n; b++) {
          var v = dir === 0 ? m[a][b] : m[b][a];
          if (v === previous) {
            length++;
          } else {
            if (length >= 5) {
              score += length - 2;
            }
            previous = v;
            length = 1;
          }
        }
        if (length >= 5) {
          score += length - 2;
        }
      }
    }

    // 2×2 が同じ色
    for (a = 0; a < n - 1; a++) {
      for (b = 0; b < n - 1; b++) {
        var x = m[a][b];
        if (x === m[a][b + 1] && x === m[a + 1][b] && x === m[a + 1][b + 1]) {
          score += 3;
        }
      }
    }

    // 位置検出パターンに似た並び（暗明暗暗暗明暗 の前後に明 4 つ）
    for (a = 0; a < n; a++) {
      for (b = 0; b < n - 10; b++) {
        if (finderLike(function (k) { return m[a][b + k]; })) {
          score += 40;
        }
        if (finderLike(function (k) { return m[b + k][a]; })) {
          score += 40;
        }
      }
    }

    // 暗いマスの割合が 50% から 5% 離れるごと
    var dark = 0;
    for (a = 0; a < n; a++) {
      for (b = 0; b < n; b++) {
        if (m[a][b]) {
          dark++;
        }
      }
    }
    score += Math.floor(Math.abs(dark / (n * n) * 100 - 50) / 5) * 10;
    return score;
  }

  function finderLike(at) {
    if (at(1) || !at(4) || at(5) || !at(6) || at(9)) {
      return false;
    }
    return (at(0) && at(2) && at(3) && !at(7) && !at(8) && !at(10)) ||
      (!at(0) && !at(2) && !at(3) && at(7) && at(8) && at(10));
  }

  // text を QR コードにする。mask を省くと、点数の一番小さいマスクを選ぶ。
  // 戻り値の modules[行][列] は、暗いマスが true（周りの余白は含まない）
  function encode(text, mask) {
    var bytes = Array.prototype.slice.call(new TextEncoder().encode(text));
    var version = 1;
    while (4 + (version < 10 ? 8 : 16) + bytes.length * 8 > dataCodewords(BLOCKS[version - 1]) * 8) {
      version++;
      if (version > 40) {
        throw new Error('QR コードに入りきりません');
      }
    }

    var data = codewords(bytes, version);
    var base = functionPatterns(version);
    if (mask === undefined) {
      var best = null;
      for (var i = 0; i < MASKS.length; i++) {
        var score = penalty(placeData(base, data, i));
        if (best === null || score < best) {
          best = score;
          mask = i;
        }
      }
    }

    var modules = placeData(base, data, mask);
    drawFormat(modules, mask, true);
    if (version >= 7) {
      drawVersion(modules, version, true);
    }
    return { version: version, mask: mask, size: modules.length, modules: modules };
  }

  var api = { encode: encode };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.CCFQrCode = api;
  }
})(this);
