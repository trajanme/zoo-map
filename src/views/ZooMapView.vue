<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import L from 'leaflet'
import { getZoo } from '../data/zoos'

// ?focus= 遷移時にズームするレベル(§9.3)
const FOCUS_ZOOM = 18
// flyTo のアニメーション時間(秒)。§11.2: focus 遷移も滑らかに
const FLY_TO_DURATION = 1
const TILE_URL = `${import.meta.env.BASE_URL}tiles/{z}/{x}/{y}.jpg`
const ATTRIBUTION = '地理院タイル(国土地理院) | © OpenStreetMap contributors'
// zoo.bounds をこの割合だけ広げた範囲を「園内」とみなす(§10: 少し外までは許容する)
const ZOO_BOUNDS_PAD_RATIO = 0.15
// これより低いズームレベルでは獣舎ラベルを非表示にし、DOM 負荷と見た目のごちゃつきを抑える(§11.2)
const ENCLOSURE_LABEL_MIN_ZOOM = 17

const props = defineProps({
  zooId: { type: String, required: true },
})

const route = useRoute()
const router = useRouter()

const zoo = computed(() => getZoo(props.zooId))

const mapContainerRef = ref(null)
/** @type {L.Map | null} */
let map = null
/** @type {ResizeObserver | null} */
let resizeObserver = null
/** @type {Map<string, L.Marker>} */
const markersById = new Map()
/** @type {L.LayerGroup | null} 獣舎ラベル(divIcon)をまとめ、ズームに応じて表示/非表示を切り替える(§11.2) */
let enclosureLabelLayer = null

// フェーズ6: マップ上のオーバーレイパネル(凡例・disclaimer)の折りたたみ状態。初期は折りたたみ(1行要約)
const infoPanelExpanded = ref(false)

// --- §10 現在地表示 ---------------------------------------------------
// 位置情報は端末内(このタブの JS 実行内)でのみ使用し、どこにも送信・保存しない。
/** @type {number | null} watchPosition の ID */
let watchId = null
/** @type {L.CircleMarker | null} 現在地の青ドット */
let locationMarker = null
/** @type {L.Circle | null} 精度円 */
let locationAccuracyCircle = null
/** @type {HTMLButtonElement | null} 現在地ボタンの DOM(Leaflet コントロール内、Vue 管理外) */
let locateBtnEl = null
/** @type {HTMLElement | null} ステータス表示の DOM */
let locateStatusEl = null

/**
 * 現在地機能の状態。
 * status: 'idle'(未開始) | 'watching'(追従中) | 'denied'(許可拒否) | 'unsupported'(非対応) | 'error'(一時的な取得失敗)
 */
const geoState = reactive({
  status: 'idle',
  hasPosition: false,
  inside: true,
})

/** zoo.bounds を少し広げた範囲(§10.1: 「少しのマージン」)で園内判定する */
function isInsideZoo(latlng) {
  const b = zoo.value?.bounds
  if (!b) return false
  const padded = L.latLngBounds([b.south, b.west], [b.north, b.east]).pad(ZOO_BOUNDS_PAD_RATIO)
  return padded.contains(latlng)
}

function updateLocationLayers(latlng, accuracy) {
  if (!map) return
  if (!locationMarker) {
    locationMarker = L.circleMarker(latlng, {
      radius: 8,
      weight: 2,
      color: '#ffffff',
      fillColor: '#1a73e8',
      fillOpacity: 1,
      interactive: false,
    }).addTo(map)
  } else {
    locationMarker.setLatLng(latlng)
  }

  if (!locationAccuracyCircle) {
    locationAccuracyCircle = L.circle(latlng, {
      radius: accuracy,
      weight: 1,
      color: '#1a73e8',
      fillColor: '#1a73e8',
      fillOpacity: 0.15,
      interactive: false,
    }).addTo(map)
  } else {
    locationAccuracyCircle.setLatLng(latlng)
    locationAccuracyCircle.setRadius(accuracy)
  }
}

