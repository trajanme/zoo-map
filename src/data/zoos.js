// zoo-map サンプルデータ
// スキーマは REQUIREMENTS.md §4・§7・§8 を参照。
// 実在の動物園(神戸市立王子動物園)と、架空の動物園2園分のデータを保持する。

/**
 * @typedef {Object} Rect
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 *
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 *
 * @typedef {Object} Area
 * @property {string} id
 * @property {string} name
 * @property {string} color
 * @property {Rect} [rect]        形状は rect / points のどちらか一方。points があれば優先して描画する
 * @property {Point[]} [points]   ポリゴン頂点 (viewBox 0 0 1000 700 座標系)
 * @property {Point} [labelPos]  ラベル位置。省略時はポリゴンなら頂点平均、矩形なら従来どおりの位置
 * @property {string[]} [labelLines] ラベルを複数行で表示したい場合の行分割(狭いポリゴン向け)。省略時は name を1行で表示
 * @property {boolean} [facility] true の場合、動物のいない施設エリア(遊園地・資料館など)。
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
 * @property {Rect} [rect]
 * @property {Point[]} [points]
 *
 * @typedef {Object} Animal
 * @property {string} id
 * @property {string} name
 * @property {string} kana
 * @property {string} species
 * @property {string} emoji
 * @property {string} description
 * @property {string} areaId
 * @property {{x:number,y:number}} position  マップ上のピン位置
 * @property {Enclosure} [enclosure]         獣舎・展示場の区画(エリア内側の小区画)
 * @property {SpeciesInfo} [speciesInfo]     種としての情報
 * @property {Individual[]} [individuals]    この園にいる個体の情報
 *
 * @typedef {Object} Zoo
 * @property {string} id
 * @property {string} name
 * @property {string} description
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

/** @type {Zoo[]} */
export const zoos = [
  {
    id: 'minato-zoo',
    name: 'みなと動物園',
    description:
      '海の見える丘に広がる、定番の人気者たちに会える動物園。サバンナゾーンから水辺のいきものまで、5つのエリアで約10種の動物が暮らしています。',
    areas: [
      {
        id: 'savanna',
        name: 'サバンナゾーン',
        color: '#dcedc8',
        rect: { x: 20, y: 20, w: 460, h: 320 },
      },
      {
        id: 'carnivore',
        name: 'もうじゅうゾーン',
        color: '#f8d7da',
        rect: { x: 500, y: 20, w: 480, h: 320 },
      },
      {
        id: 'bird',
        name: 'とりのゾーン',
        color: '#fff3cd',
        rect: { x: 20, y: 380, w: 300, h: 300 },
      },
      {
        id: 'water',
        name: 'すいべんゾーン',
        color: '#cfe8f3',
        rect: { x: 340, y: 380, w: 300, h: 300 },
      },
      {
        id: 'fureai',
        name: 'ふれあい広場',
        color: '#eadcf8',
        rect: { x: 660, y: 380, w: 320, h: 300 },
      },
    ],
    animals: [
      {
        id: 'giraffe',
        name: 'キリン',
        kana: 'きりん',
        species: '哺乳類 / 偶蹄目',
        emoji: '🦒',
        description:
          '陸上でいちばん背が高い動物。長い首と舌を使って、高い木の上の葉っぱを食べます。立ったまま眠ることもあります。',
        areaId: 'savanna',
        position: { x: 150, y: 130 },
        enclosure: { rect: { x: 100, y: 90, w: 110, h: 90 } },
        speciesInfo: {
          scientificName: 'Giraffa camelopardalis',
          englishName: 'Giraffe',
          distribution: 'アフリカ中南部のサバンナ地帯',
          habitat: '疎林からサバンナの草原',
          diet: '植物食(アカシアなど高い木の葉)',
          lifespan: '野生で約25年、飼育下では20年以上',
        },
      },
      {
        id: 'zebra',
        name: 'シマウマ',
        kana: 'しまうま',
        species: '哺乳類 / 奇蹄目',
        emoji: '🦓',
        description:
          '白と黒のしま模様が特徴のウマの仲間。しま模様は1頭ごとに違い、指紋のようなものだといわれています。',
        areaId: 'savanna',
        position: { x: 300, y: 180 },
        speciesInfo: ZEBRA_INFO,
      },
      {
        id: 'hippo',
        name: 'カバ',
        kana: 'かば',
        species: '哺乳類 / 偶蹄目',
        emoji: '🦛',
        description:
          '一日の大半を水の中で過ごす大型の草食動物。見た目に反して気が荒い一面もあり、口を大きく開けるポーズが人気です。',
        areaId: 'savanna',
        position: { x: 400, y: 280 },
        speciesInfo: HIPPO_INFO,
      },
      {
        id: 'lion',
        name: 'ライオン',
        kana: 'らいおん',
        species: '哺乳類 / 食肉目',
        emoji: '🦁',
        description:
          '「百獣の王」と呼ばれるネコ科の動物。群れで生活し、オスの立派なたてがみが特徴です。',
        areaId: 'carnivore',
        position: { x: 620, y: 140 },
        enclosure: { rect: { x: 570, y: 100, w: 100, h: 85 } },
        speciesInfo: LION_INFO,
        individuals: [
          {
            name: 'レオ',
            kana: 'れお',
            sex: 'オス',
            birthDate: '2017-03-02',
            birthplace: '当園生まれ',
            father: 'キング',
            mother: 'サニー',
            arrivedAt: '2017年(当園生まれ)',
            note: '堂々としたたてがみが自慢のオス。展示場をゆったりと歩く姿が人気です。',
          },
          {
            name: 'サニー',
            kana: 'さにー',
            sex: 'メス',
            birthDate: '2014-11-10',
            birthplace: '大阪府内の動物園',
            father: '不明',
            mother: '不明',
            arrivedAt: '2016年',
            note: 'レオの母親。おだやかな性格で、日向ぼっこをしていることが多い。',
          },
        ],
      },
      {
        id: 'tiger',
        name: 'トラ',
        kana: 'とら',
        species: '哺乳類 / 食肉目',
        emoji: '🐅',
        description:
          'ネコ科最大級の動物で、オレンジと黒のしま模様が特徴。単独で行動し、泳ぎも得意です。',
        areaId: 'carnivore',
        position: { x: 840, y: 230 },
        speciesInfo: {
          scientificName: 'Panthera tigris',
          englishName: 'Tiger',
          distribution: 'アジア各地(ロシア極東から東南アジアまで)',
          habitat: '森林',
          diet: '肉食(単独で大型哺乳類を狩る)',
          lifespan: '野生で約10〜15年、飼育下では20年前後',
        },
      },
      {
        id: 'flamingo',
        name: 'フラミンゴ',
        kana: 'ふらみんご',
        species: '鳥類 / フラミンゴ目',
        emoji: '🦩',
        description:
          '鮮やかなピンク色の羽が特徴の鳥。片足で立って休む姿がよく見られ、えさに含まれる色素で羽の色が決まります。',
        areaId: 'bird',
        position: { x: 150, y: 520 },
        speciesInfo: FLAMINGO_INFO,
      },
      {
        id: 'humboldt-penguin',
        name: 'フンボルトペンギン',
        kana: 'ふんぼるとぺんぎん',
        species: '鳥類 / ペンギン目',
        emoji: '🐧',
        description:
          '南米の海岸に生息するペンギン。空は飛べませんが、水中では翼をひれのように使って上手に泳ぎます。',
        areaId: 'water',
        position: { x: 420, y: 480 },
        enclosure: { rect: { x: 370, y: 440, w: 100, h: 80 } },
        speciesInfo: PENGUIN_INFO,
      },
      {
        id: 'seal',
        name: 'アザラシ',
        kana: 'あざらし',
        species: '哺乳類 / 食肉目',
        emoji: '🦭',
        description:
          'つぶらな瞳と丸みを帯びた体が愛らしい海の哺乳類。水中では俊敏に泳ぎますが、陸上ではのんびりと過ごします。',
        areaId: 'water',
        position: { x: 560, y: 580 },
        speciesInfo: {
          scientificName: 'Phoca largha',
          englishName: 'Spotted seal',
          distribution: '北太平洋・オホーツク海沿岸',
          habitat: '流氷域や沿岸の海域',
          diet: '魚食(小魚やイカなど)',
          lifespan: '野生で約25〜30年',
        },
      },
      {
        id: 'rabbit',
        name: 'ウサギ',
        kana: 'うさぎ',
        species: '哺乳類 / ウサギ目',
        emoji: '🐰',
        description:
          '長い耳が特徴の小さな動物。ふれあい広場で実際になでたりえさをあげたりできる人気者です。',
        areaId: 'fureai',
        position: { x: 750, y: 470 },
        speciesInfo: {
          scientificName: 'Oryctolagus cuniculus',
          englishName: 'European rabbit (domestic rabbit)',
          distribution: '原種はヨーロッパ原産。家畜化され世界中で飼育される',
          habitat: '草地(飼育下ではふれあい広場など)',
          diet: '植物食(牧草・野菜など)',
          lifespan: '飼育下で約5〜8年',
        },
      },
      {
        id: 'goat',
        name: 'ヤギ',
        kana: 'やぎ',
        species: '哺乳類 / 偶蹄目',
        emoji: '🐐',
        description:
          '好奇心旺盛でどんな植物でもよく食べることで知られる動物。子どもたちとのふれあい体験でも人気です。',
        areaId: 'fureai',
        position: { x: 900, y: 570 },
        speciesInfo: {
          scientificName: 'Capra aegagrus hircus',
          englishName: 'Domestic goat',
          distribution: '世界中で家畜として飼育される',
          habitat: '山地から平地まで幅広く適応',
          diet: '植物食(草や木の葉)',
          lifespan: '飼育下で約10〜15年',
        },
      },
    ],
  },
  {
    id: 'morinooka-zoo',
    name: 'もりのおか動物園',
    description:
      '緑の丘に囲まれた、森と小川がテーマの動物園。木立エリアや高原エリアなど4つのエリアで、レッサーパンダやニホンザルをはじめ約8種の動物たちが暮らしています。',
    areas: [
      {
        id: 'grove',
        name: '木立エリア',
        color: '#c8e6c9',
        rect: { x: 20, y: 20, w: 460, h: 320 },
      },
      {
        id: 'highland',
        name: '高原エリア',
        color: '#ffe0b2',
        rect: { x: 500, y: 20, w: 480, h: 320 },
      },
      {
        id: 'stream',
        name: '小川エリア',
        color: '#b3e5fc',
        rect: { x: 20, y: 360, w: 460, h: 320 },
      },
      {
        id: 'bird-forest',
        name: 'とりの森エリア',
        color: '#fff9c4',
        rect: { x: 500, y: 360, w: 480, h: 320 },
      },
    ],
    animals: [
      {
        id: 'japanese-macaque',
        name: 'ニホンザル',
        kana: 'にほんざる',
        species: '哺乳類 / 霊長目',
        emoji: '🐒',
        description:
          '日本各地の森に生息するサルの仲間。群れで生活し、冬には温泉に入る姿でも知られています。',
        areaId: 'grove',
        position: { x: 150, y: 140 },
        speciesInfo: MACAQUE_INFO,
      },
      {
        id: 'red-panda',
        name: 'レッサーパンダ',
        kana: 'れっさーぱんだ',
        species: '哺乳類 / 食肉目',
        emoji: '🐼',
        description:
          '赤茶色の体と長いしっぽが特徴の小さな動物。木登りが得意で、後ろ足だけで立ち上がる姿が人気です。',
        areaId: 'grove',
        position: { x: 350, y: 230 },
        enclosure: { rect: { x: 300, y: 190, w: 100, h: 85 } },
        speciesInfo: REDPANDA_INFO,
        individuals: [
          {
            name: 'モモ',
            kana: 'もも',
            sex: 'メス',
            birthDate: '2019-06-15',
            birthplace: '当園生まれ',
            father: 'クリ',
            mother: 'ナナ',
            arrivedAt: '2019年(当園生まれ)',
            note: '木登りが得意で、後ろ足だけで立ち上がる仕草がよく見られる人気者。',
          },
          {
            name: 'クリ',
            kana: 'くり',
            sex: 'オス',
            birthDate: '2016',
            birthplace: '長野県内の動物園',
            father: '不明',
            mother: '不明',
            arrivedAt: '2018年',
            note: 'モモの父親。マイペースな性格で、高い場所でくつろぐことが多い。',
          },
        ],
      },
      {
        id: 'african-elephant',
        name: 'アフリカゾウ',
        kana: 'あふりかぞう',
        species: '哺乳類 / 長鼻目',
        emoji: '🐘',
        description:
          '陸上動物最大級の大きさを誇るゾウ。大きな耳と長い鼻が特徴で、鼻を使って水を飲んだりものをつかんだりします。',
        areaId: 'highland',
        position: { x: 650, y: 140 },
        enclosure: { rect: { x: 590, y: 95, w: 120, h: 95 } },
        speciesInfo: {
          scientificName: 'Loxodonta africana',
          englishName: 'African bush elephant',
          distribution: 'サハラ以南のアフリカ',
          habitat: 'サバンナから森林まで幅広く生息',
          diet: '植物食(草・木の葉・樹皮など)',
          lifespan: '野生で約60〜70年',
        },
      },
      {
        id: 'llama',
        name: 'リャマ',
        kana: 'りゃま',
        species: '哺乳類 / 偶蹄目',
        emoji: '🦙',
        description:
          '南米の高原地帯で暮らすラクダの仲間。もこもこの毛並みとおっとりした表情が魅力です。',
        areaId: 'highland',
        position: { x: 870, y: 240 },
        speciesInfo: {
          scientificName: 'Lama glama',
          englishName: 'Llama',
          distribution: '南米アンデス山脈一帯(家畜化された種)',
          habitat: '高原地帯',
          diet: '植物食(牧草など)',
          lifespan: '飼育下で約15〜20年',
        },
      },
      {
        id: 'otter',
        name: 'カワウソ',
        kana: 'かわうそ',
        species: '哺乳類 / 食肉目',
        emoji: '🦦',
        description:
          '水辺で暮らす小型の動物で、泳ぎがとても上手です。仲間同士で手をつないで眠ることもあります。',
        areaId: 'stream',
        position: { x: 150, y: 480 },
        enclosure: { rect: { x: 100, y: 440, w: 100, h: 80 } },
        speciesInfo: {
          scientificName: 'Aonyx cinereus',
          englishName: 'Asian small-clawed otter',
          distribution: '東南アジアから南アジアにかけての湿地帯',
          habitat: '河川・湿地',
          diet: '肉食(甲殻類や貝類、小魚など)',
          lifespan: '野生で約10年、飼育下では15年前後',
        },
      },
      {
        id: 'duck',
        name: 'アヒル',
        kana: 'あひる',
        species: '鳥類 / カモ目',
        emoji: '🦆',
        description:
          '小川エリアの池でのんびり泳ぐ姿が見られる鳥。水をはじく羽毛のおかげで、いつでも羽はさらさらです。',
        areaId: 'stream',
        position: { x: 350, y: 580 },
        speciesInfo: {
          scientificName: 'Anas platyrhynchos domesticus',
          englishName: 'Domestic duck',
          distribution: 'マガモを家禽化したもので世界中で飼育される',
          habitat: '池や水辺',
          diet: '雑食(水草や小さな水生生物など)',
          lifespan: '飼育下で約10年前後',
        },
      },
      {
        id: 'owl',
        name: 'フクロウ',
        kana: 'ふくろう',
        species: '鳥類 / フクロウ目',
        emoji: '🦉',
        description:
          '首を大きく回せることで知られる夜行性の鳥。音を立てずに飛べる特殊な羽根を持っています。',
        areaId: 'bird-forest',
        position: { x: 650, y: 480 },
        speciesInfo: {
          scientificName: 'Strix uralensis',
          englishName: 'Ural owl',
          distribution: 'ユーラシア大陸北部。日本では北海道・本州の山地',
          habitat: '森林',
          diet: '肉食(ネズミなどの小動物)',
          lifespan: '野生で約10年、飼育下では20年以上',
        },
      },
      {
        id: 'parakeet',
        name: 'インコ',
        kana: 'いんこ',
        species: '鳥類 / オウム目',
        emoji: '🦜',
        description:
          '色鮮やかな羽が特徴の鳥で、人の言葉をまねすることでも知られています。とりの森エリアの人気者です。',
        areaId: 'bird-forest',
        position: { x: 870, y: 580 },
        speciesInfo: {
          scientificName: 'Melopsittacus undulatus',
          englishName: 'Budgerigar',
          distribution: 'オーストラリア内陸部',
          habitat: '乾燥した草原・低木地',
          diet: '植物食(草の種子など)',
          lifespan: '飼育下で約7〜10年',
        },
      },
    ],
  },
  {
    id: 'oji-zoo',
    name: '神戸市立王子動物園',
    description:
      '神戸市灘区にある実在の動物園。円形の猛獣舎を中心に、放養式の動物舎や広い草食動物エリアなど、' +
      '個性的なゾーンで多彩な動物たちに出会えます。本アプリでは公開情報をもとに作図した、非公式の概略マップとして収録しています。',
    disclaimer:
      '公開情報に基づく非公式の概略マップです。実際の園内配置・飼育状況とは異なる場合があります。' +
      '掲載している個体情報も収録時点(2026年7月時点)の公開情報に基づくもので、最新の飼育状況とは異なる場合があります。' +
      '最新情報は王子動物園の公式サイトをご確認ください。',
    areas: [
      {
        id: 'kodomo-no-kuni',
        name: '動物とこどもの国',
        color: '#ffe0b2',
        points: [
          { x: 20, y: 35 },
          { x: 210, y: 25 },
          { x: 215, y: 250 },
          { x: 205, y: 495 },
          { x: 20, y: 485 },
        ],
        labelPos: { x: 115, y: 60 },
        labelLines: ['動物と', 'こどもの国'],
      },
      {
        id: 'herbivore',
        name: '草食動物エリア',
        color: '#dcedc8',
        points: [
          { x: 215, y: 25 },
          { x: 820, y: 20 },
          { x: 810, y: 245 },
          { x: 225, y: 250 },
        ],
        labelPos: { x: 500, y: 55 },
      },
      {
        id: 'kyu-hunter-house',
        name: '旧ハンター住宅',
        color: '#d9d9d9',
        facility: true,
        points: [
          { x: 820, y: 20 },
          { x: 975, y: 35 },
          { x: 970, y: 250 },
          { x: 810, y: 245 },
        ],
        labelPos: { x: 895, y: 130 },
        labelLines: ['旧ハンター', '住宅'],
      },
      {
        id: 'free-range',
        name: '放養式動物舎',
        color: '#cfe8f3',
        points: [
          { x: 215, y: 255 },
          { x: 385, y: 250 },
          { x: 390, y: 500 },
          { x: 220, y: 505 },
        ],
        labelPos: { x: 300, y: 275 },
        labelLines: ['放養式', '動物舎'],
      },
      {
        id: 'carnivore-house',
        name: '円形猛獣舎',
        color: '#f8d7da',
        points: [
          { x: 670, y: 375 },
          { x: 655, y: 428 },
          { x: 613, y: 466 },
          { x: 555, y: 480 },
          { x: 497, y: 466 },
          { x: 455, y: 428 },
          { x: 440, y: 375 },
          { x: 455, y: 322 },
          { x: 497, y: 284 },
          { x: 555, y: 270 },
          { x: 613, y: 284 },
          { x: 655, y: 322 },
        ],
        labelPos: { x: 555, y: 375 },
      },
      {
        id: 'ape-house',
        name: '猿舎・類人猿エリア',
        color: '#eadcf8',
        points: [
          { x: 695, y: 250 },
          { x: 810, y: 258 },
          { x: 805, y: 500 },
          { x: 690, y: 505 },
        ],
        labelPos: { x: 750, y: 266 },
        labelLines: ['猿舎'],
      },
      {
        id: 'amusement-park',
        name: '遊園地',
        color: '#d6d6d6',
        facility: true,
        points: [
          { x: 825, y: 250 },
          { x: 975, y: 260 },
          { x: 970, y: 560 },
          { x: 830, y: 560 },
        ],
        labelPos: { x: 900, y: 300 },
      },
      {
        id: 'animal-science-museum',
        name: '動物科学資料館',
        color: '#dcdcdc',
        facility: true,
        points: [
          { x: 20, y: 495 },
          { x: 215, y: 505 },
          { x: 205, y: 655 },
          { x: 20, y: 648 },
        ],
        labelPos: { x: 110, y: 575 },
        labelLines: ['動物科学', '資料館'],
      },
      {
        id: 'gate-flamingo',
        name: '正面ゲート・フラミンゴ広場',
        color: '#ffccbc',
        points: [
          { x: 220, y: 510 },
          { x: 830, y: 560 },
          { x: 815, y: 655 },
          { x: 235, y: 650 },
        ],
        labelPos: { x: 525, y: 550 },
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
        position: { x: 450, y: 605 },
        enclosure: { rect: { x: 380, y: 575, w: 140, h: 75 } },
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
        position: { x: 100, y: 118 },
        enclosure: { rect: { x: 55, y: 80, w: 90, h: 75 } },
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
        areaId: 'kodomo-no-kuni',
        position: { x: 100, y: 287 },
        enclosure: { rect: { x: 50, y: 250, w: 100, h: 75 } },
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
        areaId: 'kodomo-no-kuni',
        position: { x: 105, y: 430 },
        enclosure: { rect: { x: 55, y: 390, w: 100, h: 80 } },
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
        position: { x: 290, y: 115 },
        enclosure: { rect: { x: 225, y: 70, w: 130, h: 90 } },
        speciesInfo: {
          scientificName: 'Elephas maximus',
          englishName: 'Asian elephant',
          distribution: 'インドから東南アジアにかけて',
          habitat: '森林からサバンナまで幅広く生息',
          diet: '植物食(草・木の葉・樹皮など)',
          lifespan: '野生・飼育下ともに約60年前後',
        },
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
        position: { x: 436, y: 122 },
        enclosure: { rect: { x: 381, y: 77, w: 110, h: 90 } },
        speciesInfo: {
          scientificName: 'Giraffa reticulata',
          englishName: 'Reticulated giraffe',
          distribution: 'エチオピア南部からケニア北部・ソマリア',
          habitat: '乾燥した疎林・サバンナ',
          diet: '植物食(アカシアなど高い木の葉)',
          lifespan: '野生で約20〜25年',
        },
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
        position: { x: 562, y: 117 },
        enclosure: { rect: { x: 517, y: 80, w: 90, h: 75 } },
        speciesInfo: ZEBRA_INFO,
      },
      {
        id: 'red-panda',
        name: 'レッサーパンダ',
        kana: 'れっさーぱんだ',
        species: '哺乳類 / 食肉目',
        emoji: '🐼',
        description:
          '赤茶色の体と長いしっぽが特徴の小さな動物。カバ舎の西隣で暮らしており、後ろ足だけで立ち上がる姿が人気です。',
        areaId: 'herbivore',
        position: { x: 662, y: 155 },
        enclosure: { rect: { x: 627, y: 125, w: 70, h: 70 } },
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
        position: { x: 759, y: 170 },
        enclosure: { rect: { x: 712, y: 125, w: 95, h: 90 } },
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
        position: { x: 300, y: 330 },
        enclosure: { rect: { x: 245, y: 295, w: 110, h: 75 } },
        speciesInfo: {
          scientificName: 'Ursus maritimus',
          englishName: 'Polar bear',
          distribution: '北極圏周辺(北極海沿岸)',
          habitat: '海氷上や沿岸域',
          diet: '肉食(アザラシなど)',
          lifespan: '野生で約20〜25年、飼育下では30年以上',
        },
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
        position: { x: 300, y: 430 },
        enclosure: { rect: { x: 240, y: 390, w: 120, h: 85 } },
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
        position: { x: 555, y: 320 },
        enclosure: {
          points: [
            { x: 540, y: 355 },
            { x: 503, y: 308 },
            { x: 607, y: 308 },
            { x: 570, y: 355 },
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
        position: { x: 610, y: 375 },
        enclosure: {
          points: [
            { x: 575, y: 360 },
            { x: 622, y: 323 },
            { x: 622, y: 427 },
            { x: 575, y: 390 },
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
        position: { x: 500, y: 375 },
        enclosure: {
          points: [
            { x: 535, y: 390 },
            { x: 488, y: 427 },
            { x: 488, y: 323 },
            { x: 535, y: 360 },
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
        position: { x: 555, y: 430 },
        enclosure: {
          points: [
            { x: 570, y: 395 },
            { x: 607, y: 442 },
            { x: 503, y: 442 },
            { x: 540, y: 395 },
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
        position: { x: 750, y: 337 },
        enclosure: { rect: { x: 705, y: 295, w: 90, h: 85 } },
        speciesInfo: {
          scientificName: 'Pan troglodytes',
          englishName: 'Chimpanzee',
          distribution: '中央アフリカから西アフリカの熱帯林',
          habitat: '熱帯雨林・サバンナ林',
          diet: '雑食(果実が中心。昆虫や小動物も食べる)',
          lifespan: '野生で約40年、飼育下では50年を超える例もある',
        },
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
        position: { x: 750, y: 440 },
        enclosure: { rect: { x: 705, y: 395, w: 90, h: 90 } },
        speciesInfo: MACAQUE_INFO,
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
