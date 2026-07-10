// zoo-map サンプルデータ
// スキーマは REQUIREMENTS.md §4 を参照。
// 実在の動物園ではなく、架空の動物園2園分のデータを保持する。

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
 * @typedef {Object} Animal
 * @property {string} id
 * @property {string} name
 * @property {string} kana
 * @property {string} species
 * @property {string} emoji
 * @property {string} description
 * @property {string} areaId
 * @property {{x:number,y:number}} position
 *
 * @typedef {Object} Zoo
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {Area[]} areas
 * @property {Animal[]} animals
 * @property {string} [disclaimer] 非公式マップである旨などの注意書き。マップ画面に表示する
 */

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
        labelPos: { x: 300, y: 280 },
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
        labelPos: { x: 750, y: 280 },
        labelLines: ['猿舎・', '類人猿エリア'],
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
        labelPos: { x: 525, y: 620 },
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
        position: { x: 450, y: 590 },
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
        position: { x: 100, y: 120 },
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
        position: { x: 100, y: 290 },
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
        position: { x: 110, y: 430 },
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
        position: { x: 320, y: 110 },
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
        position: { x: 480, y: 90 },
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
        position: { x: 620, y: 110 },
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
        position: { x: 720, y: 160 },
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
        position: { x: 650, y: 180 },
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
        position: { x: 270, y: 340 },
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
        position: { x: 330, y: 430 },
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
        position: { x: 555, y: 325 },
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
        position: { x: 620, y: 350 },
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
        position: { x: 490, y: 410 },
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
        position: { x: 555, y: 435 },
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
        position: { x: 730, y: 330 },
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
        position: { x: 770, y: 440 },
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