function removeLocationLayers() {
  if (locationMarker) {
    map?.removeLayer(locationMarker)
    locationMarker = null
  }
  if (locationAccuracyCircle) {
    map?.removeLayer(locationAccuracyCircle)
    locationAccuracyCircle = null
  }
}

function handlePosition(position) {
  const latlng = L.latLng(position.coords.latitude, position.coords.longitude)
  geoState.status = 'watching'
  geoState.hasPosition = true
  geoState.inside = isInsideZoo(latlng)

  if (geoState.inside) {
    updateLocationLayers(latlng, position.coords.accuracy ?? 30)
  } else {
    // 園外では壊れて見えないよう、マーカーは消してステータス表示のみで伝える(§10.1)
    removeLocationLayers()
  }
}

function handleGeoError(err) {
  const isDenied = err?.code === 1 // GeolocationPositionError.PERMISSION_DENIED
  if (isDenied && watchId != null) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
  }
  geoState.hasPosition = false
  removeLocationLayers()
  geoState.status = isDenied ? 'denied' : 'error'
}

function startWatchingLocation() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    geoState.status = 'unsupported'
    return
  }
  geoState.status = 'watching'
  geoState.hasPosition = false
  watchId = navigator.geolocation.watchPosition(handlePosition, handleGeoError, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 20000,
  })
}

function stopWatchingLocation() {
  if (watchId != null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId)
  }
  watchId = null
  geoState.status = 'idle'
  geoState.hasPosition = false
  geoState.inside = true
  removeLocationLayers()
}

/** 現在地ボタンタップ: 未開始なら許可要求(初回タップで初めて要求)、追従中なら園内時のみ再センタリング */
function onLocateButtonClick() {
  if (geoState.status === 'unsupported' || geoState.status === 'denied') return

  if (geoState.status === 'watching') {
    if (geoState.hasPosition && geoState.inside && locationMarker && map) {
      map.setView(locationMarker.getLatLng(), map.getZoom())
    }
    return
  }

  // 'idle' または一時的な 'error' からの(再)開始。ここで初めて許可プロンプトが走る
  startWatchingLocation()
}

/** ステータス表示内の「停止」操作: 追従解除 */
function onLocateStopClick() {
  stopWatchingLocation()
}

function renderLocateControl() {
  if (!locateBtnEl || !locateStatusEl) return
  const s = geoState.status

  locateBtnEl.disabled = s === 'unsupported' || s === 'denied'
  locateBtnEl.classList.toggle('locate-control__btn--active', s === 'watching' && geoState.hasPosition && geoState.inside)
  locateBtnEl.title =
    s === 'unsupported'
      ? '現在地取得に対応していません'
      : s === 'denied'
        ? '位置情報の利用が許可されていません'
        : s === 'watching'
          ? '現在地に再センタリング'
          : '現在地を表示'

  let statusText = ''
  let showStop = false
  if (s === 'unsupported') {
    statusText = '現在地取得に対応していません'
  } else if (s === 'denied') {
    statusText = '位置情報の利用が許可されていません'
  } else if (s === 'error') {
    statusText = '現在地を取得できませんでした'
    showStop = true
  } else if (s === 'watching') {
    showStop = true
    if (!geoState.hasPosition) {
      statusText = '現在地を取得中…'
    } else if (!geoState.inside) {
      statusText = '園外のため非表示'
    } else {
      statusText = ''
    }
  }

  locateStatusEl.innerHTML = ''
  if (statusText) {
    const textEl = document.createElement('span')
    textEl.className = 'locate-control__status-text'
    textEl.textContent = statusText
    locateStatusEl.appendChild(textEl)
  }
  if (showStop) {
    const stopBtn = document.createElement('button')
    stopBtn.type = 'button'
    stopBtn.className = 'locate-control__stop'
    stopBtn.textContent = '停止'
    L.DomEvent.on(stopBtn, 'click', (evt) => {
      L.DomEvent.stopPropagation(evt)
      onLocateStopClick()
    })
    locateStatusEl.appendChild(stopBtn)
  }
  locateStatusEl.hidden = !statusText && !showStop
}

