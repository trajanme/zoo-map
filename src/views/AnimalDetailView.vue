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

const speciesInfoRows = computed(() => {
  const info = animal.value?.speciesInfo
  if (!info) return []
  return [
    ['学名', info.scientificName],
    ['英名', info.englishName],
    ['分布', info.distribution],
    ['生息環境', info.habitat],
    ['食性', info.diet],
    ['寿命(目安)', info.lifespan],
  ].filter(([, value]) => Boolean(value))
})

/** birthDate ('YYYY-MM-DD' または 'YYYY') から表示時点の年齢を計算する */
function calcAge(birthDate) {
  if (!birthDate) return null
  if (/^\d{4}$/.test(birthDate)) {
    const year = Number(birthDate)
    const age = new Date().getFullYear() - year
    return `約${age}歳`
  }
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1
  }
  return `${age}歳`
}

/** birthDate を「YYYY年M月D日」または「YYYY年生まれ」の表示用文字列にする */
function formatBirthDate(birthDate) {
  if (!birthDate) return ''
  if (/^\d{4}$/.test(birthDate)) return `${birthDate}年生まれ`
  const [y, m, d] = birthDate.split('-')
  if (!y || !m || !d) return birthDate
  return `${y}年${Number(m)}月${Number(d)}日`
}

function individualMetaRows(individual) {
  const age = calcAge(individual.birthDate)
  return [
    ['性別', individual.sex],
    ['年齢', age],
    ['生年月日', individual.birthDate ? formatBirthDate(individual.birthDate) : null],
    ['生まれた場所', individual.birthplace],
    ['父', individual.father],
    ['母', individual.mother],
    ['来園', individual.arrivedAt],
  ].filter(([, value]) => Boolean(value))
}
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

      <section v-if="speciesInfoRows.length" class="detail-section">
        <h2 class="detail-section__title">種の情報</h2>
        <table class="species-table">
          <tbody>
            <tr v-for="[label, value] in speciesInfoRows" :key="label">
              <th>{{ label }}</th>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="animal.individuals && animal.individuals.length" class="detail-section">
        <h2 class="detail-section__title">この園にいる個体</h2>
        <div class="individual-list">
          <article v-for="individual in animal.individuals" :key="individual.name" class="individual-card">
            <h3 class="individual-card__name">
              {{ individual.name }}
              <span v-if="individual.kana" class="individual-card__kana">({{ individual.kana }})</span>
            </h3>
            <dl class="individual-card__meta">
              <template v-for="[label, value] in individualMetaRows(individual)" :key="label">
                <dt>{{ label }}</dt>
                <dd>{{ value }}</dd>
              </template>
            </dl>
            <p v-if="individual.note" class="individual-card__note">{{ individual.note }}</p>
          </article>
        </div>
      </section>

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

.detail-section {
  text-align: left;
  margin-bottom: 1.5rem;
}

.detail-section__title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.6rem;
  padding-bottom: 0.3rem;
  border-bottom: 2px solid var(--color-border);
}

.species-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.species-table th,
.species-table td {
  text-align: left;
  padding: 0.45rem 0.5rem;
  border-bottom: 1px solid var(--color-border);
  vertical-align: top;
}

.species-table th {
  width: 6.5rem;
  color: var(--color-text-muted);
  font-weight: 600;
  white-space: nowrap;
}

.individual-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 560px) {
  .individual-list {
    grid-template-columns: 1fr 1fr;
  }
}

.individual-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 0.9rem;
}

.individual-card__name {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
}

.individual-card__kana {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--color-text-muted);
}

.individual-card__meta {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.15rem 0.6rem;
  margin: 0 0 0.4rem;
  font-size: 0.82rem;
}

.individual-card__meta dt {
  color: var(--color-text-muted);
}

.individual-card__meta dd {
  margin: 0;
}

.individual-card__note {
  font-size: 0.8rem;
  color: var(--color-text);
  line-height: 1.5;
  margin: 0;
}
</style>
