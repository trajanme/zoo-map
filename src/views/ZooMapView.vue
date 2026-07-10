<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArea, getZoo } from '../data/zoos'

// ポップアップの想定サイズ(px)。マップ枠の実測サイズをもとに、
// はみ出さないようポップアップの表示位置を補正するために使う。
const POPUP_WIDTH = 200
const POPUP_HEIGHT = 100
const POPUP_MARGIN = 10

// パン・ズームの設定値
const VIEW_W = 1000
const VIEW_H = 700
const MIN_SCALE = 1
const MAX_SCALE = 8
const FOCUS_SCALE = 3
const DRAG_THRESHOLD = 8 // px (画面座標系)。これ未満の移動はタップ扱いにする
const WHEEL_ZOOM_FACTOR = 1.2
const BUTTON_ZOOM_FACTOR = 1.4

const props = defineProps({
  zooId: { type: String, required: true },
})

const route = useRoute()
const router = useRouter()

const zoo = computed(() => getZoo(props.zooId))

const activeAnimalId = ref(
  typeof route.query.focus === 'string' ? route.query.focus : null,
)

const mapWrapperRef = ref(null)
const svgRef = ref(null)
// アスペクト比 1000:700 を仮定したフォールバック値。実測後は ResizeObserver で更新する。
const wrapperSize = reactive({ width: 343, height: 240 })
let resizeObserver

// --- パン・ズーム状態 ---
const scale = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPointerActive = ref(false)

const viewW = computed(() => VIEW_W / scale.value)
const viewH = computed(() => VIEW_H / scale.value)
const viewBoxAttr = computed(() => `${panX.value} ${panY.value} ${viewW.value} ${viewH.value}`)

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function clampPan(x, y, w, h) {
  const maxX = Math.max(0, VIEW_W - w)
  const maxY = Math.max(0, VIEW_H - h)
  return { x: clamp(x, 0, maxX), y: clamp(y, 0, maxY) }
}

function panBy(dx, dy) {
  const next = clampPan(panX.value + dx, panY.value + dy, viewW.value, viewH.value)
  panX.value = next.x
  panY.value = next.y
}

/** 画面座標(clientX/Y)を中心に据えたままズームする */
function zoomAt(clientX, clientY, rect, targetScale) {
  const newScale = clamp(targetScale, MIN_SCALE, MAX_SCALE)
  if (newScale === scale.value) return
  const relX = (clientX - rect.left) / rect.width
  const relY = (clientY - rect.top) / rect.height
  const pointX = panX.value + relX * viewW.value
  const pointY = panY.value + relY * viewH.value
  const newW = VIEW_W / newScale
  const newH = VIEW_H / newScale
  const newX = pointX - relX * newW
  const newY = pointY - relY * newH
  const clamped = clampPan(newX, newY, newW, newH)
  scale.value = newScale
  panX.value = clamped.x
  panY.value = clamped.y
}

function zoomToAnimal(animalId, targetScale = FOCUS_SCALE) {
  const animal = zoo.value?.animals.find((a) => a.id === animalId)
  if (!animal) return
  const newScale = clamp(targetScale, MIN_SCALE, MAX_SCALE)
  const newW = VIEW_W / newScale
  const newH = VIEW_H / newScale
  const newX = animal.position.x - newW / 2
  const newY = animal.position.y - newH / 2
  const clamped = clampPan(newX, newY, newW, newH)
  scale.value = newScale
  panX.value = clamped.x
  panY.value = clamped.y
}

function resetView() {
  scale.value = 1
  panX.value = 0
  panY.value = 0
}

function zoomInButton() {
  const rect = svgRef.value?.getBoundingClientRect()
  if (!rect) return
  zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, rect, scale.value * BUTTON_ZOOM_FACTOR)
}

function zoomOutButton() {
  const rect = svgRef.value?.getBoundingClientRect()
  if (!rect) return
  zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, rect, scale.value / BUTTON_ZOOM_FACTOR)
}

function onWheel(e) {
  e.preventDefault()
  const rect = svgRef.value?.getBoundingClientRect()
  if (!rect) return
  const factor = e.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR
  zoomAt(e.clientX, e.clientY, rect, scale.value * factor)
}