watch(geoState, renderLocateControl, { deep: true })
// -----------------------------------------------------------------------

/** #rrggbb 形式の色を暗くする(獣舎区画をエリア色より一段濃く塗るため) */
function darken(hex, amount = 0.22) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) return hex
  const num = parseInt(match[1], 16)
  const r = Math.round(((num >> 16) & 0xff) * (1 - amount))
  const g = Math.round(((num >> 8) & 0xff) * (1 - amount))
  const b = Math.round((num & 0xff) * (1 - amount))
  return `rgb(${r}, ${g}, ${b})`
}

/** ポリゴン頂点座標の平均(重心)を求める */
function centroidOf(points) {
  const sum = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 })
  return [sum.lat / points.length, sum.lng / points.length]
}

function areaLabelLatLng(area) {
  if (area.labelPos) return [area.labelPos.lat, area.labelPos.lng]
  return centroidOf(area.points)
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch])
}

/** ポップアップの中身(動物名+詳細リンク)。ハッシュリンクはページ遷移なしで Vue Router に拾われる */
function popupHtml(zooId, animal) {
  return (
    `<div class="animal-popup">` +
    `<p class="animal-popup__name"><span aria-hidden="true">${animal.emoji}</span> ${escapeHtml(animal.name)}</p>` +
    `<a class="animal-popup__link" href="#/zoos/${zooId}/animals/${animal.id}">詳細を見る →</a>` +
    `</div>`
  )
}

function setFocusQuery(animalId) {
  if (route.query.focus === animalId) return
  router.replace({ query: { ...route.query, focus: animalId } })
}

function clearFocusQuery(animalId) {
  if (route.query.focus !== animalId) return
  const rest = { ...route.query }
  delete rest.focus
  router.replace({ query: rest })
}

function focusOnAnimal(animalId) {
  const marker = markersById.get(animalId)
  if (!marker || !map) return
  map.flyTo(marker.getLatLng(), FOCUS_ZOOM, { duration: FLY_TO_DURATION })
  marker.openPopup()
}

/** ズームに応じて獣舎ラベル(divIcon)レイヤーの表示/非表示を切り替える(§11.2) */
function updateEnclosureLabelsVisibility() {
  if (!map || !enclosureLabelLayer) return
  const shouldShow = map.getZoom() >= ENCLOSURE_LABEL_MIN_ZOOM
  const isShown = map.hasLayer(enclosureLabelLayer)
  if (shouldShow && !isShown) {
    enclosureLabelLayer.addTo(map)
  } else if (!shouldShow && isShown) {
    map.removeLayer(enclosureLabelLayer)
  }
}

function destroyMap() {
  stopWatchingLocation()
  locateBtnEl = null
  locateStatusEl = null
  resizeObserver?.disconnect()
  resizeObserver = null
  markersById.clear()
  enclosureLabelLayer = null
  if (map) {
    map.remove()
    map = null
  }
}

