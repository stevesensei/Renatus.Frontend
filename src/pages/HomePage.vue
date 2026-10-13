<script setup lang="ts">
import { ArrowRight, Brush, ShieldCheck, Users } from '@lucide/vue';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { state } from '../data/state';
const buttons = computed(() => state.site.buttons.filter((button) => button.label.trim() && button.url.trim()));
</script>
<template>
  <section class="home-hero" :style="{ backgroundImage: 'url(' + (state.site.heroImage || '/background.jpg') + ')' }"><div class="home-shade"></div><div class="home-copy"><p class="eyebrow">MINECRAFT COMMUNITY</p><h1>{{ state.site.title }}</h1><p>{{ state.site.description }}</p><div class="hero-actions"><template v-for="button in buttons" :key="button.label"><RouterLink v-if="button.url.startsWith('/')" :to="button.url" :class="['hero-link', { outline: button.style !== 'filled' }]">{{ button.label }}<ArrowRight :size="18" /></RouterLink><a v-else :href="button.url" :target="button.target" rel="noopener noreferrer" class="hero-link">{{ button.label }}<ArrowRight :size="18" /></a></template><RouterLink v-if="!buttons.length" to="/login" class="hero-link">开始旅程<ArrowRight :size="18" /></RouterLink></div></div><span class="hero-caption">A NEW BEGINNING · RENATUS</span></section>
  <section class="home-features"><div><ShieldCheck :size="24" /><h2>一个账户</h2><p>连接你的 Minecraft 社区。</p></div><div><Users :size="24" /><h2>你的角色</h2><p>管理身份，开启新的冒险。</p></div><div><Brush :size="24" /><h2>自由装扮</h2><p>发现皮肤，分享你的创作。</p></div></section>
</template>
