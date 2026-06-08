# Time-Intensity評価アプリ

官能評価用のTime-Intensity図を簡単に作成できるWebアプリです。

## 🚀 デプロイ手順（初心者向け）

### 1. GitHubアカウント作成
1. https://github.com にアクセス
2. 「Sign up」からアカウント作成

### 2. リポジトリ作成
1. GitHubにログイン
2. 右上の「+」→「New repository」
3. Repository name: `time-intensity-app`
4. Public を選択
5. 「Create repository」をクリック

### 3. ファイルをアップロード
1. 作成したリポジトリページで「uploading an existing file」をクリック
2. 4つのファイル（index.html, style.css, script.js, README.md）をドラッグ&ドロップ
3. 「Commit changes」をクリック

### 4. Vercelでデプロイ
1. https://vercel.com にアクセス
2. 「Sign up」→「Continue with GitHub」
3. GitHubアカウントで連携
4. 「Import Project」→「Import Git Repository」
5. `time-intensity-app` を選択
6. 「Deploy」をクリック
7. 完了！URLが発行されます

## 📖 使い方

1. **サンプル名と評価属性を入力**
2. **「評価開始」をクリック**
3. **スライダーで強度を調整**（リアルタイムで記録）
4. **「評価終了」で記録停止**
5. **CSV出力または画像出力**で資料作成

## 🎯 機能

- ✅ リアルタイムTime-Intensity測定
- ✅ CSV出力（Excel等で利用可能）
- ✅ 画像出力（PNG形式）
- ✅ 商談資料に最適な高品質グラフ
- ✅ スマホ・タブレット対応

## 📊 出力データ

CSV形式で以下の情報が出力されます：
- サンプル名
- 評価属性
- 時間（秒）
- 強度（0-10）

---
Made with ❤️ for 官能評価