function buildMap() {
  destroyMap()
  const currentZoo = zoo.value
  if (!currentZoo || !mapContainerRef.value) return

  const bounds = L.latLngBounds(
    [currentZoo.bounds.south, currentZoo.bounds.west],
    [currentZoo.bounds.north, currentZoo.bounds.east],
  )
  const maxZoom = currentZoo.maxZoom ?? 19
  // 同梱タイルの最小ズーム(§9.3)。マップの下限ズームは §12 により動的に算出するため、
  // タイルレイヤー側は取得済みタイルが揃っている範囲を素直に下限として指定するだけでよい
  const TILE_MIN_ZOOM = 14

  map = L.map(mapContainerRef.value, {
    maxZoom,
    maxBounds: bounds,
    // §12: 境界外へのゴム引っ張りをなくし、境界でぴたりと止まるようにする
    maxBoundsViscosity: 1,
    zoomControl: false,
    // --- §11.2 操作の滑らかさ ---
    preferCanvas: true, // エリア・獣舎ポリゴンを Canvas 描画にして負荷を下げる
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 80,
    wheelDebounceTime: 25,
    inertia: true,
    inertiaDeceleration: 2500,
    zoomAnimation: true,
    fadeAnimation: true,
    touchZoom: true,
  })

  // §12: 初期表示は園全体(bounds)が収まるビューにする
  map.fitBounds(bounds)

  // §12: ズームアウトの下限は「園全体が画面に収まるズーム」までとし、固定値ではなく
  // map.getBoundsZoom(bounds) で動的に算出する。画面のリサイズ・回転時にも再計算する
  function updateMinZoom() {
    if (!map) return
    // getBoundsZoom() は現在の minZoom を下限としてクランプして返すため、
    // 一旦下限を外してから再計算しないと、リサイズで下限を「下げる」方向の再計算ができない
    map.setMinZoom(0)
    const boundsZoom = map.getBoundsZoom(bounds)
    map.setMinZoom(boundsZoom)
    // setMinZoom は内部でも現在ズームが下限未満なら引き上げるが、意図を明確にするため明示しておく
    if (map.getZoom() < boundsZoom) {
      map.setZoom(boundsZoom)
    }
  }
  updateMinZoom()
  map.on('resize', updateMinZoom)

  L.control.zoom({ position: 'topright' }).addTo(map)

  // タイル未取得(404)でもエラーにせず、コンテナのグレー背景がそのまま透けるようにする
  L.tileLayer(TILE_URL, {
    minZoom: TILE_MIN_ZOOM,
    maxNativeZoom: 18,
    maxZoom,
    attribution: ATTRIBUTION,
    // §11.2: パン時にタイルの空白が目立たないよう周辺タイルを多めに保持し、常に最新表示を追従させる
    keepBuffer: 4,
    updateWhenIdle: false,
    updateWhenZooming: false,
    errorTileUrl:
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7',
  }).addTo(map)

  const ResetControl = L.Control.extend({
    onAdd() {
      const btn = L.DomUtil.create('button', 'map-reset-btn')
      btn.type = 'button'
      btn.title = '表示をリセット'
      btn.setAttribute('aria-label', '表示をリセット')
      btn.innerText = 'リセット'
      L.DomEvent.on(btn, 'click', (evt) => {
        L.DomEvent.stopPropagation(evt)
        // §12: リセットも fitBounds ベース(園全体が収まるビュー)に揃える
        map.flyToBounds(bounds, { duration: FLY_TO_DURATION })
      })
      return btn
    },
  })
  new ResetControl({ position: 'topright' }).addTo(map)

  const LocateControl = L.Control.extend({
    onAdd() {
      const container = L.DomUtil.create('div', 'locate-control')
      L.DomEvent.disableClickPropagation(container)
      L.DomEvent.disableScrollPropagation(container)

      const btn = L.DomUtil.create('button', 'locate-control__btn', container)
      btn.type = 'button'
      btn.setAttribute('aria-label', '現在地を表示')
      btn.innerHTML = '📍'
      L.DomEvent.on(btn, 'click', (evt) => {
        L.DomEvent.stopPropagation(evt)
        onLocateButtonClick()
      })

      const status = L.DomUtil.create('div', 'locate-control__status', container)
      status.setAttribute('aria-live', 'polite')
      status.hidden = true

      locateBtnEl = btn
      locateStatusEl = status
      return container
    },
  })
  new LocateControl({ position: 'bottomright' }).addTo(map)

  // 位置情報 API の有無だけを確認する(ここでは許可を要求しない。要求はボタンタップ時のみ §10.1)
  geoState.status = typeof navigator !== 'undefined' && navigator.geolocation ? 'idle' : 'unsupported'
  geoState.hasPosition = false
  geoState.inside = true
  renderLocateControl()

  // §13: 園外グレーアウト。外側リング(bounds を大きく超える矩形)+穴=園境界(boundary /
  // boundaryExtra)の複合ポリゴンを重ね、園外を白系の半透明で減光する。マスクは
  // interactive: false にしてタップ・パン・ズームを一切妨げない。preferCanvas 環境では
  // 同一キャンバス内の描画順序が addTo(map) の呼び出し順に一致するため、エリア・獣舎
  // ポリゴンより先に追加することで「タイルの上・エリアの下」の重なりを実現する
  if (currentZoo.boundary?.length) {
    const outerBounds = bounds.pad(1)
    const outerRing = [
      [outerBounds.getSouth(), outerBounds.getWest()],
      [outerBounds.getNorth(), outerBounds.getWest()],
      [outerBounds.getNorth(), outerBounds.getEast()],
      [outerBounds.getSouth(), outerBounds.getEast()],
    ]
    const boundaryHoles = [
      currentZoo.boundary.map((p) => [p.lat, p.lng]),
      ...(currentZoo.boundaryExtra ?? []).map((ring) => ring.map((p) => [p.lat, p.lng])),
    ]

    L.polygon([outerRing, ...boundaryHoles], {
      stroke: false,
      fillColor: '#f4f3ef',
      fillOpacity: 0.68,
      interactive: false,
    }).addTo(map)

    // 園境界(飛び地含む)には細い境界線を別途描き、園域が分かるようにする
    for (const ring of boundaryHoles) {
      L.polygon(ring, {
        fill: false,
        color: 'rgba(40, 40, 40, 0.55)',
        weight: 1.5,
        interactive: false,
      }).addTo(map)
    }
  }

  markersById.clear()
  enclosureLabelLayer = L.layerGroup()

  for (const area of currentZoo.areas) {
    const latlngs = area.points.map((p) => [p.lat, p.lng])
    L.polygon(latlngs, {
      color: area.facility ? 'rgba(60,60,60,0.45)' : 'rgba(0,0,0,0.25)',
      weight: 2,
      dashArray: area.facility ? '6 5' : null,
      fillColor: area.color,
      fillOpacity: area.facility ? 0.45 : 0.4,
      interactive: false,
    }).addTo(map)

    L.marker(areaLabelLatLng(area), {
      icon: L.divIcon({
        className: `area-label-icon${area.facility ? ' area-label-icon--facility' : ''}`,
        html: `<span>${escapeHtml(area.name)}</span>`,
        iconSize: null,
      }),
      interactive: false,
      keyboard: false,
    }).addTo(map)
  }

  for (const animal of currentZoo.animals) {
    const popup = popupHtml(currentZoo.id, animal)

    if (animal.enclosure) {
      const area = currentZoo.areas.find((a) => a.id === animal.areaId)
      const latlngs = animal.enclosure.points.map((p) => [p.lat, p.lng])
      const enclosurePolygon = L.polygon(latlngs, {
        color: 'rgba(0,0,0,0.4)',
        weight: 1.5,
        fillColor: darken(area?.color ?? '#cccccc'),
        fillOpacity: 0.65,
      }).addTo(map)
      enclosurePolygon.bindPopup(popup)
      enclosurePolygon.on('click', () => setFocusQuery(animal.id))
      enclosurePolygon.on('popupclose', () => clearFocusQuery(animal.id))

      L.marker(centroidOf(animal.enclosure.points), {
        icon: L.divIcon({
          className: 'enclosure-label-icon',
          html: `<span>${escapeHtml(animal.name)}</span>`,
          iconSize: null,
        }),
        interactive: false,
        keyboard: false,
      }).addTo(enclosureLabelLayer)
    }

    const marker = L.marker([animal.position.lat, animal.position.lng], {
      icon: L.divIcon({
        className: 'animal-pin-icon',
        html: `<div class="animal-pin-icon__emoji">${animal.emoji}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -18],
      }),
    }).addTo(map)
    marker.bindPopup(popup)
    marker.on('click', () => setFocusQuery(animal.id))
    marker.on('popupclose', () => clearFocusQuery(animal.id))
    markersById.set(animal.id, marker)
  }

  // §11.2: ズームに応じて獣舎ラベルの表示/非表示を切り替える(初期表示分も含めて反映)
  map.on('zoomend', updateEnclosureLabelsVisibility)
  updateEnclosureLabelsVisibility()

  if (typeof route.query.focus === 'string' && markersById.has(route.query.focus)) {
    const id = route.query.focus
    nextTick(() => focusOnAnimal(id))
  }

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => map?.invalidateSize())
    resizeObserver.observe(mapContainerRef.value)
  }
}

onMounted(() => {
  nextTick(buildMap)
})

onBeforeUnmount(() => {
  destroyMap()
})

watch(
  () => props.zooId,
  () => nextTick(buildMap),
)

watch(
  () => route.query.focus,
  (id) => {
    if (typeof id === 'string') focusOnAnimal(id)
  },
)
</script>

<template>
  <section v-if="zoo" class="map-screen">
    <div ref="mapContainerRef" class="zoo-leaflet-map" role="img" :aria-label="`${zoo.name}の園内マップ`"></div>

    <!-- フェーズ6: 「戻る」「動物一覧」はマップ上のフローティングボタンにする(§11.1) -->
    <div class="map-nav-overlay">
      <router-link to="/" class="map-float-btn" aria-label="動物園一覧に戻る">
        <span aria-hidden="true">←</span> 戻る
      </router-link>
      <router-link :to="`/zoos/${zoo.id}/animals`" class="map-float-btn">
        <span aria-hidden="true">📋</span> 動物一覧
      </router-link>
    </div>

    <!-- フェーズ6: 凡例・disclaimer は折りたたみ可能なオーバーレイパネルにする(§11.1) -->
    <div class="map-info-panel" :class="{ 'map-info-panel--expanded': infoPanelExpanded }">
      <button
        type="button"
        class="map-info-panel__toggle"
        :aria-expanded="infoPanelExpanded"
        @click="infoPanelExpanded = !infoPanelExpanded"
      >
        <span class="map-info-panel__zoo-name">{{ zoo.name }}</span>
        <span v-if="!infoPanelExpanded && zoo.disclaimer" class="map-info-panel__summary">{{ zoo.disclaimer }}</span>
        <span class="map-info-panel__chevron" aria-hidden="true">{{ infoPanelExpanded ? '▾' : '▸' }}</span>
      </button>
      <div v-show="infoPanelExpanded" class="map-info-panel__body">
        <p v-if="zoo.disclaimer" class="map-disclaimer">
          <span aria-hidden="true">ⓘ</span> {{ zoo.disclaimer }}
        </p>
        <div class="map-legend">
          <span v-for="area in zoo.areas" :key="area.id" class="map-legend__item">
            <span class="map-legend__swatch" :style="{ background: area.color }"></span>
            {{ area.name }}
          </span>
        </div>
      </div>
    </div>
  </section>
  <section v-else class="empty-state">
    <p>指定された動物園が見つかりませんでした。</p>
    <router-link class="btn btn--primary" to="/">動物園一覧に戻る</router-link>
  </section>
</template>

<style scoped>
/* フェーズ6: マップ画面はビューポートほぼ全面に表示する(§11.1)。100dvh 未対応環境向けに 100vh をフォールバックとして先に指定する */
.map-screen {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #d9d9d9;
}

.zoo-leaflet-map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #d9d9d9;
}

.map-nav-overlay {
  position: absolute;
  top: calc(0.6rem + env(safe-area-inset-top, 0px));
  left: calc(0.6rem + env(safe-area-inset-left, 0px));
  /* Leaflet の corner コンテナ(.leaflet-top/.leaflet-bottom)は z-index:1000 のため、それより上にする */
  z-index: 1200;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.map-float-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 40px;
  box-sizing: border-box;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.map-float-btn:active {
  transform: scale(0.97);
}

.map-info-panel {
  position: absolute;
  left: calc(0.6rem + env(safe-area-inset-left, 0px));
  bottom: calc(0.6rem + env(safe-area-inset-bottom, 0px));
  /* Leaflet の corner コンテナ(.leaflet-top/.leaflet-bottom)は z-index:1000 のため、それより上にする */
  z-index: 1200;
  width: min(340px, calc(100vw - 1.2rem));
  max-height: calc(60vh - env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-md);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.map-info-panel__toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: none;
  background: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
  flex-shrink: 0;
}

.map-info-panel__zoo-name {
  flex-shrink: 0;
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--color-primary-dark);
}

.map-info-panel__summary {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.map-info-panel__chevron {
  flex-shrink: 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.map-info-panel__body {
  padding: 0 0.75rem 0.7rem;
  overflow-y: auto;
  border-top: 1px solid var(--color-border);
}

.map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.7rem;
  margin-top: 0.6rem;
  font-size: 0.74rem;
  color: var(--color-text-muted);
}

.map-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.map-legend__swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.map-disclaimer {
  margin: 0.6rem 0 0;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-md);
  background: #fff8e6;
  border: 1px solid #f0dfa8;
  color: #7a6415;
  font-size: 0.76rem;
  line-height: 1.5;
}
</style>

<!--
  Leaflet は divIcon / popup の中身を Vue の外側で直接 DOM に描画するため、
  scoped スタイルでは対象にできない。このブロックはグローバル(non-scoped)にする。
-->
<style>
.zoo-leaflet-map .leaflet-control-zoom {
  margin-top: 10px;
}

.map-reset-btn {
  width: auto;
  height: 30px;
  padding: 0 0.7rem;
  border: 2px solid rgba(0, 0, 0, 0.2);
  background: #fff;
  color: #333;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 6px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.4);
}

.map-reset-btn:hover {
  background: #f4f4f4;
}

.locate-control {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.locate-control__btn {
  width: 34px;
  height: 34px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(0, 0, 0, 0.2);
  background: #fff;
  border-radius: 4px;
  font-size: 17px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.4);
}

.locate-control__btn:hover:not(:disabled) {
  background: #f4f4f4;
}

.locate-control__btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.locate-control__btn--active {
  background: #e8f0fe;
  border-color: #1a73e8;
}

.locate-control__status {
  max-width: 168px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.55rem;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
  font-size: 0.68rem;
  line-height: 1.4;
  color: #444;
}

.locate-control__status-text {
  flex: 1;
}

.locate-control__stop {
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  color: #1a5fb4;
  font-weight: 700;
  font-size: 0.68rem;
  text-decoration: underline;
  cursor: pointer;
}

.area-label-icon,
.enclosure-label-icon {
  pointer-events: none;
  white-space: nowrap;
  text-align: center;
}

.area-label-icon span {
  font-size: 15px;
  font-weight: 700;
  color: #3a3a3a;
  text-shadow:
    0 0 3px #fff,
    0 0 3px #fff,
    0 0 5px #fff;
}

.area-label-icon--facility span {
  font-size: 13px;
  font-weight: 600;
  color: #6b6b6b;
}

.enclosure-label-icon span {
  font-size: 11px;
  font-weight: 700;
  color: #2b2b2b;
  text-shadow:
    0 0 2px #fff,
    0 0 2px #fff,
    0 0 3px #fff;
}

.animal-pin-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.animal-pin-icon__emoji {
  font-size: 26px;
  line-height: 1;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.45));
  cursor: pointer;
}

.animal-popup {
  min-width: 140px;
}

.animal-popup__name {
  font-weight: 700;
  font-size: 0.95rem;
  margin: 0 0 0.35rem;
}

.animal-popup__link {
  display: inline-block;
  font-size: 0.82rem;
  color: var(--color-primary-dark, #1b5e20);
  font-weight: 600;
  text-decoration: none;
}

.animal-popup__link:hover {
  text-decoration: underline;
}
</style>
