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
 * @typedef {Object} Area
 * @property {string} id
 * @property {string} name
 * @property {string} color
 * @property {Rect} rect
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
