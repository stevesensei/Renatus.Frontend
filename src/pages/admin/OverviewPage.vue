<script setup lang="ts">
import { t } from '../../i18n';
import { Activity, Brush, Gamepad2, Users } from '@lucide/vue';
import { computed, onMounted, shallowRef } from 'vue';
import type { z } from 'zod';
import MetricCard from '../../components/MetricCard.vue';
import PageHeading from '../../components/PageHeading.vue';
import { api } from '../../api/client';
import { overviewSchema } from '../../api/admin';
import { useOperation } from '../../composables/operation';
const operation=useOperation();
const overview=shallowRef<z.infer<typeof overviewSchema>|null>(null);
const activities=computed(()=>overview.value?.recentActivities.map(item=>({id:item.clientId,user:item.userName,player:item.playerName??t('common.unassignedPlayer'),time:new Date(item.lastUsedAt).toLocaleString(),status:t('common.lastUsed')}))??[]);
async function load():Promise<void>{await operation.run(async()=>{overview.value=await api('admin/overview',overviewSchema);});}
onMounted(load);

</script>
<template>
  <PageHeading :eyebrow="t('nav.admin')" :title="t('nav.communityOverview')" :description="t('overview.description')"><Button outlined :label="t('overview.refresh')" @click="load" /></PageHeading>
  <div class="metrics-grid four"><MetricCard :label="t('overview.totalUsers')" :value="overview?.totalUsers ?? 0" :icon="Users" /><MetricCard :label="t('overview.totalPlayers')" :value="overview?.totalPlayers ?? 0" :icon="Gamepad2" /><MetricCard :label="t('overview.totalTextures')" :value="overview?.totalTextures ?? 0" :icon="Brush" /><MetricCard :label="t('overview.totalClients')" :value="overview?.totalClients ?? 0" :icon="Activity" /></div>
  <section class="panel"><div class="section-heading"><div><h2>{{ t('overview.recentActivities') }}</h2><p class="muted">{{ t('overview.activitiesDescription') }}</p></div></div><DataTable :value="activities" paginator :rows="10" striped-rows><Column field="user" :header="t('common.user')" /><Column field="player" :header="t('common.player')" /><Column field="time" :header="t('common.lastUsed')" /><Column :header="t('common.status')"><template #body><Tag :value="t('common.lastUsed')" severity="success" /></template></Column><template #empty>{{ t('overview.emptyActivities') }}</template></DataTable></section>
</template>
