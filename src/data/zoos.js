// zoo-map サンプルデータ
// スキーマは REQUIREMENTS.md §4・§7・§8・§9 を参照。
// フェーズ4より、収録する3園(神戸市立王子動物園・恩賜上野動物園・八木山動物公園フジサキの杜)は
// すべて実在の動物園とし、座標は緯度経度(lat/lng)で表現する。
// エリア・獣舎のポリゴンは data/osm-ref/*.json (Overpass 取得の OSM 参照データ) の
// 実座標をもとに作図し、OSM に該当データが無い獣舎は近傍の実座標から推定している。

/**
 * @typedef {Object} LatLng
 * @property {number} lat
 * @property {number} lng
 *
 * @typedef {Object} Area
 * @property {string} id
 * @property {string} name
 * @property {string} color        マップ塗り分け用の色
 * @property {LatLng[]} points     ポリゴン頂点(緯度経度)
 * @property {LatLng} [labelPos]   ラベル位置。省略時は頂点座標の平均を使う
 * @property {boolean} [facility]  true の場合、動物のいない施設エリア(遊園地・資料館など)。
 *   グレー系配色で描画し、動物一覧のエリア絞り込み候補からは除外する
 *
 * @typedef {Object} SpeciesInfo
 * @property {string} [scientificName] 学名
 * @property {string} [englishName]    英名
 * @property {string} [distribution]   分布
 * @property {string} [habitat]        生息環境
 * @property {string} [diet]           食性
 * @property {string} [lifespan]       寿命(目安)
 *
 * @typedef {Object} Individual
 * @property {string} name              個体名
 * @property {string} [kana]
 * @property {'オス'|'メス'} [sex]
 * @property {string} [birthDate]       'YYYY-MM-DD' または 'YYYY'
 * @property {string} [birthplace]
 * @property {string} [father]
 * @property {string} [mother]
 * @property {string} [arrivedAt]       来園年
 * @property {string} [note]
 *
 * @typedef {Object} Enclosure
 * @property {LatLng[]} points   獣舎・展示場の区画(ポリゴン、緯度経度)
 *
 * @typedef {Object} Animal
 * @property {string} id
 * @property {string} name
 * @property {string} kana
 * @property {string} species
 * @property {string} emoji
 * @property {string} description
 * @property {string} areaId
 * @property {LatLng} position               マップ上のピン位置(緯度経度)
 * @property {Enclosure} [enclosure]         獣舎・展示場の区画(エリア内側の小区画)
 * @property {SpeciesInfo} [speciesInfo]     種としての情報
 * @property {Individual[]} [individuals]    この園にいる個体の情報
 *
 * @typedef {Object} ZooBounds
 * @property {number} south
 * @property {number} west
 * @property {number} north
 * @property {number} east
 *
 * @typedef {Object} Zoo
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {LatLng} center       初期表示の中心座標
 * @property {number} defaultZoom  初期表示のズームレベル(現在は未使用。初期表示は bounds への fitBounds)
 * @property {number} [maxZoom]
 * @property {ZooBounds} bounds    パン制限(園境界+50〜100m 程度。ズームアウト下限もここから動的算出する。§12)
 * @property {Area[]} areas
 * @property {Animal[]} animals
 * @property {string} [disclaimer] 非公式マップである旨などの注意書き。マップ画面に表示する
 */

// --- 複数の動物園で共通して登場する種の speciesInfo (重複定義を避けるための共有定数) ---

/** @type {SpeciesInfo} */
const ZEBRA_INFO = {
  scientificName: 'Equus quagga',
  englishName: 'Plains zebra',
  distribution: '東アフリカから南部アフリカのサバンナ地帯',
  habitat: '草原・サバンナ',
  diet: '植物食(イネ科の草が中心)',
  lifespan: '野生で約20年、飼育下では25年前後',
}

/** @type {SpeciesInfo} */
const HIPPO_INFO = {
  scientificName: 'Hippopotamus amphibius',
  englishName: 'Hippopotamus',
  distribution: 'サハラ以南のアフリカの河川・湖沼周辺',
  habitat: '川や湖などの水辺',
  diet: '植物食(夜間に陸上で草を採食する)',
  lifespan: '野生で約40〜50年',
}

/** @type {SpeciesInfo} */
const LION_INFO = {
  scientificName: 'Panthera leo',
  englishName: 'Lion',
  distribution: 'サハラ以南のアフリカ(インドの一部にも小さな個体群)',
  habitat: 'サバンナ・草原',
  diet: '肉食(群れで大型草食動物を狩る)',
  lifespan: '野生で約10〜14年、飼育下では20年前後',
}

/** @type {SpeciesInfo} */
const FLAMINGO_INFO = {
  scientificName: 'Phoenicopterus roseus',
  englishName: 'Greater flamingo',
  distribution: 'アフリカ、南ヨーロッパ、南西アジアの塩湖・干潟',
  habitat: '塩湖や干潟などの水辺',
  diet: '藻類や小型甲殻類をくちばしで濾し取って食べる',
  lifespan: '野生で約20〜30年、飼育下では50年を超える例もある',
}

/** @type {SpeciesInfo} */
const PENGUIN_INFO = {
  scientificName: 'Spheniscus humboldti',
  englishName: 'Humboldt penguin',
  distribution: 'チリ・ペルーの太平洋沿岸',
  habitat: '岩場の多い海岸',
  diet: '魚食(イワシなどの小魚)',
  lifespan: '野生で約15〜20年、飼育下では20年以上',
}

/** @type {SpeciesInfo} */
const REDPANDA_INFO = {
  scientificName: 'Ailurus fulgens',
  englishName: 'Red panda',
  distribution: 'ヒマラヤ山脈から中国南西部にかけての山岳地帯',
  habitat: '標高の高い森林',
  diet: '植物食中心の雑食(主に笹や竹の葉)',
  lifespan: '野生で約8〜10年、飼育下では14年前後',
}

/** @type {SpeciesInfo} */
const MACAQUE_INFO = {
  scientificName: 'Macaca fuscata',
  englishName: 'Japanese macaque',
  distribution: '本州・四国・九州(世界で最も北に生息するサルの一種)',
  habitat: '山地の森林',
  diet: '雑食(木の実・果実・昆虫など)',
  lifespan: '野生で約20〜25年',
}

/** @type {SpeciesInfo} */
const ASIAN_ELEPHANT_INFO = {
  scientificName: 'Elephas maximus',
  englishName: 'Asian elephant',
  distribution: 'インドから東南アジアにかけて',
  habitat: '森林からサバンナまで幅広く生息',
  diet: '植物食(草・木の葉・樹皮など)',
  lifespan: '野生・飼育下ともに約60年前後',
}

/** @type {SpeciesInfo} */
const RETICULATED_GIRAFFE_INFO = {
  scientificName: 'Giraffa reticulata',
  englishName: 'Reticulated giraffe',
  distribution: 'エチオピア南部からケニア北部・ソマリア',
  habitat: '乾燥した疎林・サバンナ',
  diet: '植物食(アカシアなど高い木の葉)',
  lifespan: '野生で約20〜25年',
}

/** @type {SpeciesInfo} */
const POLAR_BEAR_INFO = {
  scientificName: 'Ursus maritimus',
  englishName: 'Polar bear',
  distribution: '北極圏周辺(北極海沿岸)',
  habitat: '海氷上や沿岸域',
  diet: '肉食(アザラシなど)',
  lifespan: '野生で約20〜25年、飼育下では30年以上',
}

/** @type {SpeciesInfo} */
const SUMATRAN_TIGER_INFO = {
  scientificName: 'Panthera tigris sumatrae',
  englishName: 'Sumatran tiger',
  distribution: 'インドネシア・スマトラ島',
  habitat: '熱帯雨林',
  diet: '肉食(単独で中大型哺乳類を狩る)',
  lifespan: '野生で約15年、飼育下では20年前後',
}

/** @type {SpeciesInfo} */
const CHIMPANZEE_INFO = {
  scientificName: 'Pan troglodytes',
  englishName: 'Chimpanzee',
  distribution: '中央アフリカから西アフリカの熱帯林',
  habitat: '熱帯雨林・サバンナ林',
  diet: '雑食(果実が中心。昆虫や小動物も食べる)',
  lifespan: '野生で約40年、飼育下では50年を超える例もある',
}

