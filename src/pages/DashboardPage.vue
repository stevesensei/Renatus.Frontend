<script setup lang="ts">
import {ArrowRight, Brush, Globe, LockKeyhole, Users} from '@lucide/vue';
import {computed, onMounted} from 'vue';
import {RouterLink} from 'vue-router';
import MarkdownContent from '../components/MarkdownContent.vue';
import MetricCard from '../components/MetricCard.vue';
import PageHeading from '../components/PageHeading.vue';
import {state} from '../data/state';
import {loadUserResources} from '../api/resources';
import {useOperation} from '../composables/operation';

const operation = useOperation();
const owned = computed(() => state.textures.filter((texture) => texture.owned));
onMounted(() => operation.run(loadUserResources));

</script>
<template>
  <PageHeading eyebrow="仪表盘" :title="'来啦老弟，' + state.account.nickname" description="查看你的材质与角色">
    <RouterLink to="/players" class="button-link secondary">
      <Users :size="18"/>
      我的角色
    </RouterLink>
  </PageHeading>
  <div class="metrics-grid">
    <MetricCard label="我的材质" :value="owned.length" :icon="Brush" detail="你的全部皮肤与披风"/>
    <MetricCard label="公开材质" :value="owned.filter(t => t.isPublic).length" :icon="Globe" detail="其他人也可以使用"/>
    <MetricCard label="私人材质" :value="owned.filter(t => !t.isPublic).length" :icon="LockKeyhole"
                detail="只有你自己可用"/>
  </div>
  <div class="dashboard-grid">
    <section class="panel announcement-panel">
      <p class="eyebrow">社区公告</p>
      <h2>{{state.announcements.site.title}}</h2>
      <MarkdownContent :content="state.announcements.site.body"/>
      <img v-if="state.announcements.site.image" class="announcement-image" :src="state.announcements.site.image"
           alt="站点公告"/>
    </section>
    <section class="panel"><p class="eyebrow">接下来</p>
      <h2>我觉得你可以做</h2>
      <div class="quick-links">
        <RouterLink to="/textures"><span><strong>瞅一眼材质库</strong><small>找到新的皮肤与披风</small></span>
          <ArrowRight :size="20"/>
        </RouterLink>
        <RouterLink to="/textures/upload"><span><strong>分享你的大作（大嘘）</strong><small>上传并预览材质</small></span>
          <ArrowRight :size="20"/>
        </RouterLink>
        <RouterLink to="/account"><span><strong>完善个人资料</strong><small>我超，盒不动</small></span>
          <ArrowRight :size="20"/>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
