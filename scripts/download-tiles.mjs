// 地理院タイル(航空写真)と OSM 参照データ(Overpass)を取得して同梱するスクリプト。
// 開発環境からは外部ネットワークに出られないため、GitHub Actions
// (.github/workflows/download-tiles.yml) 上で実行する前提。
//
// 出典表記: 地理院タイル(国土地理院) / © OpenStreetMap contributors
import { mkdir, writeFile, access } from 'node:fs/promises'
import { dirname } from 'node:path'

const USER_AGENT = 'zoo-map-tile-fetcher (https://github.com/trajanme/zoo-map)'
const TILE_BASE = 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto'
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const ZOOMS = [14, 15, 16, 17, 18]
const DELAY_MS = 150

// bbox: [south, west, north, east] 園域+約300mマージン
const ZOOS = [
  { id: 'oji-zoo', bbox: [34.707, 135.2085, 34.715, 135.2175] },
  // refBbox: Overpass 用の狭い範囲(上野公園全体だとクエリが重く 504 になるため動物園本体に絞る)
  { id: 'ueno-zoo', bbox: [35.7105, 139.7645, 35.7205, 139.7775], refBbox: [35.7125, 139.7685, 35.719, 139.775] },
  { id: 'yagiyama-zoo', bbox: [38.2385, 140.8365, 38.2495, 140.85] },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const lon2tile = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z)
const lat2tile = (lat, z) => {
  const rad = (lat * Math.PI) / 180
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z)
}

const exists = (p) => access(p).then(() => true, () => false)

async function fetchTile(z, x, y) {
  const dest = `public/tiles/${z}/${x}/${y}.jpg`
  if (await exists(dest)) return 'skip'
  const res = await fetch(`${TILE_BASE}/${z}/${x}/${y}.jpg`, {
    headers: { 'User-Agent': USER_AGENT },
  })
  if (res.status === 404) return 'missing'
  if (!res.ok) throw new Error(`tile ${z}/${x}/${y}: HTTP ${res.status}`)
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, Buffer.from(await res.arrayBuffer()))
  return 'ok'
}

async function downloadTiles() {
  let ok = 0, skip = 0, missing = 0
  for (const zoo of ZOOS) {
    const [s, w, n, e] = zoo.bbox
    for (const z of ZOOMS) {
      const x0 = lon2tile(w, z), x1 = lon2tile(e, z)
      const y0 = lat2tile(n, z), y1 = lat2tile(s, z) // y は北ほど小さい
      for (let x = x0; x <= x1; x++) {
        for (let y = y0; y <= y1; y++) {
          const r = await fetchTile(z, x, y)
          if (r === 'ok') { ok++; await sleep(DELAY_MS) }
          else if (r === 'skip') skip++
          else missing++
        }
      }
      console.log(`${zoo.id} z${z}: x ${x0}-${x1}, y ${y0}-${y1} done`)
    }
  }
  console.log(`tiles: ${ok} downloaded, ${skip} skipped(existing), ${missing} missing(404)`)
}

async function fetchOverpass(query, zooId) {
  // 504 等の一時エラーに備え、エンドポイントを替えながらリトライする
  for (let attempt = 0; attempt < 4; attempt++) {
    const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length]
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      })
      if (res.ok) return await res.json()
      console.warn(`overpass ${zooId} attempt ${attempt + 1} (${endpoint}): HTTP ${res.status}`)
    } catch (err) {
      console.warn(`overpass ${zooId} attempt ${attempt + 1} (${endpoint}): ${err.message}`)
    }
    await sleep(15000)
  }
  return null
}

async function downloadOsmRef() {
  let failed = 0
  for (const zoo of ZOOS) {
    const [s, w, n, e] = zoo.refBbox ?? zoo.bbox
    const bbox = `${s},${w},${n},${e}`
    const query = `[out:json][timeout:180];
(
  nwr["tourism"="zoo"](${bbox});
  nwr["zoo"](${bbox});
  nwr["attraction"="animal"](${bbox});
  way["highway"~"footway|path|pedestrian|steps|service"](${bbox});
  way["building"](${bbox});
  nwr["natural"="water"](${bbox});
  nwr["leisure"="park"](${bbox});
);
out geom;`
    const dest = `data/osm-ref/${zoo.id}.json`
    if (await exists(dest)) {
      console.log(`osm-ref ${zoo.id}: exists, skip`)
      continue
    }
    const json = await fetchOverpass(query, zoo.id)
    if (!json) {
      console.error(`osm-ref ${zoo.id}: FAILED after retries (継続します)`)
      failed++
      continue
    }
    await mkdir('data/osm-ref', { recursive: true })
    await writeFile(dest, JSON.stringify(json))
    console.log(`osm-ref ${zoo.id}: ${json.elements?.length ?? 0} elements`)
    await sleep(5000)
  }
  if (failed > 0) console.error(`osm-ref: ${failed} zoo(s) failed — 再実行してください`)
}

await downloadTiles()
await downloadOsmRef()