// --- ポインター操作(ドラッグパン・ピンチズーム・タップ判別) ---
const pointers = new Map() // pointerId -> {x, y} (client座標)
let dragStartClient = null
let wasDragging = false
let gestureTargetAnimal = null
let pinchPrev = null // { dist, mid }

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/** capture フェーズで先に発火させ、子要素の pointerdown より前に状態をリセットする */
function onPointerDownCapture(e) {
  svgRef.value?.setPointerCapture(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  isPointerActive.value = true

  if (pointers.size === 1) {
    gestureTargetAnimal = null
    wasDragging = false
    dragStartClient = { x: e.clientX, y: e.clientY }
  } else if (pointers.size === 2) {
    const pts = [...pointers.values()]
    pinchPrev = { dist: distance(pts[0], pts[1]), mid: midpoint(pts[0], pts[1]) }
  }
}

/** ピンや獣舎区画をポインターダウンした時点で対象動物を記録する(bubble フェーズ) */
function markGestureTarget(animal) {
  gestureTargetAnimal = animal
}

function onPointerMove(e) {
  if (!pointers.has(e.pointerId)) return
  const prevPoint = pointers.get(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

  if (pointers.size >= 2) {
    e.preventDefault()
    const pts = [...pointers.values()].slice(0, 2)
    const dist = distance(pts[0], pts[1])
    const mid = midpoint(pts[0], pts[1])
    const rect = svgRef.value?.getBoundingClientRect()
    if (rect && pinchPrev) {
      if (pinchPrev.dist > 0) {
        const factor = dist / pinchPrev.dist
        zoomAt(pinchPrev.mid.x, pinchPrev.mid.y, rect, scale.value * factor)
      }
      const dMidX = mid.x - pinchPrev.mid.x
      const dMidY = mid.y - pinchPrev.mid.y
      panBy((-dMidX / rect.width) * viewW.value, (-dMidY / rect.height) * viewH.value)
    }
    pinchPrev = { dist, mid }
    wasDragging = true
    return
  }

  if (pointers.size === 1) {
    const cur = { x: e.clientX, y: e.clientY }
    if (dragStartClient && distance(dragStartClient, cur) > DRAG_THRESHOLD) {
      wasDragging = true
    }
    if (wasDragging) {
      e.preventDefault()
      const rect = svgRef.value?.getBoundingClientRect()
      if (rect) {
        const dx = cur.x - prevPoint.x
        const dy = cur.y - prevPoint.y
        panBy((-dx / rect.width) * viewW.value, (-dy / rect.height) * viewH.value)
      }
    }
  }
}

function onPointerUp(e) {
  if (!pointers.has(e.pointerId)) return
  pointers.delete(e.pointerId)
  if (pointers.size < 2) {
    pinchPrev = null
  }

  if (pointers.size === 0) {
    isPointerActive.value = false
    dragStartClient = null
    if (!wasDragging) {
      if (gestureTargetAnimal) {
        selectAnimal(gestureTargetAnimal)
      } else {
        closePopup()
      }
    }
    wasDragging = false
    gestureTargetAnimal = null
  }

  try {
    svgRef.value?.releasePointerCapture(e.pointerId)
  } catch {
    // 既に解放済みの場合は無視する
  }
}

watch(
  () => route.query.focus,
  (value) => {
    activeAnimalId.value = typeof value === 'string' ? value : null
  },
)

watch(activeAnimalId, (id) => {
  if (id) zoomToAnimal(id)
})

watch(
  () => props.zooId,
  () => {
    resetView()
  },
)

const activeAnimal = computed(() =>
  zoo.value?.animals.find((animal) => animal.id === activeAnimalId.value),
)

/**
 * エリアのラベル表示位置と文字寄せを求める。
 * 優先順: labelPos 指定 > ポリゴンの頂点座標平均 > 矩形の左上寄せ(従来どおり)
 */
function areaLabel(area) {
  if (area.labelPos) {
    return { x: area.labelPos.x, y: area.labelPos.y, anchor: 'middle' }
  }
  if (area.points && area.points.length) {
    const sum = area.points.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 },
    )
    return {
      x: sum.x / area.points.length,
      y: sum.y / area.points.length,
      anchor: 'middle',
    }
  }
  // 既存の矩形エリアは後方互換のため左上寄せの位置を維持する
  return { x: area.rect.x + 16, y: area.rect.y + 32, anchor: 'start' }
}

