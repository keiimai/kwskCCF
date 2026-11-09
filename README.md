# 川崎ECCトレーニングサイト CCF計測器

心肺蘇生トレーニングで、CCF と胸骨圧迫の中断時間を計測する Web アプリです。

CCF は chest compression fraction（胸骨圧迫比率）の略です。

ブラウザだけで動き、インストールは要りません。

- CCF計測器（ver2.0）：<https://keiimai.github.io/kwskCCF/next/>
  - 英語版：<https://keiimai.github.io/kwskCCF/next/?lang=en>

> 教育・訓練用のツールです。
>
> 実際の患者の診療や臨床判断には使わないでください。
>
> 計測結果の正確さは保証しません。

## 使い方

1. 心停止を認識したら、**心停止認識** ボタンを押して計測を始めます。
2. 胸骨圧迫を始めたら、**胸骨圧迫開始** ボタンを押します。
   - 中断したら **胸骨圧迫中断** を押し、再開したらまた **胸骨圧迫開始** を押します。
3. 初めて除細動したら、**初回除細動** ボタンを押します。
4. ROSC または蘇生中止のときは、**終了** ボタンを押して計測を終えます。
5. 終了したら、**結果を表示** で結果を開きます。
   - **結果を渡す** で出る図を iPad などのカメラで読み取ると、大きな画面で結果が開きます。
6. **リセット** で、すべて消去します。
7. 見出しの **アプリを共有** ボタンを押すと、この計測器を開く QR コードが画面いっぱいに出ます。
   - どこかを押すと閉じます。

心停止認識、初回除細動、終了は、それぞれ 1 回だけです。

### 使い方の動画

- 日本語：[スマホ](https://keiimai.github.io/kwskCCF/next/videos/ja-phone.mp4)・[タブレット](https://keiimai.github.io/kwskCCF/next/videos/ja-tablet.mp4)
- 英語：[スマホ](https://keiimai.github.io/kwskCCF/next/videos/en-phone.mp4)・[タブレット](https://keiimai.github.io/kwskCCF/next/videos/en-tablet.mp4)

### 電波のない所で使うとき

- 一度、電波のある所でこのページを開いておきます。
- そのあとは、電波がなくても開けます。
- ホーム画面に追加すると、アプリのようにアイコンから開けます。

### 画面の見方

スマホの画面には、上から次の順に表示されます。

- 今の状態
- CCF（%）と判定
- 心停止時間と胸骨圧迫時間
- 初回胸骨圧迫・初回除細動までの時間と、中断の記録

計算方法と判定の詳細は [docs/spec.md](docs/spec.md) にあります。

QRコードは株式会社デンソーウェーブの登録商標です。

## 制作に使ったもの

- 開発には Claude Opus 5.5（Anthropic）を使いました。
- 使い方の動画の音声は、Gemini 3.8 Flash TTS（Google）で作りました。

---

# Kawasaki ECC Training Site CCF Calculator

A web app that measures CCF and interruptions in chest compressions during CPR training.

CCF stands for chest compression fraction.

It runs in a browser. No installation is needed.

- CCF Calculator (ver2.0): <https://keiimai.github.io/kwskCCF/next/?lang=en>
  - Japanese version: <https://keiimai.github.io/kwskCCF/next/>

> This is a tool for education and training.
>
> Do not use it for actual patient care or clinical decisions.
>
> The accuracy of the measurements is not guaranteed.

## How to use

1. When you recognize cardiac arrest, press the **Cardiac arrest recognized** button to start timing.
2. When you start chest compressions, press the **Start chest compressions** button.
   - Press **Pause chest compressions** when you pause, and **Start chest compressions** again when you resume.
3. When you defibrillate for the first time, press the **First defibrillation** button.
4. At ROSC or termination of resuscitation, press the **End** button to finish timing.
5. When timing has ended, press **Show results** to open the results.
   - Scan the code shown by **Hand off results** with an iPad or another camera to open the results on a large screen.
6. **Reset** clears everything.
7. Press the **Share app** button in the header to show a full-screen QR code that opens this calculator.
   - Tap anywhere to close it.

Cardiac arrest recognized, First defibrillation, and End can each be pressed only once.

### How-to videos

- English: [Phone](https://keiimai.github.io/kwskCCF/next/videos/en-phone.mp4) · [Tablet](https://keiimai.github.io/kwskCCF/next/videos/en-tablet.mp4)
- Japanese: [Phone](https://keiimai.github.io/kwskCCF/next/videos/ja-phone.mp4) · [Tablet](https://keiimai.github.io/kwskCCF/next/videos/ja-tablet.mp4)

### Using it without a connection

- Open this page once where you have a connection.
- After that, it opens even without a connection.
- Add it to your home screen to open it from an icon, like an app.

### Reading the screen

On a phone, the screen shows the following, from top to bottom:

- Current status
- CCF (%) and rating
- Arrest time and compression time
- Time to first compression and first defibrillation, and the log of pauses

The calculation and rating are described in detail in [docs/spec.md](docs/spec.md) (in Japanese).

QR Code is a registered trademark of DENSO WAVE INCORPORATED.

## Tools used

- Developed with Claude Opus 5.5 (Anthropic).
- The narration in the how-to videos was made with Gemini 3.8 Flash TTS (Google).
