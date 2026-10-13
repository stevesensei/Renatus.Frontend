<script setup lang="ts">
import {ArrowRight, Brush, ShieldCheck, Users} from '@lucide/vue';
import {computed} from 'vue';
import {RouterLink} from 'vue-router';
import {state} from '../data/state';

const buttons = computed(() => state.site.buttons.filter((button) => button.label.trim() && button.url.trim()));
</script>
<template>
  <section class="home-hero" :style="{ backgroundImage: 'url(' + (state.site.heroImage || '/background.jpg') + ')' }">
    <div class="home-shade"></div>
    <div class="home-copy"><p class="eyebrow">HLJU MINECRAFT COMMUNITY</p>
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
        <RouterLink v-if="!buttons.length" to="/login" class="hero-link">来瞅一眼
          <ArrowRight :size="18"/>
        </RouterLink>
      </div>
    </div>
    <span class="hero-caption">POWERED BY RENATUS</span></section>
  <section class="home-features">
    <div>
      <ShieldCheck :size="24"/>
      <h2>啥玩意这是</h2>
      <p>你黑带 麦蒯伏特 服务器专用账号系统</p></div>
    <div>
      <Users :size="24"/>
      <h2>你是大手子吗</h2>
      <p>欢迎加入我们服务器，服主缺人帮他想弗雷尔卓德笑话</p></div>
    <div>
      <Brush :size="24"/>
      <h2>万物互联</h2>
      <p>现已加入Minecraft高校联盟，大概是1000w以内最客制化的账号系统</p></div>
  </section>
</template>
