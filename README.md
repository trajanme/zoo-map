# zoo-map

動物園の紙の園内マップは見にくく、目当ての動物がどこにいるのか探しづらい。
「動物園ごとの園内マップ」と「動物の検索・詳細情報」をスマートフォンで見やすく提供する Web アプリ。

架空の動物園2園(みなと動物園・もりのおか動物園)のサンプルデータを収録した、
バックエンド不要の静的 SPA(MVP)です。

## 画面

| # | 画面 | パス | 概要 |
|---|------|------|------|
| 1 | 動物園一覧 | `#/` | 収録している動物園をカード形式で一覧表示 |
| 2 | 園内マップ | `#/zoos/:zooId` | インライン SVG の園内マップ。エリアを色分けし、動物の位置に絵文字ピンを表示。ピンをタップするとポップアップで動物名と詳細リンクを表示 |
| 3 | 動物一覧・検索 | `#/zoos/:zooId/animals` | 動物を一覧表示し、名前(漢字・かな)のインクリメンタル検索とエリア絞り込みができる |
| 4 | 動物詳細 | `#/zoos/:zooId/animals/:animalId` | 動物の名前・よみがな・分類・説明・エリアを表示。「マップで場所を見る」でマップ上の該当ピンを強調表示 |

詳細な要件は [`REQUIREMENTS.md`](./REQUIREMENTS.md) を参照してください。

## 利用技術

- [Vue 3](https://vuejs.org/) (Composition API)
- [Vite](https://vitejs.dev/)
- [Vue Router 4](https://router.vuejs.org/)(ハッシュモード。GitHub Pages でのリロード 404 を避けるため)
- インライン SVG によるマップ描画(外部マップライブラリは未使用)
- データは `src/data/zoos.js` に静的モジュールとして同梱(バックエンド不要)

## セットアップ

Node.js がインストールされている環境で以下を実行します。

```bash
npm install
```

## 開発サーバーの起動

```bash
npm run dev
```

表示された URL(既定では `http://localhost:5173/zoo-map/`)をブラウザで開いてください。

## ビルド

```bash
npm run build
```

`dist/` ディレクトリに静的ファイルが出力されます。ビルド後の内容を手元で確認したい場合は次のコマンドで確認できます。

```bash
npm run preview
```

## GitHub Pages へのデプロイ

`main` ブランチへ push すると、GitHub Actions ワークフロー(`.github/workflows/deploy.yml`)が
`npm ci` → `npm run build` → `gh-pages` ブランチへの push まで自動で行い、
GitHub Pages(Source: `gh-pages` ブランチ)として公開されます。

公開 URL: https://trajanme.github.io/zoo-map/

`vite.config.js` の `base` は、このリポジトリ名 `zoo-map` に合わせて `'/zoo-map/'` に設定済みです。
別リポジトリ名で公開する場合は、`vite.config.js` の `base` を実際のリポジトリ名に書き換えてください。

## ディレクトリ構成

```
src/
  data/        # 動物園・動物のサンプルデータ(静的データモジュール)
  router/      # Vue Router の設定(ハッシュモード)
  views/       # 4画面分の各ビュー
  App.vue      # 共通ヘッダー・フッターとルーターの受け皿
  main.js      # エントリーポイント
```

## 経緯

もともとは書籍「[Vue.js入門 基礎から実践アプリケーション開発まで(技術評論社)](https://amzn.to/3roHcvY)」の
サンプルを写経する形で Vue.js(`v2.5.17`)+ Vue Router(`v3.0.1`)の CDN 版として書き始めたものの、
書籍の写経(ログイン・動物の新規登録デモなど)から先に進めずに止まっていました。

今回、「動物園の園内マップを見やすくしたい」という本来の目的に立ち返り、
Vue 2.5(EOL)から Vue 3 + Vite 構成に作り直し、要件を再定義した上で MVP として実装し直しました。
