# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright 2023-2026 keiimai
"""公開ページに埋め込む QR コードの画像を作り、HTML の qr:begin と qr:end の間を書き換える。

使い方（リポジトリのいちばん上のフォルダで実行する）:

    python3 -m pip install -r src/requirements.txt
    python3 src/make_qr.py
"""

import base64
import re
from pathlib import Path

import qrcode

import pngfile

ROOT = Path(__file__).resolve().parent.parent

# HTML ファイルと、その QR コードが指す URL
TARGETS = [
    ("index.html", "https://keiimai.github.io/kwskCCF/"),
    ("next/index.html", "https://keiimai.github.io/kwskCCF/next/"),
]

# 読み取りに必要な、周りの白い余白（マス）
BORDER = 4

MARKER = re.compile(r"(<!-- qr:begin -->\n)(.*?)(\s*<!-- qr:end -->)", re.S)


def qr_matrix(url):
    """QR コードの模様を返す。True が黒いマスで、周りの余白を含む。"""
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        border=BORDER,
    )
    qr.add_data(url)
    qr.make(fit=True)
    return qr.get_matrix()


def snippet(url, indent):
    """HTML に埋め込む部分（QR コードの画像と URL の文字）を作る。"""
    matrix = qr_matrix(url)
    size = len(matrix)
    data = base64.b64encode(pngfile.black_and_white(matrix)).decode("ascii")
    return (
        f'{indent}<img class="qr-image" width="{size}" height="{size}"'
        f' alt="QR コード：{url}"\n'
        f'{indent}  src="data:image/png;base64,{data}" />\n'
        f'{indent}<p class="qr-url">{url}</p>'
    )


def main():
    for name, url in TARGETS:
        path = ROOT / name
        if not path.exists():
            print(f"飛ばしました（ファイルがありません）: {name}")
            continue
        html = path.read_text(encoding="utf-8")
        found = MARKER.search(html)
        if not found:
            raise SystemExit(f"{name} に qr:begin / qr:end の目印がありません")
        indent = re.match(r"[ \t]*", found.group(2)).group(0)
        updated = html[:found.start(2)] + snippet(url, indent) + html[found.end(2):]
        path.write_text(updated, encoding="utf-8")
        print(f"書き換えました: {name} → {url}")


if __name__ == "__main__":
    main()
