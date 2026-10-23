# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright 2023-2026 keiimai
"""PNG 画像を、Python の標準機能（zlib・struct）だけで作る。"""

import struct
import zlib


def _chunk(kind, data):
    body = kind + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))


def _png(width, height, bit_depth, color_type, rows):
    header = struct.pack(">IIBBBBB", width, height, bit_depth, color_type, 0, 0, 0)
    raw = b"".join(b"\x00" + row for row in rows)  # 各行の先頭は「フィルターなし」
    return (
        b"\x89PNG\r\n\x1a\n"
        + _chunk(b"IHDR", header)
        + _chunk(b"IDAT", zlib.compress(raw, 9))
        + _chunk(b"IEND", b"")
    )


def black_and_white(matrix):
    """True を黒、False を白とした白黒 PNG（グレースケール 1 ビット）を作る。"""
    width = len(matrix[0])
    rows = []
    for row in matrix:
        line = bytearray()
        for start in range(0, width, 8):
            byte = 0
            for offset, dark in enumerate(row[start:start + 8]):
                if not dark:
                    byte |= 0x80 >> offset  # 1 が白、0 が黒
            line.append(byte)
        rows.append(bytes(line))
    return _png(width, len(matrix), 1, 0, rows)


def color(pixels):
    """pixels[y][x] = (r, g, b) のカラー PNG（RGB 各 8 ビット）を作る。"""
    rows = [bytes(value for rgb in row for value in rgb) for row in pixels]
    return _png(len(pixels[0]), len(pixels), 8, 2, rows)
