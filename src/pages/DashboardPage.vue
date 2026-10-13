<script setup lang="ts">
import { t } from '../i18n';
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
  <PageHeading :eyebrow="t('dashboard.eyebrow')" :title="t('dashboard.welcomePrefix') + state.account.nickname" :description="t('dashboard.description')">
    <RouterLink to="/players" class="button-link secondary">
      <Users :size="18"/>{{ t('nav.myPlayers') }}</RouterLink>
  </PageHeading>
  <div class="metrics-grid">
    <MetricCard :label="t('dashboard.myTextures')" :value="owned.length" :icon="Brush" :detail="t('dashboard.allTexturesDescription')"/>
    <MetricCard :label="t('textures.publicCollection')" :value="owned.filter(t => t.isPublic).length" :icon="Globe" :detail="t('dashboard.publicTexturesDescription')"/>
    <MetricCard :label="t('dashboard.privateTextures')" :value="owned.filter(t => !t.isPublic).length" :icon="LockKeyhole"
                :detail="t('dashboard.privateTexturesDescription')"/>
  </div>
  <div class="dashboard-grid">
    <section class="panel announcement-panel">
      <p class="eyebrow">{{ t('dashboard.communityAnnouncement') }}</p>
      <h2>{{state.announcements.site.title}}</h2>
      <MarkdownContent :content="state.announcements.site.body"/>
      <img v-if="state.announcements.site.image" class="announcement-image" :src="state.announcements.site.image"
           :alt="t('dashboard.siteAnnouncement')"/>
    </section>
    <section class="panel"><p class="eyebrow">{{ t('dashboard.next') }}</p>
      <h2>{{ t('dashboard.suggestions') }}</h2>
      <div class="quick-links">
        <RouterLink to="/textures"><span><strong>{{ t('dashboard.explore') }}</strong><small>{{ t('dashboard.exploreDescription') }}</small></span>
          <ArrowRight :size="20"/>
        </RouterLink>
        <RouterLink to="/textures/upload"><span><strong>{{ t('dashboard.share') }}</strong><small>{{ t('dashboard.shareDescription') }}</small></span>
          <ArrowRight :size="20"/>
        </RouterLink>
        <RouterLink to="/account"><span><strong>{{ t('dashboard.profile') }}</strong><small>{{ t('dashboard.profileDescription') }}</small></span>
          <ArrowRight :size="20"/>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
