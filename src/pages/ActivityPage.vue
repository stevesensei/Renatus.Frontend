<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import { computed, onMounted, ref } from 'vue';
import type { z } from 'zod';
import { useRoute } from 'vue-router';
import { activityItemSchema, loadActivity } from '../api/union';
import PageHeading from '../components/PageHeading.vue';
import { useOperation } from '../composables/operation';
import { t } from '../i18n';

type ActivityItem = z.infer<typeof activityItemSchema>;

const route = useRoute();
const operation = useOperation();
const items = ref<ActivityItem[]>([]);
const page = ref(1);
const total = ref(0);
const admin = computed(() => route.path.startsWith('/admin/'));
const hasNext = computed(() => page.value * 20 < total.value);

function actionName(action: string): string {
  const names: Readonly<Record<string, string>> = {
    'connect.authorize': t('activity.connectAuthorized'),
    'connect.deny': t('activity.connectDenied'),
    'connect.grant.revoke': t('activity.connectRevoked'),
    'profile.rename': t('activity.profileRenamed'),
    'union.bound': t('activity.unionBound'),
    'union.unbound': t('activity.unionUnbound'),
    'union.remapped': t('activity.unionRemapped'),
  };
  return names[action] ?? action;
}

async function load(): Promise<void> {
  await operation.run(async () => {
    const result = await loadActivity(admin.value, page.value);
    items.value = result.items;
    total.value = result.total;
  });
}

async function move(offset: number): Promise<void> {
  page.value += offset;
  await load();
}

onMounted(load);
</script>

<template>
  <PageHeading :eyebrow="t('activity.eyebrow')" :title="admin ? t('activity.adminTitle') : t('activity.title')" :description="admin ? t('activity.adminDescription') : t('activity.description')" />
  <Message v-if="operation.error.value" severity="error">{{ operation.error.value }}</Message>
  <section class="panel">
    <DataTable v-if="items.length" :value="items" striped-rows>
      <Column :header="t('activity.time')"><template #body="slot">{{ new Date(slot.data.createdAt).toLocaleString() }}</template></Column>
      <Column :header="t('activity.action')"><template #body="slot"><strong>{{ actionName(slot.data.action) }}</strong></template></Column>
      <Column v-if="admin" :header="t('activity.user')"><template #body="slot">{{ slot.data.userName || t('activity.system') }}</template></Column>
      <Column :header="t('activity.player')"><template #body="slot">{{ slot.data.playerName || '—' }}</template></Column>
      <Column v-if="admin" field="ipAddress" :header="t('activity.address')" />
    </DataTable>
    <div v-else class="empty-state"><h2>{{ t('activity.empty') }}</h2><p class="muted">{{ t('activity.emptyHint') }}</p></div>
    <div class="pagination"><Button text :disabled="page <= 1 || operation.pending.value" @click="move(-1)"><ChevronLeft :size="17" />{{ t('common.previousPage') }}</Button><span>{{ t('activity.page', { value1: page }) }}</span><Button text :disabled="!hasNext || operation.pending.value" @click="move(1)">{{ t('common.nextPage') }}<ChevronRight :size="17" /></Button></div>
  </section>
</template>
