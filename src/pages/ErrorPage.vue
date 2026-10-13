<script setup lang="ts">
import {ArrowLeft, TriangleAlert} from '@lucide/vue';
import {RouterLink, useRoute} from 'vue-router';

const route = useRoute();
</script>
<template>
  <section class="error-page"><span class="error-icon"><TriangleAlert :size="46"/></span>
    <p class="eyebrow">{{route.path === '/Error' ? 'SOMETHING WENT WRONG' : '404 / PAGE NOT FOUND'}}</p>
    <h1>{{route.path === '/Error' ? '前面的道路以后再来探索吧' : '前面的道路以后大抵也探索不了了'}}</h1>
    <p class="muted">{{
        route.path === '/Error' ? '页面暂时无法加载，你可以返回索引继续浏览。' : '你访问的页面不存在，请从首页重新选择。'
      }}</p>
    <RouterLink to="/" class="button-link">
      <ArrowLeft :size="18"/>
      返回首页
    </RouterLink>
  </section>
</template>