/** ポリゴン頂点配列を SVG の points 属性文字列に変換する */
function pointsAttr(points) {
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

const LABEL_LINE_HEIGHT = 28

/** ラベルの行分割。labelLines が無ければ name をそのまま1行として扱う */
function areaLabelLines(area) {
  return area.labelLines && area.labelLines.length ? area.labelLines : [area.name]
}

/** 複数行ラベルの各行に対する dy (前の行からの相対オフセット) */
function areaLabelLineDy(area, index) {
  if (index !== 0) return LABEL_LINE_HEIGHT
  const lineCount = areaLabelLines(area).length
  return -((lineCount - 1) * LABEL_LINE_HEIGHT) / 2
}

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

function enclosureFill(animal) {
  const area = getArea(zoo.value, animal.areaId)
  return darken(area?.color ?? '#cccccc')
}

/** 獣舎区画のラベル位置。rect は下端中央、points は重心を親エリア中心から外側へ少し押し出す */
function enclosureLabelPos(animal) {
  const enc = animal.enclosure
  if (!enc) return null
  if (enc.rect) {
    return { x: enc.rect.x + enc.rect.w / 2, y: enc.rect.y + enc.rect.h - 10 }
  }
  if (enc.points && enc.points.length) {
    const sum = enc.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
    const cx = sum.x / enc.points.length
    const cy = sum.y / enc.points.length
    const area = getArea(zoo.value, animal.areaId)
    const areaCenter = area?.labelPos
    if (areaCenter) {
      const dx = cx - areaCenter.x
      const dy = cy - areaCenter.y
      const dist = Math.hypot(dx, dy) || 1
      const push = 50
      return { x: cx + (dx / dist) * push, y: cy + (dy / dist) * push }
    }
    return { x: cx, y: cy }
  }
  return null
}

onMounted(() => {
  if (activeAnimalId.value) {
    zoomToAnimal(activeAnimalId.value)
    nextTick(() => {
      mapWrapperRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  if (mapWrapperRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      wrapperSize.width = entry.contentRect.width
      wrapperSize.height = entry.contentRect.height
    })
    resizeObserver.observe(mapWrapperRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

function selectAnimal(animal) {
  if (activeAnimalId.value === animal.id) {
    closePopup()
    return
  }
  router.replace({ query: { ...route.query, focus: animal.id } })
}

function closePopup() {
  if (!route.query.focus) return
  const rest = { ...route.query }
  delete rest.focus
  router.replace({ query: rest })
}

const popupStyle = computed(() => {
  if (!activeAnimal.value) return {}
  const width = wrapperSize.width || 343
  const height = wrapperSize.height || 240

  // 現在の viewBox(パン・ズーム後)を基準に、ピン位置をラッパー内の px 座標へ変換する
  const relX = (activeAnimal.value.position.x - panX.value) / viewW.value
  const relY = (activeAnimal.value.position.y - panY.value) / viewH.value
  const rawLeftPx = relX * width
  const rawTopPx = relY * height

  const halfPopupWidth = POPUP_WIDTH / 2
  const clampedLeftPx = Math.min(
    width - halfPopupWidth - POPUP_MARGIN,
    Math.max(halfPopupWidth + POPUP_MARGIN, rawLeftPx),
  )
  const placeBelow = rawTopPx < POPUP_HEIGHT + POPUP_MARGIN * 2

  return {
    left: `${clampedLeftPx}px`,
    top: `${rawTopPx}px`,
    transform: placeBelow
      ? `translate(-50%, ${POPUP_MARGIN}px)`
      : `translate(-50%, calc(-100% - ${POPUP_MARGIN}px))`,
  }
})
</script>

<template>
  <section v-if="zoo">
    <p class="breadcrumb">
      <router-link to="/">動物園一覧</router-link>
      <span>›</span>
      <span>{{ zoo.name }}</span>
    </p>
    <h1 class="page-title">{{ zoo.name }} 園内マップ</h1>
    <p class="page-lead">
      エリアの色分けと動物のピンをタップして、行きたい場所を探そう。ドラッグで移動、ホイールやピンチ、＋/−ボタンで拡大縮小できます。
    </p>

    <nav class="tabs">
      <router-link :to="`/zoos/${zoo.id}`" class="tabs__link--active">マップ</router-link>
      <router-link :to="`/zoos/${zoo.id}/animals`">動物一覧・検索</router-link>
    </nav>

    <div ref="mapWrapperRef" class="map-wrapper">
      <svg
        ref="svgRef"
        class="zoo-svg"
        :class="{ 'zoo-svg--active': isPointerActive }"
        :viewBox="viewBoxAttr"
        role="img"
        :aria-label="`${zoo.name}の園内マップ`"
        @pointerdown.capture="onPointerDownCapture"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @wheel="onWheel"
      >
        <rect x="0" y="0" width="1000" height="700" class="map-bg" />

        <g v-for="area in zoo.areas" :key="area.id">
          <polygon
            v-if="area.points"
            :points="pointsAttr(area.points)"
            :fill="area.color"
            class="area-shape"
            :class="{ 'area-shape--facility': area.facility }"
          />
          <rect
            v-else
            :x="area.rect.x"
            :y="area.rect.y"
            :width="area.rect.w"
            :height="area.rect.h"
            :fill="area.color"
            class="area-shape"
            :class="{ 'area-shape--facility': area.facility }"
            rx="14"
          />
          <text
            :x="areaLabel(area).x"
            :y="areaLabel(area).y"
            :text-anchor="areaLabel(area).anchor"
            class="area-label"
            :class="{ 'area-label--facility': area.facility }"
          ><tspan
            v-for="(line, i) in areaLabelLines(area)"
            :key="i"
            :x="areaLabel(area).x"
            :dy="areaLabelLineDy(area, i)"
          >{{ line }}</tspan></text>
        </g>

        <g v-for="animal in zoo.animals" :key="animal.id">
          <!-- 動物ごとの獣舎・展示場区画(エリア色より一段濃い塗り+縁取り) -->
          <g v-if="animal.enclosure" @pointerdown="markGestureTarget(animal)">
            <polygon
              v-if="animal.enclosure.points"
              :points="pointsAttr(animal.enclosure.points)"
              :fill="enclosureFill(animal)"
              class="enclosure-shape"
            />
            <rect
              v-else-if="animal.enclosure.rect"
              :x="animal.enclosure.rect.x"
              :y="animal.enclosure.rect.y"
              :width="animal.enclosure.rect.w"
              :height="animal.enclosure.rect.h"
              :fill="enclosureFill(animal)"
              class="enclosure-shape"
              rx="8"
            />
            <text
              v-if="enclosureLabelPos(animal)"
              :x="enclosureLabelPos(animal).x"
              :y="enclosureLabelPos(animal).y"
              text-anchor="middle"
              class="enclosure-label"
            >{{ animal.name }}</text>
          </g>

          <circle
            v-if="activeAnimalId === animal.id"
            :cx="animal.position.x"
            :cy="animal.position.y"
            r="34"
            class="pin-focus-ring"
          />
          <circle
            :cx="animal.position.x"
            :cy="animal.position.y"
            r="26"
            class="pin-hit"
            @pointerdown="markGestureTarget(animal)"
          />
          <text
            :x="animal.position.x"
            :y="animal.position.y"
            text-anchor="middle"
            dominant-baseline="central"
            class="pin-emoji"
            @pointerdown="markGestureTarget(animal)"
          >{{ animal.emoji }}</text>
        </g>
      </svg>

      <div v-if="activeAnimal" class="map-popup" :style="popupStyle">
        <button type="button" class="map-popup__close" aria-label="閉じる" @click="closePopup">×</button>
        <p class="map-popup__name">
          <span aria-hidden="true">{{ activeAnimal.emoji }}</span> {{ activeAnimal.name }}
        </p>
        <router-link
          :to="`/zoos/${zoo.id}/animals/${activeAnimal.id}`"
          class="map-popup__link"
        >
          詳細を見る →
        </router-link>
      </div>

      <div class="map-controls" role="group" aria-label="マップの拡大縮小">
        <button type="button" class="map-controls__btn" aria-label="拡大" @click="zoomInButton">＋</button>
        <button type="button" class="map-controls__btn" aria-label="縮小" @click="zoomOutButton">−</button>
        <button type="button" class="map-controls__btn map-controls__btn--reset" aria-label="表示をリセット" @click="resetView">
          リセット
        </button>
      </div>
    </div>

    <div class="map-legend">
      <span v-for="area in zoo.areas" :key="area.id" class="map-legend__item">
        <span class="map-legend__swatch" :style="{ background: area.color }"></span>
        {{ area.name }}
      </span>
    </div>

    <p v-if="zoo.disclaimer" class="map-disclaimer">
      <span aria-hidden="true">ⓘ</span> {{ zoo.disclaimer }}
    </p>
  </section>
  <section v-else class="empty-state">
    <p>指定された動物園が見つかりませんでした。</p>
    <router-link class="btn btn--primary" to="/">動物園一覧に戻る</router-link>
  </section>
</template>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  background: #fff;
}

.zoo-svg {
  display: block;
  width: 100%;
  aspect-ratio: 1000 / 700;
  background: #eef3ea;
  touch-action: none;
  cursor: grab;
  user-select: none;
}

.zoo-svg--active {
  cursor: grabbing;
}

.map-bg {
  fill: #eef3ea;
}

.area-shape {
  stroke: rgba(0, 0, 0, 0.08);
  stroke-width: 2;
}

.area-shape--facility {
  stroke: rgba(0, 0, 0, 0.18);
  stroke-dasharray: 6 5;
}

.area-label {
  font-size: 26px;
  font-weight: 700;
  fill: #3a3a3a;
  paint-order: stroke;
  stroke: #ffffff;
  stroke-width: 5px;
  stroke-linejoin: round;
}

.area-label--facility {
  font-size: 22px;
  font-weight: 600;
  fill: #6b6b6b;
}

.enclosure-shape {
  stroke: rgba(0, 0, 0, 0.32);
  stroke-width: 1.5;
  cursor: pointer;
}

.enclosure-label {
  font-size: 13px;
  font-weight: 700;
  fill: #2b2b2b;
  paint-order: stroke;
  stroke: #ffffff;
  stroke-width: 3px;
  stroke-linejoin: round;
  pointer-events: none;
}

.pin-hit {
  fill: rgba(255, 255, 255, 0.001);
  cursor: pointer;
}

.pin-emoji {
  font-size: 42px;
  cursor: pointer;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.35));
}

.pin-focus-ring {
  fill: rgba(255, 138, 101, 0.25);
  stroke: var(--color-accent);
  stroke-width: 4;
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.6;
  }
}

.map-popup {
  position: absolute;
  min-width: 160px;
  max-width: calc(100% - 24px);
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--color-border);
  z-index: 10;
}

.map-popup__close {
  position: absolute;
  top: 2px;
  right: 6px;
  border: none;
  background: none;
  font-size: 1rem;
  line-height: 1;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
}

.map-popup__name {
  font-weight: 700;
  font-size: 0.95rem;
  padding-right: 1rem;
  margin-bottom: 0.3rem;
}

.map-popup__link {
  display: inline-block;
  font-size: 0.82rem;
  color: var(--color-primary-dark);
  font-weight: 600;
  text-decoration: none;
}

.map-popup__link:hover {
  text-decoration: underline;
}

.map-controls {
  position: absolute;
  right: 10px;
  top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 5;
}

.map-controls__btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.95);
  color: var(--color-text);
  font-size: 1.15rem;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
}

.map-controls__btn:active {
  background: var(--color-bg);
}

.map-controls__btn--reset {
  width: auto;
  height: 32px;
  border-radius: 16px;
  padding: 0 0.7rem;
  font-size: 0.7rem;
}

.map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  justify-content: center;
  margin-top: 1rem;
  font-size: 0.8rem;
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
  max-width: 720px;
  margin: 1rem auto 0;
  padding: 0.65rem 0.9rem;
  border-radius: var(--radius-md);
  background: #fff8e6;
  border: 1px solid #f0dfa8;
  color: #7a6415;
  font-size: 0.78rem;
  line-height: 1.5;
}
</style>
