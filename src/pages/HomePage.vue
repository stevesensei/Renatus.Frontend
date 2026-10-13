<script setup lang="ts">
import { t } from '../i18n';
import {ArrowRight, Brush, ShieldCheck, Users} from '@lucide/vue';
import {computed} from 'vue';
import {RouterLink} from 'vue-router';
import {state} from '../data/state';

const buttons = computed(() => state.site.buttons.filter((button) => button.label.trim() && button.url.trim()));
</script>
<template>
  <section class="home-hero" :style="{ backgroundImage: 'url(' + (state.site.heroImage || '/background.jpg') + ')' }">
    <div class="home-shade"></div>
    <div class="home-copy"><p class="eyebrow">{{ t('home.community') }}</p>
      <h1>{{state.site.title}}</h1>
      <p>{{state.site.description}}</p>
      <div class="hero-actions">
        <template v-for="button in buttons" :key="button.label">
          <RouterLink v-if="button.url.startsWith('/')" :to="button.url"
                      :class="['hero-link', { outline: button.style !== 'filled' }]">{{button.label}}
            <ArrowRight :size="18"/>
          </RouterLink>
          <a v-else :href="button.url" :target="button.target" rel="noopener noreferrer"
             class="hero-link">{{button.label}}
            <ArrowRight :size="18"/>
          </a></template>
        <RouterLink v-if="!buttons.length" to="/login" class="hero-link">{{ t('home.getStarted') }}<ArrowRight :size="18"/>
        </RouterLink>
      </div>
    </div>
    <span class="hero-caption">{{ t('home.poweredBy') }}</span></section>
  <section class="home-features">
    <div>
      <ShieldCheck :size="24"/>
      <h2>{{ t('home.accountTitle') }}</h2>
      <p>{{ t('home.accountDescription') }}</p></div>
    <div>
      <Users :size="24"/>
      <h2>{{ t('home.joinTitle') }}</h2>
      <p>{{ t('home.joinDescription') }}</p></div>
    <div>
      <Brush :size="24"/>
      <h2>{{ t('home.networkTitle') }}</h2>
      <p>{{ t('home.networkDescription') }}</p></div>
  </section>
</template>
