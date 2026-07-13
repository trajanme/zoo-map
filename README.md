# zoo-map

動物園の紙の園内マップは見にくく、目当ての動物がどこにいるのか探しづらい。
「動物園ごとの園内マップ」と「動物の検索・詳細情報」をスマートフォンで見やすく提供する Web アプリ。

実在する動物園3園(神戸市立王子動物園・恩賜上野動物園・八木山動物公園フジサキの杜)の
非公式マップを収録した、バックエンド不要の静的 SPA です。背景地図には国土地理院の
航空写真タイルを同梱し、外部ネットワークに依存せず動作します。

## 画面

| # | 画面 | パス | 概要 |
|---|------|------|------|
| 1 | 動物園一覧 | `#/` | 収録している動物園をカード形式で一覧表示 |
| 2 | 園内マップ | `#/zoos/:zooId` | [Leaflet](https://leafletjs.com/) による実地図(航空写真タイル)背景の園内マップ。エリア・獣舎をポリゴンで色分けし、動物の位置に絵文字ピンを表示。ピンや獣舎をタップするとポップアップで動物名と詳細リンクを表示 |
| 3 | 動物一覧・検索 | `#/zoos/:zooId/animals` | 動物を一覧表示し、名前(漢字・かな)のインクリメンタル検索とエリア絞り込みができる |
| 4 | 動物詳細 | `#/zoos/:zooId/animals/:animalId` | 動物の名前・よみがな・分類・説明・種の情報・個体情報を表示。「マップで場所を見る」でマップ上の該当ピンへ自動ズームして表示 |

詳細な要件は [`REQUIREMENTS.md`](./REQUIREMENTS.md) を参照してください。

## 利用技術

- [Vue 3](https://vuejs.org/) (Composition API)
- [Vite](https://vitejs.dev/)
- [Vue Router 4](https://router.vuejs.org/)(ハッシュモード。GitHub Pages でのリロード 404 を避けるため)
- [Leaflet](https://leafletjs.com/) による地図描画(パン・ズーム、ポリゴン、divIcon マーカー、ポップアップ)
- 背景地図タイルは `public/tiles/{z}/{x}/{y}.jpg` としてリポジトリに同梱(実行時に外部取得しない)
- データは `src/data/zoos.js` に静的モジュールとして同梱(バックエンド不要)

## 地図タイル・出典表記

- 背景タイルは**国土地理院 航空写真タイル(seamlessphoto)**を使用しています。マップ画面に
  「地理院タイル(国土地理院)」の出典を表示しています
- エリア・獣舎のポリゴン形状の一部は [OpenStreetMap](https://www.openstreetmap.org/copyright) の
  公開データ(Overpass API で取得した `tourism=zoo` 境界や `attraction=animal` の獣舎データなど)を
  参考にしており、「© OpenStreetMap contributors」の帰属表示をマップ画面に表示しています
- OSM 参照データ(`data/osm-ref/*.json`)は Overpass の生データ(`out geom` 形式)をそのまま保存したものです

### タイル・参照データの取得ワークフロー

タイル画像と OSM 参照データは、開発環境から外部ネットワークへ到達できないため、
**GitHub Actions(`.github/workflows/download-tiles.yml`, `workflow_dispatch` で起動)**上で
`scripts/download-tiles.mjs` を実行して取得し、`public/tiles/` と `data/osm-ref/` に
コミットする運用にしています。

```bash
# GitHub Actions 上での実行例(ローカルでは外部ネットワークに出られないため通常は使わない)
node scripts/download-tiles.mjs
```

- 各園の bbox(園域+約300mマージン)× ズームレベル 14〜18 の航空写真タイルを取得します
- あわせて Overpass API から各園の `tourism=zoo` 境界・獣舎(`attraction=animal` など)・園路などの
  データを取得します
- リクエスト間には間隔を設け、User-Agent を明示してサーバー負荷に配慮しています
- タイル同梱でリポジトリ・デプロイ成果物が大きくなるため、デプロイワークフロー
  (`.github/workflows/deploy.yml`)では `peaceiris/actions-gh-pages` に `force_orphan: true` を設定し、
  `gh-pages` ブランチが履歴を持たないようにしています

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
タイル取得ワークフローを実行する前でも、航空写真タイルが無いエリアはグレー背景で
表示され、エラーにはなりません。

## ビルド

```bash
npm run build
```

`dist/` ディレクトリに静的ファイルが出力されます(同梱タイルを含みます)。ビルド後の内容を
手元で確認したい場合は次のコマンドで確認できます。

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
  data/        # 動物園・動物のサンプルデータ(静的データモジュール、緯度経度ベース)
  router/      # Vue Router の設定(ハッシュモード)
  views/       # 4画面分の各ビュー(園内マップは Leaflet ベース)
  App.vue      # 共通ヘッダー・フッターとルーターの受け皿
  main.js      # エントリーポイント(Leaflet CSS の読み込みを含む)
public/
  tiles/       # 同梱の航空写真タイル({z}/{x}/{y}.jpg)
data/
  osm-ref/     # OSM (Overpass API) 参照データ。エリア・獣舎の作図に利用
scripts/
  download-tiles.mjs  # タイル・OSM参照データ取得スクリプト(GitHub Actions 上で実行)
```

## 収録している動物園について

- 神戸市立王子動物園・恩賜上野動物園・八木山動物公園フジサキの杜の3園を、
  公開情報および OSM の公開データに基づく**非公式の概略マップ**として収録しています
- 公式の園内マップ画像・図面は複製せず、独自に作図しています(位置関係・隣接関係が
  概ね合っていることを目標としています)
- 飼育動物・個体情報は収録時点(2026年7月時点)の公開情報に基づく代表例であり、
  実際の配置・飼育状況とは異なる場合があります。各園のマップ画面に注意書き(disclaimer)を
  表示しています。最新情報は各園の公式サイトをご確認ください

## 経緯

もともとは書籍「[Vue.js入門 基礎から実践アプリケーション開発まで(技術評論社)](https://amzn.to/3roHcvY)」の
サンプルを写経する形で Vue.js(`v2.5.17`)+ Vue Router(`v3.0.1`)の CDN 版として書き始めたものの、
書籍の写経(ログイン・動物の新規登録デモなど)から先に進めずに止まっていました。

今回、「動物園の園内マップを見やすくしたい」という本来の目的に立ち返り、
Vue 2.5(EOL)から Vue 3 + Vite 構成に作り直し、要件を再定義した上で実装しました。
架空のサンプル動物園から始め、実在動物園の収録・ポリゴンエリア対応・パン/ズーム対応・
種/個体情報の追加を経て、最終的に実地図(同梱タイル)背景への移行と収録園の拡充を行っています。
