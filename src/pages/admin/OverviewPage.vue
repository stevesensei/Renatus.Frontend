<script setup lang="ts">
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
const activities=computed(()=>overview.value?.recentActivities.map(item=>({id:item.clientId,user:item.userName,player:item.playerName??'未绑定角色',time:new Date(item.lastUsedAt).toLocaleString(),status:'最近使用'}))??[]);
async function load():Promise<void>{await operation.run(async()=>{overview.value=await api('admin/overview',overviewSchema);});}
onMounted(load);

</script>
<template>
  <PageHeading eyebrow="管理面板" title="社区概览" description="了解社区的角色、材质和近期活动。"><Button outlined label="刷新概览" @click="load" /></PageHeading>
  <div class="metrics-grid four"><MetricCard label="用户总数" :value="overview?.totalUsers ?? 0" :icon="Users" /><MetricCard label="角色总数" :value="overview?.totalPlayers ?? 0" :icon="Gamepad2" /><MetricCard label="材质总数" :value="overview?.totalTextures ?? 0" :icon="Brush" /><MetricCard label="游戏客户端" :value="overview?.totalClients ?? 0" :icon="Activity" /></div>
  <section class="panel"><div class="section-heading"><div><h2>最近活动</h2><p class="muted">社区中最近使用过的 Minecraft 身份。</p></div></div><DataTable :value="activities" paginator :rows="10" striped-rows><Column field="user" header="用户" /><Column field="player" header="角色" /><Column field="time" header="最近使用" /><Column header="状态"><template #body><Tag value="最近使用" severity="success" /></template></Column><template #empty>暂无活动。</template></DataTable></section>
</template>
