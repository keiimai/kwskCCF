# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright 2023-2026 keiimai
"""ホーム画面に追加したときのアイコン（icons/icon-*.png）を作る。

使い方（リポジトリのいちばん上のフォルダで実行する）:

    python3 src/make_icons.py
"""

from pathlib import Path

import pngfile

ROOT = Path(__file__).resolve().parent.parent

# 180 は iPhone、192 と 512 は Android などで使う大きさ
SIZES = [180, 192, 512]

GREEN = (0x22, 0x8B, 0x22)  # 画面の「胸骨圧迫中」と同じ緑
WHITE = (0xFF, 0xFF, 0xFF)

# アイコンの幅に対するハートの幅。端末がアイコンを丸く切り抜いても欠けない大きさにする
HEART_WIDTH = 0.56

# 式で描いたハートの、横幅と上下の中心
HEART_SPAN = 2.28
HEART_CENTER_Y = 0.1

SAMPLES = 4


def inside_heart(x, y):
    return (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0


def icon(size):
    """size × size ピクセルのアイコンを、pixels[y][x] = (r, g, b) の形で返す。"""
    unit = HEART_SPAN / (size * HEART_WIDTH)  # 1 ピクセルが式の上でどれだけの長さか
    pixels = []
    for py in range(size):
        row = []
        for px in range(size):
            hits = 0
            for sy in range(SAMPLES):
                for sx in range(SAMPLES):
                    x = (px + (sx + 0.5) / SAMPLES - size / 2) * unit
                    y = (size / 2 - py - (sy + 0.5) / SAMPLES) * unit + HEART_CENTER_Y
                    if inside_heart(x, y):
                        hits += 1
            share = hits / (SAMPLES * SAMPLES)
            row.append(tuple(round(g + (w - g) * share) for g, w in zip(GREEN, WHITE)))
        pixels.append(row)
    return pixels


def main():
    folder = ROOT / "icons"
    folder.mkdir(exist_ok=True)
    for size in SIZES:
        path = folder / f"icon-{size}.png"
        path.write_bytes(pngfile.color(icon(size)))
        print(f"作りました: icons/{path.name}")


if __name__ == "__main__":
    main()
