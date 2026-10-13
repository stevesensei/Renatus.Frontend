<script setup lang="ts">
import { t } from '../i18n';
import {ArrowLeft, TriangleAlert} from '@lucide/vue';
import {RouterLink, useRoute} from 'vue-router';

const route = useRoute();
</script>
<template>
  <section class="error-page"><span class="error-icon"><TriangleAlert :size="46"/></span>
    <p class="eyebrow">{{route.path === '/Error' ? 'SOMETHING WENT WRONG' : '404 / PAGE NOT FOUND'}}</p>
    <h1>{{ route.path === '/Error' ? t('error.loadTitle') : t('error.notFoundTitle') }}</h1>
    <p class="muted">{{ route.path === '/Error' ? t('error.loadDescription') : t('error.notFoundDescription') }}</p>
    <RouterLink to="/" class="button-link">
      <ArrowLeft :size="18"/>{{ t('nav.backToHome') }}</RouterLink>
  </section>
</template>
