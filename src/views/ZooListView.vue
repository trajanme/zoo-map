<script setup>
import { zoos } from '../data/zoos'
</script>

<template>
  <section>
    <h1 class="page-title">動物園を選ぶ</h1>
    <p class="page-lead">気になる動物園をタップすると、園内マップと動物図鑑が見られます。</p>

    <ul class="zoo-list">
      <li v-for="zoo in zoos" :key="zoo.id" class="zoo-card card">
        <router-link :to="`/zoos/${zoo.id}`" class="zoo-card__link">
          <div class="zoo-card__emoji" aria-hidden="true">
            {{ zoo.animals[0]?.emoji ?? '🏞️' }}
          </div>
          <div class="zoo-card__body">
            <h2 class="zoo-card__name">
              {{ zoo.name }}
              <span class="tag tag--real">実在の動物園(非公式マップ)</span>
            </h2>
            <p class="zoo-card__desc">{{ zoo.description }}</p>
            <div class="zoo-card__meta">
              <span class="tag">エリア {{ zoo.areas.length }}</span>
              <span class="tag">動物 {{ zoo.animals.length }}種</span>
            </div>
          </div>
          <span class="zoo-card__arrow" aria-hidden="true">›</span>
        </router-link>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.zoo-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .zoo-list {
    grid-template-columns: 1fr 1fr;
  }
}

.zoo-card {
  overflow: hidden;
}

.zoo-card__link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  text-decoration: none;
  color: inherit;
}

.zoo-card__emoji {
  flex: none;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.zoo-card__body {
  flex: 1;
  min-width: 0;
}

.zoo-card__name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
}

.tag--real {
  background: #fde7c7;
  color: #8a5a00;
  font-weight: 700;
}

.zoo-card__desc {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.zoo-card__meta {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.zoo-card__arrow {
  flex: none;
  font-size: 1.75rem;
  color: var(--color-primary);
}
</style>
