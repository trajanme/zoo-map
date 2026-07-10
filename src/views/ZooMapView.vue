<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getZoo } from '../data/zoos'

// ポップアップの想定サイズ(px)。マップ枠の実測サイズをもとに、
// はみ出さないようポップアップの表示位置を補正するために使う。
const POPUP_WIDTH = 200
const POPUP_HEIGHT = 100
const POPUP_MARGIN = 10

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
// アスペクト比 1000:700 を仮定したフォールバック値。実測後は ResizeObserver で更新する。
const wrapperSize = reactive({ width: 343, height: 240 })
let resizeObserver

watch(
  () => route.query.focus,
  (value) => {
    activeAnimalId.value = typeof value === 'string' ? value : null
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
function areaPointsAttr(area) {
  return area.points.map((p) => `${p.x},${p.y}`).join(' ')
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

onMounted(() => {
  if (activeAnimalId.value) {
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

  const rawLeftPx = (activeAnimal.value.position.x / 1000) * width
  const rawTopPx = (activeAnimal.value.position.y / 700) * height

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
    <p class="page-lead">エリアの色分けと動物のピンをタップして、行きたい場所を探そう。</p>

    <nav class="tabs">
      <router-link :to="`/zoos/${zoo.id}`" class="tabs__link--active">マップ</router-link>
      <router-link :to="`/zoos/${zoo.id}/animals`">動物一覧・検索</router-link>
    </nav>

    <div ref="mapWrapperRef" class="map-wrapper">
      <svg
        class="zoo-svg"
        viewBox="0 0 1000 700"
        role="img"
        :aria-label="`${zoo.name}の園内マップ`"
        @click="closePopup"
      >
        <rect x="0" y="0" width="1000" height="700" class="map-bg" />

        <g v-for="area in zoo.areas" :key="area.id">
          <polygon
            v-if="area.points"
            :points="areaPointsAttr(area)"
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
            @click.stop="selectAnimal(animal)"
          />
          <text
            :x="animal.position.x"
            :y="animal.position.y"
            text-anchor="middle"
            dominant-baseline="central"
            class="pin-emoji"
            @click.stop="selectAnimal(animal)"
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
