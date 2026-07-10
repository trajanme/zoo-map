<script setup>
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <router-link to="/" class="app-header__brand">
        <span class="app-header__logo" aria-hidden="true">🦁</span>
        <span class="app-header__title">zoo-map</span>
      </router-link>
      <p class="app-header__tagline">動物園の園内マップ &amp; 動物図鑑</p>
    </header>
    <main class="app-main">
      <router-view />
    </main>
    <footer class="app-footer">
      <p>zoo-map &mdash; 架空の動物園を紹介するサンプルアプリです</p>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.app-header__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.25rem;
}

.app-header__logo {
  font-size: 1.5rem;
  line-height: 1;
}

.app-header__tagline {
  margin: 0.15rem 0 0 2rem;
  font-size: 0.75rem;
  opacity: 0.9;
}

.app-main {
  flex: 1;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 1rem 1rem 2.5rem;
  box-sizing: border-box;
}

.app-footer {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  padding: 1rem;
}
</style>
