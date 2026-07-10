<script setup>
import { computed, ref } from 'vue'
import { getArea, getZoo } from '../data/zoos'

const props = defineProps({
  zooId: { type: String, required: true },
})

const zoo = computed(() => getZoo(props.zooId))

const searchText = ref('')
const selectedAreaId = ref('')

function toHiragana(str) {
  return str.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  )
}

const filteredAnimals = computed(() => {
  if (!zoo.value) return []
  const query = toHiragana(searchText.value.trim())
  return zoo.value.animals.filter((animal) => {
    const matchesArea = !selectedAreaId.value || animal.areaId === selectedAreaId.value
    if (!matchesArea) return false
    if (!query) return true
    const nameKana = toHiragana(animal.name)
    return nameKana.includes(query) || animal.kana.includes(query)
  })
})

function areaName(areaId) {
  return getArea(zoo.value, areaId)?.name ?? ''
}
</script>

<template>
  <section v-if="zoo">
    <p class="breadcrumb">
      <router-link to="/">動物園一覧</router-link>
      <span>›</span>
      <router-link :to="`/zoos/${zoo.id}`">{{ zoo.name }}</router-link>
      <span>›</span>
      <span>動物一覧</span>
    </p>
    <h1 class="page-title">{{ zoo.name }} の動物たち</h1>
    <p class="page-lead">名前で検索したり、エリアで絞り込んだりできます。</p>

    <nav class="tabs">
      <router-link :to="`/zoos/${zoo.id}`">マップ</router-link>
      <router-link :to="`/zoos/${zoo.id}/animals`" class="tabs__link--active">動物一覧・検索</router-link>
    </nav>

    <div class="filters">
      <label class="filters__search">
        <span class="filters__label">名前で検索</span>
        <input
          v-model="searchText"
          type="search"
          placeholder="例: きりん / キリン"
          class="filters__input"
        />
      </label>
      <label class="filters__area">
        <span class="filters__label">エリアで絞り込み</span>
        <select v-model="selectedAreaId" class="filters__select">
          <option value="">すべてのエリア</option>
          <option v-for="area in zoo.areas" :key="area.id" :value="area.id">
            {{ area.name }}
          </option>
        </select>
      </label>
    </div>

    <p class="result-count">{{ filteredAnimals.length }}種の動物が見つかりました</p>

    <ul v-if="filteredAnimals.length" class="animal-list">
      <li v-for="animal in filteredAnimals" :key="animal.id" class="animal-card card">
        <router-link
          :to="`/zoos/${zoo.id}/animals/${animal.id}`"
          class="animal-card__link"
        >
          <div class="animal-card__emoji" aria-hidden="true">{{ animal.emoji }}</div>
          <div class="animal-card__body">
            <h2 class="animal-card__name">{{ animal.name }}</h2>
            <p class="animal-card__kana">{{ animal.kana }}</p>
            <div class="animal-card__meta">
              <span class="tag">{{ animal.species }}</span>
              <span class="tag tag--area">{{ areaName(animal.areaId) }}</span>
            </div>
          </div>
        </router-link>
      </li>
    </ul>
    <div v-else class="empty-state">
      <p>条件に一致する動物が見つかりませんでした。</p>
    </div>
  </section>
  <section v-else class="empty-state">
    <p>指定された動物園が見つかりませんでした。</p>
    <router-link class="btn btn--primary" to="/">動物園一覧に戻る</router-link>
  </section>
</template>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

@media (min-width: 560px) {
  .filters {
    grid-template-columns: 1.4fr 1fr;
  }
}

.filters__label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
}

.filters__input,
.filters__select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: #fff;
  font-size: 0.95rem;
}

.filters__input:focus,
.filters__select:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.result-count {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
}

.animal-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem;
}

@media (min-width: 560px) {
  .animal-list {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 900px) {
  .animal-list {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.animal-card__link {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem;
  text-decoration: none;
  color: inherit;
}

.animal-card__emoji {
  flex: none;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.65rem;
}

.animal-card__body {
  min-width: 0;
}

.animal-card__name {
  font-size: 1rem;
  font-weight: 700;
}

.animal-card__kana {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 0.4rem;
}

.animal-card__meta {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.tag--area {
  background: #fdeee3;
  color: #b4522a;
}
</style>
