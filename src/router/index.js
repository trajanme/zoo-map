import { createRouter, createWebHashHistory } from 'vue-router'

const ZooListView = () => import('../views/ZooListView.vue')
const ZooMapView = () => import('../views/ZooMapView.vue')
const AnimalListView = () => import('../views/AnimalListView.vue')
const AnimalDetailView = () => import('../views/AnimalDetailView.vue')

const routes = [
  {
    path: '/',
    name: 'zoo-list',
    component: ZooListView,
  },
  {
    path: '/zoos/:zooId',
    name: 'zoo-map',
    component: ZooMapView,
    props: true,
  },
  {
    path: '/zoos/:zooId/animals',
    name: 'animal-list',
    component: AnimalListView,
    props: true,
  },
  {
    path: '/zoos/:zooId/animals/:animalId',
    name: 'animal-detail',
    component: AnimalDetailView,
    props: true,
  },
  {
    // 不明なパスはトップへ戻す
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
