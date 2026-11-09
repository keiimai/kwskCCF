# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright 2023-2026 keiimai
"""js/qrcode.js のテストに使う正解を、Python の qrcode で作って tests/qrcode.fixtures.js に書き出す。

使い方:
    python3 -m pip install -r src/requirements.txt
    python3 src/make_qr_fixtures.py
"""

import json
from pathlib import Path

import qrcode
from qrcode.util import MODE_8BIT_BYTE, QRData

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "tests" / "qrcode.fixtures.js"

# 型番 1・4・6・9・13 になる。日本語（UTF-8）も含める
TEXTS = [
    "a",
    "https://keiimai.github.io/kwskCCF/next/result.html#1.mgl8b4.6opc.5hio.3qo.14co.ajk-7ei_2qn8-9ko.1",
    "0123456789abcdefghijklmnopqrstuvwxyz-_." * 4,
    "https://example.com/" + "ccf-" * 70,
    "心停止認識・胸骨圧迫・初回除細動",
]


def fixture(text):
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M)
    q.add_data(QRData(text.encode("utf-8"), mode=MODE_8BIT_BYTE))
    q.make(fit=True)
    rows = ["".join("1" if dark else "0" for dark in row) for row in q.modules]
    return {"text": text, "version": q.version, "rows": rows}


def main():
    cases = [fixture(text) for text in TEXTS]
    body = json.dumps(cases, ensure_ascii=False, indent=1)
    OUTPUT.write_text(
        "// SPDX-License-Identifier: GPL-3.0-or-later\n"
        "// Copyright 2023-2026 keiimai\n"
        "// src/make_qr_fixtures.py で作る（手で書き換えない）\n"
        "var QR_FIXTURES = " + body + ";\n",
        encoding="utf-8",
    )
    print("書き出しました:", OUTPUT.relative_to(ROOT), [c["version"] for c in cases])


if __name__ == "__main__":
    main()
