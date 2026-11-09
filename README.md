# 川崎ECCトレーニングサイト CCF計測器

心肺蘇生トレーニングで、CCF と胸骨圧迫の中断時間を計測する Web アプリです。

CCF は chest compression fraction（胸骨圧迫比率）の略です。

ブラウザだけで動き、インストールは要りません。

- CCF計測器（ver1.0）：<https://keiimai.github.io/kwskCCF/>
  - 英語版：<https://keiimai.github.io/kwskCCF/?lang=en>
- 試験版（ver2.0）：<https://keiimai.github.io/kwskCCF/next/>
  - 英語版：<https://keiimai.github.io/kwskCCF/next/?lang=en>

> 教育・訓練用のツールです。
>
> 実際の患者の診療や臨床判断には使わないでください。
>
> 計測結果の正確さは保証しません。

## 使い方

1. 心停止を確認したら、**心停止時間** ボタンを押して計測を始めます。
2. 胸骨圧迫を始めたら、**胸骨圧迫時間** ボタンを押します。
   - 中断したらもう一度押し、再開したらまた押します。
3. 計測を止めるときは、**心停止時間** ボタンを押します。
   - もう一度押すと再開します。
4. **リセット** で、すべて消去します。
5. 見出しの **QR** ボタンを押すと、このページを開く QR コードが画面いっぱいに出ます。
   - どこかを押すと閉じます。

いきなり胸骨圧迫時間ボタンを押した場合は、計測も同時に始まります。

### 使い方の動画

- CCF計測器（ver1.0）
  - 日本語：[スマホ](https://keiimai.github.io/kwskCCF/videos/ja-phone.mp4)・[タブレット](https://keiimai.github.io/kwskCCF/videos/ja-tablet.mp4)
  - 英語：[スマホ](https://keiimai.github.io/kwskCCF/videos/en-phone.mp4)・[タブレット](https://keiimai.github.io/kwskCCF/videos/en-tablet.mp4)
- 試験版（ver2.0）
  - 日本語：[スマホ](https://keiimai.github.io/kwskCCF/next/videos/ja-phone.mp4)・[タブレット](https://keiimai.github.io/kwskCCF/next/videos/ja-tablet.mp4)
  - 英語：[スマホ](https://keiimai.github.io/kwskCCF/next/videos/en-phone.mp4)・[タブレット](https://keiimai.github.io/kwskCCF/next/videos/en-tablet.mp4)

### 電波のない所で使うとき

- 一度、電波のある所でこのページを開いておきます。
- そのあとは、電波がなくても開けます。
- ホーム画面に追加すると、アプリのようにアイコンから開けます。

### 画面の見方

画面には、上から次の順に表示されます。

- 計測時間
- 圧迫時間
- CCF（%）
- 中断時間の記録

計算方法の詳細は [docs/spec.md](docs/spec.md) にあります。

QRコードは株式会社デンソーウェーブの登録商標です。

## 制作に使ったもの

- 開発には Claude Opus 5.5（Anthropic）を使いました。
- 使い方の動画の音声は、Gemini 3.8 Flash TTS（Google）で作りました。

---

# Kawasaki ECC Training Site CCF Calculator

A web app that measures CCF and interruptions in chest compressions during CPR training.

CCF stands for chest compression fraction.

It runs in a browser. No installation is needed.

- CCF Calculator (ver1.0): <https://keiimai.github.io/kwskCCF/?lang=en>
  - Japanese version: <https://keiimai.github.io/kwskCCF/>
- Trial version (ver2.0): <https://keiimai.github.io/kwskCCF/next/?lang=en>
  - Japanese version: <https://keiimai.github.io/kwskCCF/next/>

> This is a tool for education and training.
>
> Do not use it for actual patient care or clinical decisions.
>
> The accuracy of the measurements is not guaranteed.

## How to use

1. When you confirm cardiac arrest, press the **Arrest time** button to start timing.
2. When you start chest compressions, press the **Compression time** button.
   - Press it again when compressions are interrupted, and again when they resume.
3. To stop timing, press the **Arrest time** button.
   - Press it again to resume.
4. **Reset** clears everything.
5. Press the **QR** button in the header to show a full-screen QR code that opens this page.
   - Tap anywhere to close it.

If you press the Compression time button first, timing starts at the same time.

### How-to videos

- CCF Calculator (ver1.0)
  - English: [Phone](https://keiimai.github.io/kwskCCF/videos/en-phone.mp4) · [Tablet](https://keiimai.github.io/kwskCCF/videos/en-tablet.mp4)
  - Japanese: [Phone](https://keiimai.github.io/kwskCCF/videos/ja-phone.mp4) · [Tablet](https://keiimai.github.io/kwskCCF/videos/ja-tablet.mp4)
- Trial version (ver2.0)
  - English: [Phone](https://keiimai.github.io/kwskCCF/next/videos/en-phone.mp4) · [Tablet](https://keiimai.github.io/kwskCCF/next/videos/en-tablet.mp4)
  - Japanese: [Phone](https://keiimai.github.io/kwskCCF/next/videos/ja-phone.mp4) · [Tablet](https://keiimai.github.io/kwskCCF/next/videos/ja-tablet.mp4)

### Using it without a connection

- Open this page once where you have a connection.
- After that, it opens even without a connection.
- Add it to your home screen to open it from an icon, like an app.

### Reading the screen

The screen shows the following, from top to bottom:

- Measured time
- Compression time
- CCF (%)
- Log of interruptions

The calculation is described in detail in [docs/spec.md](docs/spec.md) (in Japanese).

QR Code is a registered trademark of DENSO WAVE INCORPORATED.

## Tools used

- Developed with Claude Opus 5.5 (Anthropic).
- The narration in the how-to videos was made with Gemini 3.8 Flash TTS (Google).
