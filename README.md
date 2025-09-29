## apps モノレポ

このリポジトリは、モバイル（Expo/React Native）と Web（Vite/React）を同居させたモノレポ構成です。

### 構成

- `mobile/`: Expo（React Native）アプリ
- `web/`: Vite（React）アプリ

---

## 前提条件

- Node.js（推奨: LTS）
- パッケージマネージャ（npm もしくは pnpm/yarn）
- モバイル動作確認用
  - iOS: Xcode / iOS Simulator
  - Android: Android Studio / AVD

> Web 側には `bun.lock` が存在しますが、通常の Node パッケージマネージャ（npm/pnpm/yarn）でも問題なく動作する想定です。

---

## セットアップ

モノレポ直下ではなく、各パッケージ配下で依存関係をインストールします。

```bash
# モバイル
cd mobile
npm install

# Web
cd ../web
npm install
```

pnpm や yarn を使う場合は、お好みのコマンドに置き換えてください。

---

## 開発 (Dev)

### Mobile (Expo)

```bash
cd mobile
npm run start
# 必要に応じて
# npm run ios
# npm run android
# npm run web
```

Expo 開発サーバを起動し、QR コード経由や iOS/Android シミュレータで確認できます。

### Web (Vite)

```bash
cd web
npm run dev
```

`http://localhost:5173`（既定）で開発サーバが立ち上がります。

---

## ビルド (Build)

### Mobile

```bash
cd mobile
npm run build
# EAS を利用する場合は
# npx expo export
# npx eas build --platform ios|android --non-interactive
```

### Web

```bash
cd web
npm run build
```

出力先は Vite 既定の `dist/` です。

---

## テスト (Test)

Web 側には `vitest` 設定が含まれています。

```bash
cd web
npm test
# または
npm run test:watch
```

（モバイル側でのテストはプロジェクトポリシーに合わせて導入してください）

---

## 環境変数

- `web/` 側は Vite の規約に従って `.env` 系ファイルを利用できます。
- `mobile/` 側は Expo の `app.json` / `eas.json`、および `process.env` を参照するプラグイン/ポリフィルを利用しています。

機密情報は `.env*` や CI のシークレットで管理し、リポジトリに直接コミットしないでください。

---

## ディレクトリ概要

```
apps/
├─ mobile/                # Expo（React Native）
│  ├─ src/app/            # 画面/ルーティング（expo-router）
│  ├─ src/components/     # UI コンポーネント
│  ├─ src/utils/          # 各種ユーティリティ
│  ├─ polyfills/          # Web/Native 向けポリフィル
│  ├─ patches/            # 依存パッケージへのパッチ
│  └─ App.tsx 他
└─ web/                   # Vite（React）
   ├─ src/app/            # ルート・レイアウト関連
   ├─ src/utils/          # 各種ユーティリティ
   ├─ plugins/            # Vite/ビルド関連プラグイン
   └─ index.css 他
```

---

## よくあるトラブルシュート

- 依存関係でビルドが失敗する
  - `node_modules` のクリーンアップと再インストールを実行してください。
  - 例：`rm -rf node_modules pnpm-lock.yaml package-lock.json yarn.lock && npm install`
- Expo の Metro キャッシュ不整合
  - `expo start -c`（キャッシュクリア）を試してください。
- iOS/Android のネイティブ依存の不整合
  - iOS: `cd ios && pod install && cd ..`
  - Android: Android Studio で Gradle の同期を実施

---

## ライセンス

プロジェクトポリシーに従って適宜追記してください。


