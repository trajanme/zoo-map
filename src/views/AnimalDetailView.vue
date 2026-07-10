<script setup>
import { computed } from 'vue'
import { getAnimal, getArea, getZoo } from '../data/zoos'

const props = defineProps({
  zooId: { type: String, required: true },
  animalId: { type: String, required: true },
})

const zoo = computed(() => getZoo(props.zooId))
const animal = computed(() => getAnimal(props.zooId, props.animalId))
const area = computed(() => (zoo.value && animal.value ? getArea(zoo.value, animal.value.areaId) : undefined))
</script>

<template>
  <section v-if="zoo && animal">
    <p class="breadcrumb">
      <router-link to="/">動物園一覧</router-link>
      <span>›</span>
      <router-link :to="`/zoos/${zoo.id}`">{{ zoo.name }}</router-link>
      <span>›</span>
      <router-link :to="`/zoos/${zoo.id}/animals`">動物一覧</router-link>
      <span>›</span>
      <span>{{ animal.name }}</span>
    </p>

    <article class="detail-card card">
      <div class="detail-card__hero">{{ animal.emoji }}</div>
      <h1 class="detail-card__name">{{ animal.name }}</h1>
      <p class="detail-card__kana">{{ animal.kana }}</p>

      <div class="detail-card__meta">
        <span class="tag">{{ animal.species }}</span>
        <span class="tag tag--area" v-if="area">{{ area.name }}</span>
      </div>

      <p class="detail-card__desc">{{ animal.description }}</p>

      <div class="detail-card__actions">
        <router-link
          :to="{ path: `/zoos/${zoo.id}`, query: { focus: animal.id } }"
          class="btn btn--primary btn--block"
        >
          📍 マップで場所を見る
        </router-link>
        <router-link :to="`/zoos/${zoo.id}/animals`" class="btn btn--ghost btn--block">
          動物一覧に戻る
        </router-link>
      </div>
    </article>
  </section>
  <section v-else class="empty-state">
    <p>指定された動物が見つかりませんでした。</p>
    <router-link class="btn btn--primary" to="/">動物園一覧に戻る</router-link>
  </section>
</template>

<style scoped>
.detail-card {
  max-width: 480px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 1.75rem;
  text-align: center;
}

.detail-card__hero {
  font-size: 4rem;
  line-height: 1;
  margin-bottom: 0.75rem;
}

.detail-card__name {
  font-size: 1.4rem;
  font-weight: 700;
}

.detail-card__kana {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
}

.detail-card__meta {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.detail-card__desc {
  text-align: left;
  font-size: 0.92rem;
  color: var(--color-text);
  margin-bottom: 1.5rem;
}

.detail-card__actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
</style>