/** @type {Zoo[]} */
export const zoos = [
  {
    id: 'oji-zoo',
    name: '神戸市立王子動物園',
    description:
      '神戸市灘区にある実在の動物園。円形の猛獣舎を中心に、放養式の動物舎や広い草食動物エリアなど、' +
      '個性的なゾーンで多彩な動物たちに出会えます。本アプリでは公開情報と OSM (OpenStreetMap) の' +
      '公開データをもとに作図した、非公式の概略マップとして収録しています。',
    disclaimer:
      '公開情報および OpenStreetMap の公開データに基づく非公式の概略マップです。実際の園内配置・飼育状況とは異なる場合があります。' +
      '掲載している個体情報も収録時点(2026年7月時点)の公開情報に基づくもので、最新の飼育状況とは異なる場合があります。' +
      '最新情報は王子動物園の公式サイトをご確認ください。',
    center: { lat: 34.71077, lng: 135.21412 },
    defaultZoom: 16,
    maxZoom: 19,
    // §12: 園境界(tourism=zoo, data/osm-ref/oji-zoo.json)+80m 程度に締めたパン制限
    bounds: { south: 34.708252, west: 135.211197, north: 34.713287, east: 135.217046 },
    areas: [
      {
        id: 'gate-flamingo',
        name: '正面ゲート・フラミンゴ広場',
        color: '#ffccbc',
        points: [
          { lat: 34.7091788, lng: 135.2146354 },
          { lat: 34.7091788, lng: 135.2151162 },
          { lat: 34.709574, lng: 135.2151162 },
          { lat: 34.709574, lng: 135.2146354 },
        ],
        labelPos: { lat: 34.7093764, lng: 135.2148758 },
      },
      {
        id: 'kodomo-no-kuni',
        name: '動物とこどもの国',
        color: '#ffe0b2',
        points: [
          { lat: 34.7093962, lng: 135.212848 },
          { lat: 34.7093962, lng: 135.2135157 },
          { lat: 34.7098224, lng: 135.2135157 },
          { lat: 34.7098224, lng: 135.212848 },
        ],
        labelPos: { lat: 34.7096093, lng: 135.2131819 },
      },
      {
        id: 'animal-science-museum',
        name: '動物科学資料館',
        color: '#dcdcdc',
        facility: true,
        points: [
          { lat: 34.7091, lng: 135.2126 },
          { lat: 34.7095, lng: 135.2126 },
          { lat: 34.7095, lng: 135.2131 },
          { lat: 34.7091, lng: 135.2131 },
        ],
        labelPos: { lat: 34.7093, lng: 135.21285 },
      },
      {
        id: 'herbivore',
        name: '草食動物エリア',
        color: '#dcedc8',
        points: [
          { lat: 34.7115667, lng: 135.2131862 },
          { lat: 34.7097877, lng: 135.2154137 },
          { lat: 34.7119941, lng: 135.214508 },
          { lat: 34.7118659, lng: 135.2136317 },
        ],
        labelPos: { lat: 34.711247, lng: 135.214223 },
      },
      {
        id: 'kyu-hunter-house',
        name: '旧ハンター住宅',
        color: '#d9d9d9',
        facility: true,
        points: [
          { lat: 34.7116, lng: 135.2154 },
          { lat: 34.7126, lng: 135.215 },
          { lat: 34.7123, lng: 135.2163 },
          { lat: 34.7113, lng: 135.216 },
        ],
        labelPos: { lat: 34.712, lng: 135.2157 },
      },
      {
        id: 'free-range',
        name: '放養式動物舎',
        color: '#cfe8f3',
        points: [
          { lat: 34.7101172, lng: 135.2135427 },
          { lat: 34.7101172, lng: 135.214397 },
          { lat: 34.7106376, lng: 135.214397 },
          { lat: 34.7106376, lng: 135.2135427 },
        ],
        labelPos: { lat: 34.7103774, lng: 135.2139699 },
      },
      {
        id: 'carnivore-house',
        name: '円形猛獣舎',
        color: '#f8d7da',
        points: [
          { lat: 34.709719, lng: 135.2156297 },
          { lat: 34.7096602, lng: 135.215979 },
          { lat: 34.7100397, lng: 135.2161576 },
          { lat: 34.7101832, lng: 135.2158299 },
        ],
        labelPos: { lat: 34.7099058, lng: 135.2158856 },
      },
      {
        id: 'ape-house',
        name: '猿舎・小動物エリア',
        color: '#eadcf8',
        points: [
          { lat: 34.7109681, lng: 135.2135575 },
          { lat: 34.7111692, lng: 135.2144714 },
          { lat: 34.711534, lng: 135.2148168 },
          { lat: 34.7112553, lng: 135.2138153 },
        ],
        labelPos: { lat: 34.7112422, lng: 135.2141674 },
      },
      {
        id: 'amusement-park',
        name: '遊園地',
        color: '#d6d6d6',
        facility: true,
        points: [
          { lat: 34.7104, lng: 135.2148 },
          { lat: 34.711, lng: 135.2148 },
          { lat: 34.711, lng: 135.2156 },
          { lat: 34.7104, lng: 135.2156 },
        ],
        labelPos: { lat: 34.7107, lng: 135.2152 },
      },
    ],
    animals: [
      {
        id: 'flamingo',
        name: 'フラミンゴ',
        kana: 'ふらみんご',
        species: '鳥類 / フラミンゴ目',
        emoji: '🦩',
        description:
          '正面ゲートを入ってすぐの広場で出迎えてくれる鮮やかなピンク色の鳥。片足で立って休む姿がよく見られ、群れで行動します。',
        areaId: 'gate-flamingo',
        position: { lat: 34.7093764, lng: 135.2148758 },
        enclosure: {
          points: [
            { lat: 34.7093045, lng: 135.2147665 },
            { lat: 34.7093045, lng: 135.2149851 },
            { lat: 34.7094483, lng: 135.2149851 },
            { lat: 34.7094483, lng: 135.2147665 },
          ],
        },
        speciesInfo: FLAMINGO_INFO,
      },
      {
        id: 'koala',
        name: 'コアラ',
        kana: 'こあら',
        species: '哺乳類 / 双前歯目',
        emoji: '🐨',
        description:
          'ユーカリの葉だけを食べる有袋類で、1日の大半を木の上で眠って過ごします。「動物とこどもの国」で人気の動物です。',
        areaId: 'kodomo-no-kuni',
        position: { lat: 34.7096427, lng: 135.2132971 },
        enclosure: {
          points: [
            { lat: 34.7097399, lng: 135.2133556 },
            { lat: 34.7095662, lng: 135.2134529 },
            { lat: 34.7095332, lng: 135.2133656 },
            { lat: 34.7096461, lng: 135.2133024 },
            { lat: 34.7096041, lng: 135.2131913 },
            { lat: 34.7096516, lng: 135.2131648 },
            { lat: 34.7096936, lng: 135.2132758 },
            { lat: 34.7097069, lng: 135.2132684 },
          ],
        },
        speciesInfo: {
          scientificName: 'Phascolarctos cinereus',
          englishName: 'Koala',
          distribution: 'オーストラリア東部',
          habitat: 'ユーカリの森林',
          diet: '植物食(ユーカリの葉のみ)',
          lifespan: '野生で約10〜15年',
        },
      },
      {
        id: 'humboldt-penguin',
        name: 'フンボルトペンギン',
        kana: 'ふんぼるとぺんぎん',
        species: '鳥類 / ペンギン目',
        emoji: '🐧',
        description:
          '南米チリ・ペルーの海岸に生息するペンギン。空は飛べませんが、水中では翼をひれのように使って上手に泳ぎます。',
        areaId: 'ape-house',
        position: { lat: 34.7114478, lng: 135.214625 },
        enclosure: {
          points: [
            { lat: 34.7113759, lng: 135.2145157 },
            { lat: 34.7113759, lng: 135.2147343 },
            { lat: 34.7115197, lng: 135.2147343 },
            { lat: 34.7115197, lng: 135.2145157 },
          ],
        },
        speciesInfo: PENGUIN_INFO,
      },
      {
        id: 'capybara',
        name: 'カピバラ',
        kana: 'かぴばら',
        species: '哺乳類 / げっ歯目',
        emoji: '🐹',
        description:
          '世界最大のネズミの仲間で、性格はおだやかでのんびり屋。水辺を好み、水に浸かってくつろぐ姿がよく見られます。',
        areaId: 'ape-house',
        position: { lat: 34.7112196, lng: 135.2142616 },
        enclosure: {
          points: [
            { lat: 34.7111477, lng: 135.2141523 },
            { lat: 34.7111477, lng: 135.2143709 },
            { lat: 34.7112915, lng: 135.2143709 },
            { lat: 34.7112915, lng: 135.2141523 },
          ],
        },
        speciesInfo: {
          scientificName: 'Hydrochoerus hydrochaeris',
          englishName: 'Capybara',
          distribution: '南米(パナマからアルゼンチン北部にかけて)',
          habitat: '河川や湖沼周辺の草地',
          diet: '植物食(水草や牧草)',
          lifespan: '野生で約6〜10年',
        },
      },
      {
        id: 'asian-elephant',
        name: 'アジアゾウ',
        kana: 'あじあぞう',
        species: '哺乳類 / 長鼻目',
        emoji: '🐘',
        description:
          'アフリカゾウよりやや小さく、耳も小ぶりなのが特徴のゾウ。鼻を器用に使って食べ物を口へ運びます。草食動物エリアの人気者です。',
        areaId: 'herbivore',
        position: { lat: 34.7099369, lng: 135.215292 },
        enclosure: {
          points: [
            { lat: 34.7101001, lng: 135.2153856 },
            { lat: 34.7098689, lng: 135.2154299 },
            { lat: 34.7098452, lng: 135.215291 },
            { lat: 34.7098482, lng: 135.2152272 },
            { lat: 34.7098846, lng: 135.2152017 },
            { lat: 34.7100742, lng: 135.2152164 },
          ],
        },
        speciesInfo: ASIAN_ELEPHANT_INFO,
        individuals: [
          {
            name: 'ズゼ',
            kana: 'ずぜ',
            sex: 'メス',
            birthDate: '1990-04-05',
            birthplace: 'ラトビア・リガ動物園',
            arrivedAt: '1996年',
            note:
              '1995年の阪神・淡路大震災後、神戸市の姉妹都市であるラトビアの首都リガから、' +
              '被災した子どもたちを元気づけるために来園した。',
          },
          {
            name: 'マック',
            kana: 'まっく',
            sex: 'オス',
            birthDate: '1992-06-13',
            birthplace: 'スイス',
            arrivedAt: '1995年',
          },
        ],
      },
      {
        id: 'reticulated-giraffe',
        name: 'アミメキリン',
        kana: 'あみめきりん',
        species: '哺乳類 / 偶蹄目',
        emoji: '🦒',
        description:
          '網目状の模様が特徴のキリンの亜種。陸上でいちばん背が高い動物で、長い首と舌を使って高い木の葉を食べます。',
        areaId: 'herbivore',
        position: { lat: 34.7115036, lng: 135.2133908 },
        enclosure: {
          points: [
            { lat: 34.7116671, lng: 135.2133519 },
            { lat: 34.7116981, lng: 135.213422 },
            { lat: 34.7114644, lng: 135.2135615 },
            { lat: 34.71138, lng: 135.2135276 },
            { lat: 34.7113037, lng: 135.2133959 },
            { lat: 34.7114499, lng: 135.2133017 },
            { lat: 34.7114746, lng: 135.2133459 },
            { lat: 34.7114871, lng: 135.2133474 },
            { lat: 34.7116072, lng: 135.2132635 },
          ],
        },
        speciesInfo: RETICULATED_GIRAFFE_INFO,
      },
      {
        id: 'zebra',
        name: 'シマウマ',
        kana: 'しまうま',
        species: '哺乳類 / 奇蹄目',
        emoji: '🦓',
        description:
          '白と黒のしま模様が特徴のウマの仲間。しま模様は1頭ごとに異なり、群れの中で個体を見分ける手がかりにもなります。',
        areaId: 'herbivore',
        position: { lat: 34.7117246, lng: 135.2137667 },
        enclosure: {
          points: [
            { lat: 34.7116527, lng: 135.2136574 },
            { lat: 34.7116527, lng: 135.213876 },
            { lat: 34.7117965, lng: 135.213876 },
            { lat: 34.7117965, lng: 135.2136574 },
          ],
        },
        speciesInfo: ZEBRA_INFO,
      },
      {
        id: 'red-panda',
        name: 'レッサーパンダ',
        kana: 'れっさーぱんだ',
        species: '哺乳類 / 食肉目',
        emoji: '🐼',
        description:
          '赤茶色の体と長いしっぽが特徴の小さな動物。「動物とこどもの国」エリアで暮らしており、後ろ足だけで立ち上がる姿が人気です。',
        areaId: 'kodomo-no-kuni',
        position: { lat: 34.7095759, lng: 135.2130666 },
        enclosure: {
          points: [
            { lat: 34.709504, lng: 135.2129573 },
            { lat: 34.709504, lng: 135.2131759 },
            { lat: 34.7096478, lng: 135.2131759 },
            { lat: 34.7096478, lng: 135.2129573 },
          ],
        },
        speciesInfo: REDPANDA_INFO,
      },
      {
        id: 'hippo',
        name: 'カバ',
        kana: 'かば',
        species: '哺乳類 / 偶蹄目',
        emoji: '🦛',
        description:
          '一日の大半を水の中で過ごす大型の草食動物。見た目に反して気が荒い一面もあり、大きく口を開けるポーズが人気です。',
        areaId: 'herbivore',
        position: { lat: 34.7118227, lng: 135.2144426 },
        enclosure: {
          points: [
            { lat: 34.7117508, lng: 135.2143333 },
            { lat: 34.7117508, lng: 135.2145519 },
            { lat: 34.7118946, lng: 135.2145519 },
            { lat: 34.7118946, lng: 135.2143333 },
          ],
        },
        speciesInfo: HIPPO_INFO,
      },
      {
        id: 'polar-bear',
        name: 'ホッキョクグマ',
        kana: 'ほっきょくぐま',
        species: '哺乳類 / 食肉目',
        emoji: '🐻‍❄️',
        description:
          '北極圏に暮らす世界最大級のクマ。白い毛皮で覆われていますが、皮膚は実は黒色です。放養式動物舎で泳ぐ姿も見られます。',
        areaId: 'free-range',
        position: { lat: 34.7102969, lng: 135.2137613 },
        enclosure: {
          points: [
            { lat: 34.710225, lng: 135.213652 },
            { lat: 34.710225, lng: 135.2138706 },
            { lat: 34.7103688, lng: 135.2138706 },
            { lat: 34.7103688, lng: 135.213652 },
          ],
        },
        speciesInfo: POLAR_BEAR_INFO,
        individuals: [
          {
            name: 'ゆめ',
            kana: 'ゆめ',
            sex: 'メス',
            note: '放養式動物舎で暮らすホッキョクグマ。公開情報で確認できた範囲で記載しています。',
          },
        ],
      },
      {
        id: 'california-sea-lion',
        name: 'カリフォルニアアシカ',
        kana: 'かりふぉるにああしか',
        species: '哺乳類 / 食肉目',
        emoji: '🦭',
        description:
          '賢く芸を覚えるのが得意なアシカ。水中では俊敏に泳ぎ、陸上では前あしを使って体を起こして移動します。',
        areaId: 'free-range',
        position: { lat: 34.7104579, lng: 135.2141784 },
        enclosure: {
          points: [
            { lat: 34.710386, lng: 135.2140691 },
            { lat: 34.710386, lng: 135.2142877 },
            { lat: 34.7105298, lng: 135.2142877 },
            { lat: 34.7105298, lng: 135.2140691 },
          ],
        },
        speciesInfo: {
          scientificName: 'Zalophus californianus',
          englishName: 'California sea lion',
          distribution: '北米太平洋岸(カリフォルニアからメキシコ)',
          habitat: '沿岸の岩場・砂浜',
          diet: '魚食(魚やイカなど)',
          lifespan: '野生で約20〜30年',
        },
      },
      {
        id: 'lion',
        name: 'ライオン',
        kana: 'らいおん',
        species: '哺乳類 / 食肉目',
        emoji: '🦁',
        description:
          '「百獣の王」と呼ばれるネコ科の動物。群れで生活し、オスの立派なたてがみが特徴です。円形猛獣舎で展示されています。',
        areaId: 'carnivore-house',
        position: { lat: 34.7098317, lng: 135.2159138 },
        enclosure: {
          points: [
            { lat: 34.7097598, lng: 135.2158045 },
            { lat: 34.7097598, lng: 135.2160231 },
            { lat: 34.7099036, lng: 135.2160231 },
            { lat: 34.7099036, lng: 135.2158045 },
          ],
        },
        speciesInfo: LION_INFO,
      },
      {
        id: 'amur-tiger',
        name: 'アムールトラ',
        kana: 'あむーるとら',
        species: '哺乳類 / 食肉目',
        emoji: '🐅',
        description:
          'トラの亜種の中で最も大きく、寒冷地に適応した厚い毛皮を持ちます。単独で行動し、泳ぎも得意です。',
        areaId: 'carnivore-house',
        position: { lat: 34.7098383, lng: 135.2157931 },
        enclosure: {
          points: [
            { lat: 34.7097664, lng: 135.2156838 },
            { lat: 34.7097664, lng: 135.2159024 },
            { lat: 34.7099102, lng: 135.2159024 },
            { lat: 34.7099102, lng: 135.2156838 },
          ],
        },
        speciesInfo: {
          scientificName: 'Panthera tigris altaica',
          englishName: 'Amur (Siberian) tiger',
          distribution: 'ロシア極東・中国東北部',
          habitat: '寒冷な針葉樹林',
          diet: '肉食(単独で大型哺乳類を狩る)',
          lifespan: '野生で約10〜15年',
        },
      },
      {
        id: 'jaguar',
        name: 'ジャガー',
        kana: 'じゃがー',
        species: '哺乳類 / 食肉目',
        emoji: '🐆',
        description:
          '南北アメリカ大陸最大のネコ科動物。ヒョウに似ますがより頑丈な体つきで、噛む力の強さで知られています。',
        areaId: 'carnivore-house',
        position: { lat: 34.7099474, lng: 135.2159701 },
        enclosure: {
          points: [
            { lat: 34.7098755, lng: 135.2158608 },
            { lat: 34.7098755, lng: 135.2160794 },
            { lat: 34.7100193, lng: 135.2160794 },
            { lat: 34.7100193, lng: 135.2158608 },
          ],
        },
        speciesInfo: {
          scientificName: 'Panthera onca',
          englishName: 'Jaguar',
          distribution: '中南米(メキシコからアルゼンチン北部)',
          habitat: '熱帯雨林や湿地',
          diet: '肉食(泳ぎが得意でカイマンや魚も捕食する)',
          lifespan: '野生で約12〜15年',
        },
      },
      {
        id: 'siberian-lynx',
        name: 'シベリアオオヤマネコ',
        kana: 'しべりあおおやまねこ',
        species: '哺乳類 / 食肉目',
        emoji: '🐈',
        description:
          '耳の先の飾り毛が特徴的な大型のヤマネコ。ユーラシア大陸の寒冷な森林地帯に生息し、単独で狩りをします。',
        areaId: 'carnivore-house',
        position: { lat: 34.7100059, lng: 135.2158655 },
        enclosure: {
          points: [
            { lat: 34.709934, lng: 135.2157562 },
            { lat: 34.709934, lng: 135.2159748 },
            { lat: 34.7100778, lng: 135.2159748 },
            { lat: 34.7100778, lng: 135.2157562 },
          ],
        },
        speciesInfo: {
          scientificName: 'Lynx lynx',
          englishName: 'Eurasian lynx',
          distribution: 'ユーラシア大陸北部の森林地帯',
          habitat: '寒冷な森林',
          diet: '肉食(ノウサギや小型有蹄類など)',
          lifespan: '野生で約10〜15年',
        },
      },
      {
        id: 'chimpanzee',
        name: 'チンパンジー',
        kana: 'ちんぱんじー',
        species: '哺乳類 / 霊長目',
        emoji: '🦧',
        description:
          '人間に最も近い動物の一つとされる大型類人猿。道具を使うなど高い知能を持ち、群れで社会生活を営みます。',
        areaId: 'ape-house',
        position: { lat: 34.7112472, lng: 135.2140336 },
        enclosure: {
          points: [
            { lat: 34.7111753, lng: 135.2139243 },
            { lat: 34.7111753, lng: 135.2141429 },
            { lat: 34.7113191, lng: 135.2141429 },
            { lat: 34.7113191, lng: 135.2139243 },
          ],
        },
        speciesInfo: CHIMPANZEE_INFO,
      },
      {
        id: 'japanese-macaque',
        name: 'ニホンザル',
        kana: 'にほんざる',
        species: '哺乳類 / 霊長目',
        emoji: '🐒',
        description:
          '日本各地の森に生息するサルの仲間。群れで生活し、赤い顔とお尻が特徴です。器用な指先で食べ物を扱います。',
        areaId: 'ape-house',
        position: { lat: 34.7110543, lng: 135.2137493 },
        enclosure: {
          points: [
            { lat: 34.7109824, lng: 135.21364 },
            { lat: 34.7109824, lng: 135.2138586 },
            { lat: 34.7111262, lng: 135.2138586 },
            { lat: 34.7111262, lng: 135.21364 },
          ],
        },
        speciesInfo: MACAQUE_INFO,
      },
    ],
  },
  {
    id: 'ueno-zoo',
    name: '恩賜上野動物園',
    description:
      '東京都台東区にある1882年開園の日本最古の動物園。東園・西園の2エリアからなり、東園ではゴリラやトラ、' +
      'アジアゾウ、ホッキョクグマ、ニホンザルなど、西園では不忍池に近いエリアでハシビロコウやキリン、カバ、' +
      'サイ、オカピなどアフリカ・マダガスカルの動物たちに出会えます。長年親しまれたジャイアントパンダの' +
      'シャオシャオ・レイレイは2026年1月27日に中国へ返還され、本アプリでは収録していません。' +
      '本アプリでは公開情報と OSM (OpenStreetMap) の公開データをもとに作図した、非公式の概略マップとして収録しています。',
    disclaimer:
      '公開情報および OpenStreetMap の公開データに基づく非公式の概略マップです。実際の園内配置・飼育状況とは異なる場合があります。' +
      'ジャイアントパンダのシャオシャオ・レイレイは2026年1月27日に中国へ返還されたため、本アプリでは収録していません。' +
      '掲載している個体情報も収録時点(2026年7月時点)の公開情報に基づくもので、最新の飼育状況とは異なる場合があります。' +
      '最新情報は恩賜上野動物園の公式サイトをご確認ください。',
    center: { lat: 35.71533, lng: 139.77054 },
    defaultZoom: 16,
    maxZoom: 19,
    // §12: 園境界(tourism=zoo, data/osm-ref/ueno-zoo.json)+80m 程度に締めたパン制限
    bounds: { south: 35.711691, west: 139.76701, north: 35.718961, east: 139.774076 },
    areas: [
      {
        id: 'east-garden',
        name: '東園',
        color: '#dcedc8',
        points: [
          { lat: 35.7161848, lng: 139.7698235 },
          { lat: 35.7161417, lng: 139.769845 },
          { lat: 35.7160505, lng: 139.7704744 },
          { lat: 35.7161702, lng: 139.7715714 },
          { lat: 35.7162703, lng: 139.7718894 },
          { lat: 35.7163118, lng: 139.771991 },
          { lat: 35.7163603, lng: 139.7720726 },
          { lat: 35.7164573, lng: 139.772121 },
          { lat: 35.7165315, lng: 139.7721262 },
          { lat: 35.7182688, lng: 139.7716897 },
          { lat: 35.7183476, lng: 139.7716381 },
          { lat: 35.7184252, lng: 139.7715295 },
          { lat: 35.7184508, lng: 139.7714483 },
          { lat: 35.7184235, lng: 139.7706784 },
          { lat: 35.7183792, lng: 139.7704267 },
          { lat: 35.7182942, lng: 139.770272 },
          { lat: 35.7182563, lng: 139.7702271 },
          { lat: 35.7181259, lng: 139.7701517 },
        ],
        labelPos: { lat: 35.7171778, lng: 139.7708672 },
      },
      {
        id: 'west-garden',
        name: '西園',
        color: '#ffe0b2',
        points: [
          { lat: 35.7148025, lng: 139.7680089 },
          { lat: 35.7145491, lng: 139.7680166 },
          { lat: 35.7142554, lng: 139.7680438 },
          { lat: 35.7139336, lng: 139.7681317 },
          { lat: 35.7130466, lng: 139.7695146 },
          { lat: 35.7139438, lng: 139.7698973 },
          { lat: 35.7139702, lng: 139.7699046 },
          { lat: 35.7139953, lng: 139.7699021 },
          { lat: 35.7140154, lng: 139.7698905 },
          { lat: 35.7152155, lng: 139.7684611 },
          { lat: 35.7152346, lng: 139.7683601 },
        ],
        labelPos: { lat: 35.7142248, lng: 139.7690413 },
      },
      {
        id: 'shinobazu-pond',
        name: '不忍池',
        color: '#cfe8f3',
        facility: true,
        // §12: zoo.bounds を園境界+80m程度に締めたことに伴い、パン制限範囲内に収まるよう
        // 西園に隣接する範囲(池の全域ではなく縁)に合わせて調整
        points: [
          { lat: 35.712, lng: 139.7688 },
          { lat: 35.7131, lng: 139.7688 },
          { lat: 35.7131, lng: 139.7706 },
          { lat: 35.712, lng: 139.7706 },
        ],
        labelPos: { lat: 35.71255, lng: 139.7697 },
      },
    ],
    animals: [
      {
        id: 'western-lowland-gorilla',
        name: 'ニシゴリラ',
        kana: 'にしごりら',
        species: '哺乳類 / 霊長目',
        emoji: '🦍',
        description:
          '東園の「ゴリラとトラの住む森」で暮らす大型類人猿。ずんぐりとした体格に反して非常に穏やかな性格で、群れで社会生活を営みます。',
        areaId: 'east-garden',
        position: { lat: 35.7179832, lng: 139.7707511 },
        enclosure: {
          points: [
            { lat: 35.7178939, lng: 139.7704131 },
            { lat: 35.7178178, lng: 139.7704792 },
            { lat: 35.7177827, lng: 139.7705272 },
            { lat: 35.7177758, lng: 139.7705705 },
            { lat: 35.717789, lng: 139.7706435 },
            { lat: 35.7178188, lng: 139.7708084 },
            { lat: 35.7178314, lng: 139.7708048 },
            { lat: 35.7179095, lng: 139.7711749 },
            { lat: 35.7179517, lng: 139.7711634 },
            { lat: 35.7180861, lng: 139.7711269 },
            { lat: 35.7181154, lng: 139.7710812 },
            { lat: 35.7181154, lng: 139.7710452 },
            { lat: 35.7181066, lng: 139.7710259 },
            { lat: 35.7180763, lng: 139.7710007 },
            { lat: 35.7180539, lng: 139.7709827 },
            { lat: 35.7180578, lng: 139.770931 },
            { lat: 35.7180763, lng: 139.7708877 },
            { lat: 35.7181066, lng: 139.7708481 },
            { lat: 35.7181222, lng: 139.7707892 },
            { lat: 35.7180978, lng: 139.7705993 },
            { lat: 35.7180744, lng: 139.7705645 },
            { lat: 35.7180539, lng: 139.7705236 },
            { lat: 35.7180324, lng: 139.7704864 },
            { lat: 35.7180022, lng: 139.7704551 },
            { lat: 35.717971, lng: 139.7704672 },
            { lat: 35.7179241, lng: 139.7704503 },
            { lat: 35.7179046, lng: 139.7704287 },
          ],
        },
        speciesInfo: {
          scientificName: 'Gorilla gorilla gorilla',
          englishName: 'Western lowland gorilla',
          distribution: '中央アフリカの熱帯林',
          habitat: '熱帯雨林',
          diet: '植物食中心の雑食(果実・木の葉・樹皮など)',
          lifespan: '野生で約35年、飼育下では40年を超える例もある',
        },
        individuals: [
          {
            name: 'モモコ',
            kana: 'ももこ',
            sex: 'メス',
            note:
              '複数の子を育てた母親ゴリラ。上野動物園で長年繁殖の中心を担ってきた個体で、' +
              '2026年時点で健康状態の経過観察が行われている。',
          },
        ],
      },
      {
        id: 'sumatran-tiger',
        name: 'スマトラトラ',
        kana: 'すまとらとら',
        species: '哺乳類 / 食肉目',
        emoji: '🐅',
        description:
          '東園の「トラの住む森」で暮らすトラの亜種。2025年7月、上野動物園では26年ぶりとなる仔トラが誕生し話題になりました。',
        areaId: 'east-garden',
        position: { lat: 35.7180378, lng: 139.7714079 },
        enclosure: {
          points: [
            { lat: 35.7180143, lng: 139.7712914 },
            { lat: 35.7180718, lng: 139.7712854 },
            { lat: 35.7181257, lng: 139.7713133 },
            { lat: 35.7181455, lng: 139.7713558 },
            { lat: 35.7181249, lng: 139.771415 },
            { lat: 35.7180572, lng: 139.7714895 },
            { lat: 35.7179866, lng: 139.7715189 },
            { lat: 35.7179518, lng: 139.7715189 },
            { lat: 35.7179275, lng: 139.771505 },
            { lat: 35.7179731, lng: 139.7713856 },
          ],
        },
        speciesInfo: SUMATRAN_TIGER_INFO,
        individuals: [
          {
            name: 'ブラン',
            kana: 'ぶらん',
            sex: 'オス',
            birthDate: '2013-05-21',
            birthplace: '仙台市八木山動物公園フジサキの杜',
            arrivedAt: '2018年12月',
            note: '八木山動物公園生まれで、2018年に上野動物園へ来園したオス。',
          },
          {
            name: 'ミンピ',
            kana: 'みんぴ',
            sex: 'メス',
            birthDate: '2014-08-04',
            birthplace: 'よこはま動物園ズーラシア',
            arrivedAt: '2020年11月',
          },
          {
            name: 'ベラニ',
            kana: 'べらに',
            sex: 'オス',
            birthDate: '2025-07-02',
            birthplace: '当園生まれ',
            father: 'ブラン',
            mother: 'ミンピ',
            note: '2025年7月に誕生した仔トラの一頭(オス)。上野動物園では26年ぶりの繁殖。',
          },
          {
            name: 'レスタ',
            kana: 'れすた',
            sex: 'メス',
            birthDate: '2025-07-02',
            birthplace: '当園生まれ',
            father: 'ブラン',
            mother: 'ミンピ',
            note: 'ベラニの双子きょうだい(メス)。',
          },
        ],
      },
      {
        id: 'asian-elephant',
        name: 'アジアゾウ',
        kana: 'あじあぞう',
        species: '哺乳類 / 長鼻目',
        emoji: '🐘',
        description:
          '東園の「ゾウの住む森」で暮らすゾウ。2020年10月、開園以来初めてとなる繁殖に成功し、話題になりました。',
        areaId: 'east-garden',
        position: { lat: 35.7167, lng: 139.7715775 },
        enclosure: {
          points: [
            { lat: 35.7165155, lng: 139.7713074 },
            { lat: 35.7166361, lng: 139.7712604 },
            { lat: 35.7167288, lng: 139.7712234 },
            { lat: 35.7167981, lng: 139.7713508 },
            { lat: 35.7168923, lng: 139.7714225 },
            { lat: 35.7169389, lng: 139.7714935 },
            { lat: 35.7168154, lng: 139.7716789 },
            { lat: 35.7168064, lng: 139.7717417 },
            { lat: 35.7167802, lng: 139.7717902 },
            { lat: 35.7167424, lng: 139.771839 },
            { lat: 35.7166794, lng: 139.7718469 },
            { lat: 35.7165993, lng: 139.771821 },
            { lat: 35.716564, lng: 139.7717598 },
            { lat: 35.716536, lng: 139.7716823 },
            { lat: 35.7164674, lng: 139.771445 },
          ],
        },
        speciesInfo: ASIAN_ELEPHANT_INFO,
        individuals: [
          {
            name: 'ウタイ',
            kana: 'うたい',
            sex: 'メス',
            arrivedAt: '2002年10月',
            note:
              '2002年10月、タイ王国スリン県から日本国民への友好の証として来園。2020年にアルンを出産した。',
          },
          {
            name: 'アルン',
            kana: 'あるん',
            sex: 'オス',
            birthDate: '2020-10-31',
            birthplace: '当園生まれ',
            mother: 'ウタイ',
            note: '上野動物園の開園(1882年)以来、初めて園内で誕生したアジアゾウ。',
          },
        ],
      },
      {
        id: 'polar-bear',
        name: 'ホッキョクグマ',
        kana: 'ほっきょくぐま',
        species: '哺乳類 / 食肉目',
        emoji: '🐻‍❄️',
        description:
          '東園の「ホッキョクグマと海鳥の水辺」で暮らす世界最大級のクマ。水中に飛び込んで泳ぐ豪快な姿が見どころです。',
        areaId: 'east-garden',
        position: { lat: 35.7165207, lng: 139.7703566 },
        enclosure: {
          points: [
            { lat: 35.7164826, lng: 139.7702242 },
            { lat: 35.7164364, lng: 139.7700967 },
            { lat: 35.7164143, lng: 139.7700882 },
            { lat: 35.716377, lng: 139.7701018 },
            { lat: 35.7163743, lng: 139.7701494 },
            { lat: 35.7164267, lng: 139.7703941 },
            { lat: 35.7164281, lng: 139.7704621 },
            { lat: 35.7164474, lng: 139.770508 },
            { lat: 35.7165178, lng: 139.7705505 },
            { lat: 35.7165523, lng: 139.7706048 },
            { lat: 35.7165923, lng: 139.7706303 },
            { lat: 35.7166199, lng: 139.770615 },
            { lat: 35.7166413, lng: 139.7705836 },
            { lat: 35.7166475, lng: 139.7705403 },
            { lat: 35.7165971, lng: 139.7703508 },
            { lat: 35.7165916, lng: 139.770321 },
            { lat: 35.7165985, lng: 139.7702845 },
            { lat: 35.7165985, lng: 139.770265 },
            { lat: 35.7165909, lng: 139.7702522 },
            { lat: 35.7165054, lng: 139.7702361 },
            { lat: 35.7164957, lng: 139.7702301 },
          ],
        },
        speciesInfo: POLAR_BEAR_INFO,
        individuals: [
          { name: 'イコロ', kana: 'いころ', sex: 'オス' },
          { name: 'デア', kana: 'であ', sex: 'メス' },
        ],
      },
      {
        id: 'japanese-macaque',
        name: 'ニホンザル',
        kana: 'にほんざる',
        species: '哺乳類 / 霊長目',
        emoji: '🐒',
        description:
          '東園の「日本の動物」エリアで暮らすサルの仲間。群れで生活し、赤い顔とお尻が特徴です。',
        areaId: 'east-garden',
        position: { lat: 35.7164564, lng: 139.7706977 },
        enclosure: {
          points: [
            { lat: 35.7164655, lng: 139.7705461 },
            { lat: 35.7164197, lng: 139.7705412 },
            { lat: 35.7163729, lng: 139.7705557 },
            { lat: 35.7163475, lng: 139.7705857 },
            { lat: 35.7163416, lng: 139.7706206 },
            { lat: 35.7164041, lng: 139.7708585 },
            { lat: 35.7164373, lng: 139.7708765 },
            { lat: 35.7164724, lng: 139.7708741 },
            { lat: 35.7165407, lng: 139.7708417 },
            { lat: 35.7165563, lng: 139.7708104 },
            { lat: 35.7165641, lng: 139.7707876 },
            { lat: 35.7165143, lng: 139.7706037 },
            { lat: 35.7164968, lng: 139.7705677 },
          ],
        },
        speciesInfo: MACAQUE_INFO,
      },
      {
        id: 'shoebill',
        name: 'ハシビロコウ',
        kana: 'はしびろこう',
        species: '鳥類 / ペリカン目',
        emoji: '🦤',
        description:
          '西園で人気の「動かない鳥」。大きなくちばしと鋭い眼光が特徴で、獲物を待ち伏せる間はほとんど動きません。',
        areaId: 'west-garden',
        position: { lat: 35.7142512, lng: 139.768966 },
        enclosure: {
          points: [
            { lat: 35.7141926, lng: 139.7688655 },
            { lat: 35.7143582, lng: 139.7688203 },
            { lat: 35.7143946, lng: 139.7690407 },
            { lat: 35.7142295, lng: 139.7690834 },
            { lat: 35.7142071, lng: 139.7690381 },
            { lat: 35.7141896, lng: 139.7689868 },
            { lat: 35.7141865, lng: 139.768927 },
          ],
        },
        speciesInfo: {
          scientificName: 'Balaeniceps rex',
          englishName: 'Shoebill',
          distribution: '中央〜東アフリカの湿地帯',
          habitat: '湿地・沼地',
          diet: '魚食(肺魚などの大型魚類)',
          lifespan: '野生で約35年前後',
        },
        individuals: [
          { name: 'ハトゥーウェ', kana: 'はとぅーうぇ', sex: 'オス' },
          { name: 'ミリー', kana: 'みりー', sex: 'メス' },
          { name: 'アサンテ', kana: 'あさんて', sex: 'メス' },
          { name: 'サーナ', kana: 'さーな', sex: 'メス' },
        ],
      },
      {
        id: 'reticulated-giraffe',
        name: 'アミメキリン',
        kana: 'あみめきりん',
        species: '哺乳類 / 偶蹄目',
        emoji: '🦒',
        description:
          '西園の「アフリカの動物」エリアで暮らすキリンの亜種。網目状の模様が特徴で、長い首と舌を使って高い木の葉を食べます。',
        areaId: 'west-garden',
        position: { lat: 35.7143563, lng: 139.7685123 },
        enclosure: {
          points: [
            { lat: 35.7142776, lng: 139.7683715 },
            { lat: 35.7142295, lng: 139.7684748 },
            { lat: 35.7142519, lng: 139.7686457 },
            { lat: 35.714359, lng: 139.7686105 },
            { lat: 35.7144287, lng: 139.7685959 },
            { lat: 35.7144928, lng: 139.7685606 },
            { lat: 35.7144543, lng: 139.7683273 },
          ],
        },
        speciesInfo: RETICULATED_GIRAFFE_INFO,
      },
      {
        id: 'hippo',
        name: 'カバ',
        kana: 'かば',
        species: '哺乳類 / 偶蹄目',
        emoji: '🦛',
        description:
          '西園のアフリカの動物エリアで暮らす大型の草食動物。一日の大半を水の中で過ごし、大きく口を開けるポーズが人気です。',
        areaId: 'west-garden',
        position: { lat: 35.7149339, lng: 139.7685404 },
        enclosure: {
          points: [
            { lat: 35.7149656, lng: 139.7685853 },
            { lat: 35.7149917, lng: 139.7685039 },
            { lat: 35.7149043, lng: 139.7684675 },
            { lat: 35.714874, lng: 139.7686048 },
          ],
        },
        speciesInfo: HIPPO_INFO,
      },
      {
        id: 'pygmy-hippo',
        name: 'コビトカバ',
        kana: 'こびとかば',
        species: '哺乳類 / 偶蹄目',
        emoji: '🦛',
        description:
          'カバよりずっと小柄で、単独で行動する希少な動物。上野動物園では長年の繁殖への取り組みで知られています。',
        areaId: 'west-garden',
        position: { lat: 35.7148172, lng: 139.7685094 },
        enclosure: {
          points: [
            { lat: 35.7148639, lng: 139.7686013 },
            { lat: 35.714849, lng: 139.7685933 },
            { lat: 35.714742, lng: 139.7684895 },
            { lat: 35.7147357, lng: 139.7683973 },
            { lat: 35.7148956, lng: 139.7684654 },
          ],
        },
        speciesInfo: {
          scientificName: 'Choeropsis liberiensis',
          englishName: 'Pygmy hippopotamus',
          distribution: '西アフリカ(リベリア、シエラレオネなど)の熱帯林',
          habitat: '河川沿いの森林',
          diet: '植物食',
          lifespan: '野生で約30〜35年、飼育下では40年以上',
        },
      },
      {
        id: 'eastern-black-rhino',
        name: 'ヒガシクロサイ',
        kana: 'ひがしくろさい',
        species: '哺乳類 / 奇蹄目',
        emoji: '🦏',
        description:
          '西園のアフリカの動物エリアで暮らすサイの亜種。絶滅が危惧されている希少な動物で、上野動物園でも保全に取り組んでいます。',
        areaId: 'west-garden',
        position: { lat: 35.7145652, lng: 139.7684035 },
        enclosure: {
          points: [
            { lat: 35.7145073, lng: 139.7683141 },
            { lat: 35.7145115, lng: 139.7683437 },
            { lat: 35.7144692, lng: 139.7683559 },
            { lat: 35.7145003, lng: 139.7685445 },
            { lat: 35.7145843, lng: 139.7685307 },
            { lat: 35.7146453, lng: 139.7684901 },
            { lat: 35.7146572, lng: 139.7683697 },
            { lat: 35.7146463, lng: 139.7682794 },
          ],
        },
        speciesInfo: {
          scientificName: 'Diceros bicornis michaeli',
          englishName: 'Eastern black rhinoceros',
          distribution: '東アフリカ(ケニア・タンザニアなど)',
          habitat: 'サバンナや低木林',
          diet: '植物食(木の葉や枝)',
          lifespan: '野生で約35〜40年',
        },
      },
      {
        id: 'okapi',
        name: 'オカピ',
        kana: 'おかぴ',
        species: '哺乳類 / 偶蹄目',
        emoji: '🦓',
        description:
          '脚にしま模様を持つキリンの仲間。深い森に生息するため長らく「幻の動物」とされてきました。西園で見ることができます。',
        areaId: 'west-garden',
        position: { lat: 35.7141734, lng: 139.7685179 },
        enclosure: {
          points: [
            { lat: 35.7140576, lng: 139.7684264 },
            { lat: 35.7140965, lng: 139.7686572 },
            { lat: 35.7142391, lng: 139.7686497 },
            { lat: 35.7142127, lng: 139.7684805 },
            { lat: 35.7142609, lng: 139.7683756 },
          ],
        },
        speciesInfo: {
          scientificName: 'Okapia johnstoni',
          englishName: 'Okapi',
          distribution: 'コンゴ民主共和国北東部の熱帯雨林',
          habitat: '密林',
          diet: '植物食',
          lifespan: '野生・飼育下ともに約20〜30年',
        },
      },
      {
        id: 'ruffed-lemur',
        name: 'クロシロエリマキキツネザル',
        kana: 'くろしろえりまききつねざる',
        species: '哺乳類 / 霊長目',
        emoji: '🐒',
        description:
          '白黒の毛並みが目を引くマダガスカル島固有のキツネザル。樹上で暮らし、大きな声で鳴き交わすことでも知られています。',
        areaId: 'west-garden',
        position: { lat: 35.7132979, lng: 139.7693947 },
        enclosure: {
          points: [
            { lat: 35.713244, lng: 139.7693062 },
            { lat: 35.713244, lng: 139.7694832 },
            { lat: 35.7133518, lng: 139.7694832 },
            { lat: 35.7133518, lng: 139.7693062 },
          ],
        },
        speciesInfo: {
          scientificName: 'Varecia variegata',
          englishName: 'Black-and-white ruffed lemur',
          distribution: 'マダガスカル東部の熱帯雨林',
          habitat: '樹上性、熱帯雨林',
          diet: '植物食(果実が中心)',
          lifespan: '野生で約15〜20年、飼育下では30年前後',
        },
      },
      {
        id: 'caribbean-flamingo',
        name: 'ベニイロフラミンゴ',
        kana: 'べにいろふらみんご',
        species: '鳥類 / フラミンゴ目',
        emoji: '🦩',
        description:
          '鮮やかな紅色の羽が特徴のフラミンゴ。西園の池で群れる姿は華やかで、片足立ちで休む様子もよく見られます。',
        areaId: 'west-garden',
        position: { lat: 35.714042, lng: 139.7691822 },
        enclosure: {
          points: [
            { lat: 35.7139677, lng: 139.7691372 },
            { lat: 35.7139873, lng: 139.7691056 },
            { lat: 35.7140153, lng: 139.7690857 },
            { lat: 35.7140473, lng: 139.7690804 },
            { lat: 35.7140785, lng: 139.7690906 },
            { lat: 35.7141042, lng: 139.7691148 },
            { lat: 35.7141204, lng: 139.7691493 },
            { lat: 35.7141247, lng: 139.7691887 },
            { lat: 35.7141164, lng: 139.7692272 },
            { lat: 35.7140967, lng: 139.7692588 },
            { lat: 35.7140688, lng: 139.7692788 },
            { lat: 35.7140367, lng: 139.769284 },
            { lat: 35.7140055, lng: 139.7692738 },
            { lat: 35.7139798, lng: 139.7692496 },
            { lat: 35.7139636, lng: 139.7692152 },
            { lat: 35.7139594, lng: 139.7691757 },
          ],
        },
        speciesInfo: {
          scientificName: 'Phoenicopterus ruber',
          englishName: 'American flamingo (Caribbean flamingo)',
          distribution: 'カリブ海沿岸・ガラパゴス諸島など',
          habitat: '塩湖や干潟',
          diet: '藻類や小型甲殻類',
          lifespan: '飼育下で約30〜40年',
        },
      },
      {
        id: 'cape-penguin',
        name: 'ケープペンギン',
        kana: 'けーぷぺんぎん',
        species: '鳥類 / ペンギン目',
        emoji: '🐧',
        description:
          '南アフリカ沿岸に生息するペンギン。鳴き声がロバに似ることから「ジャッカスペンギン」とも呼ばれます。西園の池で泳ぐ姿が見られます。',
        areaId: 'west-garden',
        position: { lat: 35.7140575, lng: 139.7694656 },
        enclosure: {
          points: [
            { lat: 35.7140508, lng: 139.769338 },
            { lat: 35.7140687, lng: 139.7693419 },
            { lat: 35.714084, lng: 139.769354 },
            { lat: 35.7140943, lng: 139.7693723 },
            { lat: 35.7140982, lng: 139.7693942 },
            { lat: 35.714095, lng: 139.7694162 },
            { lat: 35.7140852, lng: 139.769435 },
            { lat: 35.7140703, lng: 139.7694478 },
            { lat: 35.7140722, lng: 139.7694779 },
            { lat: 35.71408, lng: 139.7694794 },
            { lat: 35.714096, lng: 139.7694913 },
            { lat: 35.7141072, lng: 139.7695099 },
            { lat: 35.7141117, lng: 139.7695324 },
            { lat: 35.7141089, lng: 139.7695552 },
            { lat: 35.7140991, lng: 139.769575 },
            { lat: 35.714084, lng: 139.7695887 },
            { lat: 35.7140658, lng: 139.7695943 },
            { lat: 35.7140473, lng: 139.7695908 },
            { lat: 35.7140312, lng: 139.7695788 },
            { lat: 35.7140201, lng: 139.7695602 },
            { lat: 35.7140156, lng: 139.7695378 },
            { lat: 35.7140184, lng: 139.7695149 },
            { lat: 35.7140281, lng: 139.7694951 },
            { lat: 35.7140432, lng: 139.7694814 },
          ],
        },
        speciesInfo: {
          scientificName: 'Spheniscus demersus',
          englishName: 'African penguin (Cape penguin)',
          distribution: '南アフリカ・ナミビア沿岸',
          habitat: '岩場の多い海岸',
          diet: '魚食',
          lifespan: '野生で約10〜15年、飼育下では20年以上',
        },
      },
    ],
  },
  {
    id: 'yagiyama-zoo',
    name: '八木山動物公園フジサキの杜',
    description:
      '仙台市太白区の丘陵地にある動物園。アフリカ園、猛獣舎、類人猿舎、サル山、ふれあいの丘など高低差のある' +
      '地形を生かした展示が特徴で、アフリカゾウやキリン、カバ、シマウマ、ライオン、スマトラトラ、' +
      'ホッキョクグマなど多彩な動物に出会えます。本アプリでは公開情報と OSM (OpenStreetMap) の' +
      '公開データをもとに作図した、非公式の概略マップとして収録しています。',
    disclaimer:
      '公開情報および OpenStreetMap の公開データに基づく非公式の概略マップです。実際の園内配置・飼育状況とは異なる場合があります。' +
      '掲載している個体情報も収録時点(2026年7月時点)の公開情報に基づくもので、最新の飼育状況とは異なる場合があります。' +
      '最新情報は八木山動物公園フジサキの杜の公式サイトをご確認ください。',
    center: { lat: 38.2457, lng: 140.84493 },
    defaultZoom: 16,
    maxZoom: 19,
    // §12: 園境界(tourism=zoo, data/osm-ref/yagiyama-zoo.json)+80m 程度に締めたパン制限
    bounds: { south: 38.24284, west: 140.84107, north: 38.248556, east: 140.848797 },
    areas: [
      {
        id: 'africa-area',
        name: 'アフリカ園',
        color: '#dcedc8',
        points: [
          { lat: 38.2439793, lng: 140.8433186 },
          { lat: 38.2438498, lng: 140.843616 },
          { lat: 38.2444212, lng: 140.8451982 },
          { lat: 38.2448144, lng: 140.8444259 },
          { lat: 38.2445601, lng: 140.8436255 },
        ],
        labelPos: { lat: 38.2442965, lng: 140.8441299 },
      },
      {
        id: 'carnivore-house',
        name: '猛獣舎',
        color: '#f8d7da',
        points: [
          { lat: 38.2463542, lng: 140.8459772 },
          { lat: 38.2465376, lng: 140.8468634 },
          { lat: 38.2470854, lng: 140.8467226 },
        ],
        labelPos: { lat: 38.2466722, lng: 140.8464495 },
      },
      {
        id: 'ape-house',
        name: '類人猿舎',
        color: '#eadcf8',
        points: [
          { lat: 38.2456074, lng: 140.8455927 },
          { lat: 38.2456074, lng: 140.8462789 },
          { lat: 38.2461464, lng: 140.8462789 },
          { lat: 38.2461464, lng: 140.8455927 },
        ],
        labelPos: { lat: 38.2458769, lng: 140.8459358 },
      },
      {
        id: 'monkey-mountain',
        name: 'サル山',
        color: '#fff3cd',
        points: [
          { lat: 38.2467875, lng: 140.8464706 },
          { lat: 38.2467875, lng: 140.847157 },
          { lat: 38.2473265, lng: 140.847157 },
          { lat: 38.2473265, lng: 140.8464706 },
        ],
        labelPos: { lat: 38.247057, lng: 140.8468138 },
      },
      {
        id: 'fureai-hill',
        name: 'ふれあいの丘',
        color: '#ffe0b2',
        points: [
          { lat: 38.2458257, lng: 140.8465951 },
          { lat: 38.2458257, lng: 140.8474964 },
          { lat: 38.2471193, lng: 140.8474964 },
          { lat: 38.2471193, lng: 140.8465951 },
        ],
        labelPos: { lat: 38.2464725, lng: 140.8470458 },
      },
      {
        id: 'reptile-house',
        name: 'は虫類館',
        color: '#d9d9d9',
        facility: true,
        points: [
          { lat: 38.2435, lng: 140.8434 },
          { lat: 38.2438, lng: 140.8434 },
          { lat: 38.2438, lng: 140.8438 },
          { lat: 38.2435, lng: 140.8438 },
        ],
        labelPos: { lat: 38.24365, lng: 140.8436 },
      },
    ],
    animals: [
      {
        id: 'african-elephant',
        name: 'アフリカゾウ',
        kana: 'あふりかぞう',
        species: '哺乳類 / 長鼻目',
        emoji: '🐘',
        description:
          'アフリカ園の中心的な存在であるゾウ。陸上動物最大級の大きさを誇り、大きな耳と長い鼻が特徴です。',
        areaId: 'africa-area',
        position: { lat: 38.2443856, lng: 140.8448581 },
        enclosure: {
          points: [
            { lat: 38.2443048, lng: 140.8447323 },
            { lat: 38.2443048, lng: 140.8449839 },
            { lat: 38.2444664, lng: 140.8449839 },
            { lat: 38.2444664, lng: 140.8447323 },
          ],
        },
        speciesInfo: {
          scientificName: 'Loxodonta africana',
          englishName: 'African bush elephant',
          distribution: 'サハラ以南のアフリカ',
          habitat: 'サバンナから森林まで幅広く生息',
          diet: '植物食(草・木の葉・樹皮など)',
          lifespan: '野生で約60〜70年',
        },
        individuals: [
          {
            name: 'メアリー',
            kana: 'めありー',
            sex: 'メス',
            birthDate: '1966',
            birthplace: 'アフリカ(野生生まれ)',
            note: '推定1966年生まれとされ、日本国内で飼育されるアフリカゾウの中では最高齢級の個体。',
          },
        ],
      },
      {
        id: 'reticulated-giraffe',
        name: 'アミメキリン',
        kana: 'あみめきりん',
        species: '哺乳類 / 偶蹄目',
        emoji: '🦒',
        description:
          'アフリカ園で暮らすキリンの亜種。陸上でいちばん背が高い動物で、長い首と舌を使って高い木の葉を食べます。',
        areaId: 'africa-area',
        position: { lat: 38.2442483, lng: 140.8442843 },
        enclosure: {
          points: [
            { lat: 38.2441675, lng: 140.8441585 },
            { lat: 38.2441675, lng: 140.8444101 },
            { lat: 38.2443291, lng: 140.8444101 },
            { lat: 38.2443291, lng: 140.8441585 },
          ],
        },
        speciesInfo: RETICULATED_GIRAFFE_INFO,
        individuals: [
          { name: 'ジュリー', kana: 'じゅりー', sex: 'オス' },
          { name: 'エミリー', kana: 'えみりー', sex: 'メス' },
        ],
      },
      {
        id: 'hippo',
        name: 'カバ',
        kana: 'かば',
        species: '哺乳類 / 偶蹄目',
        emoji: '🦛',
        description:
          'アフリカ園の池で暮らす大型の草食動物。一日の大半を水の中で過ごし、大きく口を開けるポーズが人気です。',
        areaId: 'africa-area',
        position: { lat: 38.2441061, lng: 140.8436214 },
        enclosure: {
          points: [
            { lat: 38.2440253, lng: 140.8434956 },
            { lat: 38.2440253, lng: 140.8437472 },
            { lat: 38.2441869, lng: 140.8437472 },
            { lat: 38.2441869, lng: 140.8434956 },
          ],
        },
        speciesInfo: HIPPO_INFO,
        individuals: [{ name: 'ヒタチ', kana: 'ひたち', sex: 'メス' }],
      },
      {
        id: 'zebra',
        name: 'シマウマ',
        kana: 'しまうま',
        species: '哺乳類 / 奇蹄目',
        emoji: '🦓',
        description:
          'アフリカ園で暮らすグラントシマウマ(プレーンズシマウマの亜種)。白と黒のしま模様は1頭ごとに異なります。',
        areaId: 'africa-area',
        position: { lat: 38.2444081, lng: 140.8439089 },
        enclosure: {
          points: [
            { lat: 38.2443273, lng: 140.8437831 },
            { lat: 38.2443273, lng: 140.8440347 },
            { lat: 38.2444889, lng: 140.8440347 },
            { lat: 38.2444889, lng: 140.8437831 },
          ],
        },
        speciesInfo: ZEBRA_INFO,
        individuals: [{ name: 'ケイ', kana: 'けい', sex: 'オス', note: 'グラントシマウマの個体。' }],
      },
      {
        id: 'white-rhino',
        name: 'シロサイ',
        kana: 'しろさい',
        species: '哺乳類 / 奇蹄目',
        emoji: '🦏',
        description:
          'アフリカ園で暮らすサイ。サイの仲間の中では最も体が大きく、広い口で地面の短い草を食べます。',
        areaId: 'africa-area',
        position: { lat: 38.244057, lng: 140.8438353 },
        enclosure: {
          points: [
            { lat: 38.2439762, lng: 140.8437095 },
            { lat: 38.2439762, lng: 140.8439611 },
            { lat: 38.2441378, lng: 140.8439611 },
            { lat: 38.2441378, lng: 140.8437095 },
          ],
        },
        speciesInfo: {
          scientificName: 'Ceratotherium simum',
          englishName: 'White rhinoceros',
          distribution: 'アフリカ中南部の草原',
          habitat: 'サバンナ・草原',
          diet: '植物食(主に短い草)',
          lifespan: '野生で約40〜50年',
        },
      },
      {
        id: 'colobus',
        name: 'アビシニアコロブス',
        kana: 'あびしにあころぶす',
        species: '哺乳類 / 霊長目',
        emoji: '🐒',
        description:
          '白と黒の体毛と長い尾が特徴のオナガザル科の仲間。アフリカ園で暮らし、樹上を得意とします。',
        areaId: 'africa-area',
        position: { lat: 38.2445739, lng: 140.8442712 },
        enclosure: {
          points: [
            { lat: 38.2444931, lng: 140.8441454 },
            { lat: 38.2444931, lng: 140.844397 },
            { lat: 38.2446547, lng: 140.844397 },
            { lat: 38.2446547, lng: 140.8441454 },
          ],
        },
        speciesInfo: {
          scientificName: 'Colobus guereza',
          englishName: 'Mantled guereza (Abyssinian black-and-white colobus)',
          distribution: '中央〜東アフリカの森林',
          habitat: '熱帯林の樹上',
          diet: '植物食(木の葉が中心)',
          lifespan: '野生で約20年',
        },
      },
      {
        id: 'lion',
        name: 'ライオン',
        kana: 'らいおん',
        species: '哺乳類 / 食肉目',
        emoji: '🦁',
        description:
          '猛獣舎で暮らす「百獣の王」。オスの立派なたてがみが特徴で、群れで生活します。',
        areaId: 'carnivore-house',
        position: { lat: 38.2465296, lng: 140.8462377 },
        enclosure: {
          points: [
            { lat: 38.2464488, lng: 140.8461119 },
            { lat: 38.2464488, lng: 140.8463635 },
            { lat: 38.2466104, lng: 140.8463635 },
            { lat: 38.2466104, lng: 140.8461119 },
          ],
        },
        speciesInfo: LION_INFO,
        individuals: [{ name: 'ナオ', note: '猛獣舎で暮らすライオン。公開情報で確認できた範囲で記載しています。' }],
      },
      {
        id: 'sumatran-tiger',
        name: 'スマトラトラ',
        kana: 'すまとらとら',
        species: '哺乳類 / 食肉目',
        emoji: '🐅',
        description:
          '猛獣舎で暮らすトラの亜種。八木山動物公園は繁殖にも力を入れており、当園生まれの個体が他園へ巣立った例もあります。',
        areaId: 'carnivore-house',
        position: { lat: 38.2466407, lng: 140.8465463 },
        enclosure: {
          points: [
            { lat: 38.2465599, lng: 140.8464205 },
            { lat: 38.2465599, lng: 140.8466721 },
            { lat: 38.2467215, lng: 140.8466721 },
            { lat: 38.2467215, lng: 140.8464205 },
          ],
        },
        speciesInfo: SUMATRAN_TIGER_INFO,
      },
      {
        id: 'polar-bear',
        name: 'ホッキョクグマ',
        kana: 'ほっきょくぐま',
        species: '哺乳類 / 食肉目',
        emoji: '🐻‍❄️',
        description:
          '猛獣舎で暮らす世界最大級のクマ。北極圏の海氷上で暮らし、泳ぎが得意です。',
        areaId: 'carnivore-house',
        position: { lat: 38.2468462, lng: 140.8465645 },
        enclosure: {
          points: [
            { lat: 38.2467654, lng: 140.8464387 },
            { lat: 38.2467654, lng: 140.8466903 },
            { lat: 38.246927, lng: 140.8466903 },
            { lat: 38.246927, lng: 140.8464387 },
          ],
        },
        speciesInfo: POLAR_BEAR_INFO,
      },
      {
        id: 'japanese-macaque',
        name: 'ニホンザル',
        kana: 'にほんざる',
        species: '哺乳類 / 霊長目',
        emoji: '🐒',
        description:
          'サル山で群れて暮らすニホンザル。日本各地の森に生息するサルの仲間で、冬には温泉に入る地域もあります。',
        areaId: 'monkey-mountain',
        position: { lat: 38.247057, lng: 140.8468138 },
        enclosure: {
          points: [
            { lat: 38.2469762, lng: 140.846688 },
            { lat: 38.2469762, lng: 140.8469396 },
            { lat: 38.2471378, lng: 140.8469396 },
            { lat: 38.2471378, lng: 140.846688 },
          ],
        },
        speciesInfo: MACAQUE_INFO,
      },
      {
        id: 'chimpanzee',
        name: 'チンパンジー',
        kana: 'ちんぱんじー',
        species: '哺乳類 / 霊長目',
        emoji: '🦧',
        description:
          '類人猿舎で暮らす大型類人猿。人間に最も近い動物の一つとされ、道具を使うなど高い知能を持ちます。',
        areaId: 'ape-house',
        position: { lat: 38.2458769, lng: 140.8459358 },
        enclosure: {
          points: [
            { lat: 38.2457961, lng: 140.84581 },
            { lat: 38.2457961, lng: 140.8460616 },
            { lat: 38.2459577, lng: 140.8460616 },
            { lat: 38.2459577, lng: 140.84581 },
          ],
        },
        speciesInfo: CHIMPANZEE_INFO,
      },
      {
        id: 'red-panda',
        name: 'レッサーパンダ',
        kana: 'れっさーぱんだ',
        species: '哺乳類 / 食肉目',
        emoji: '🐼',
        description:
          '「ふれあいの丘」で暮らす小さな動物。木登りが得意で、後ろ足だけで立ち上がる姿が人気です。',
        areaId: 'fureai-hill',
        position: { lat: 38.2468498, lng: 140.8471533 },
        enclosure: {
          points: [
            { lat: 38.246769, lng: 140.8470275 },
            { lat: 38.246769, lng: 140.8472791 },
            { lat: 38.2469306, lng: 140.8472791 },
            { lat: 38.2469306, lng: 140.8470275 },
          ],
        },
        speciesInfo: REDPANDA_INFO,
      },
      {
        id: 'llama',
        name: 'ラマ',
        kana: 'らま',
        species: '哺乳類 / 偶蹄目',
        emoji: '🦙',
        description:
          '「ふれあいの丘」で暮らす南米の高原地帯出身のラクダの仲間。もこもこの毛並みとおっとりした表情が魅力です。',
        areaId: 'fureai-hill',
        position: { lat: 38.2460952, lng: 140.8469382 },
        enclosure: {
          points: [
            { lat: 38.2460144, lng: 140.8468124 },
            { lat: 38.2460144, lng: 140.847064 },
            { lat: 38.246176, lng: 140.847064 },
            { lat: 38.246176, lng: 140.8468124 },
          ],
        },
        speciesInfo: {
          scientificName: 'Lama glama',
          englishName: 'Llama',
          distribution: '南米アンデス山脈一帯(家畜化された種)',
          habitat: '高原地帯',
          diet: '植物食(牧草など)',
          lifespan: '飼育下で約15〜20年',
        },
      },
    ],
  },
]

/** @param {string} zooId */
export function getZoo(zooId) {
  return zoos.find((zoo) => zoo.id === zooId)
}

/**
 * @param {string} zooId
 * @param {string} animalId
 */
export function getAnimal(zooId, animalId) {
  const zoo = getZoo(zooId)
  if (!zoo) return undefined
  return zoo.animals.find((animal) => animal.id === animalId)
}

/**
 * @param {Zoo} zoo
 * @param {string} areaId
 */
export function getArea(zoo, areaId) {
  return zoo?.areas.find((area) => area.id === areaId)
}
