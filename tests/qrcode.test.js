// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2023-2026 keiimai

(function () {
  'use strict';

  QR_FIXTURES.forEach(function (c) {
    test('QR コード: Python の qrcode と同じになる（型番 ' + c.version + '）', function () {
      var qr = CCFQrCode.encode(c.text);
      equal(qr.version, c.version);
      equal(qr.size, c.rows.length);
      var rows = qr.modules.map(function (row) {
        return row.map(function (dark) { return dark ? '1' : '0'; }).join('');
      });
      equal(rows.join('\n'), c.rows.join('\n'));
    });
  });
})();
