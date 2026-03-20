<script setup lang="ts">
import HomeHero from './HomeHero.vue'
import HomeDemo from './HomeDemo.vue'
import HomeFeatures from './HomeFeatures.vue'
import HomeFrameworks from './HomeFrameworks.vue'
</script>

<template>
  <div class="home-layout">
    <HomeHero />
    <HomeDemo />
    <HomeFeatures />
    <HomeFrameworks />
  </div>
</template>

<style scoped>
.home-layout {
  max-width: 100%;
  overflow-x: hidden;
}
</style>
