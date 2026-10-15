<script setup lang="ts">
import { KeyRound, Trash2 } from '@lucide/vue';
import { onMounted, ref } from 'vue';
import type { z } from 'zod';
import { api } from '../api/client';
import { connectGrantSchema, connectGrantsSchema, revokeConnectGrant } from '../api/connect';
import ConfirmAction from '../components/ConfirmAction.vue';
import PageHeading from '../components/PageHeading.vue';
import { useOperation } from '../composables/operation';
import { t } from '../i18n';

type ConnectGrant = z.infer<typeof connectGrantSchema>;

const operation = useOperation();
const grants = ref<ConnectGrant[]>([]);
const revoking = ref<ConnectGrant | null>(null);
const revokeVisible = ref(false);

async function load(): Promise<void> {
  await operation.run(async () => { grants.value = await api('connect/grants', connectGrantsSchema); });
}

async function revoke(): Promise<void> {
  const grant = revoking.value;
  if (!grant) return;
  await operation.run(async () => {
    await revokeConnectGrant(grant.authorizationId);
    revoking.value = null;
    await load();
  }, t('authorizations.revoked'));
}

onMounted(load);
</script>

<template>
  <PageHeading :eyebrow="t('authorizations.eyebrow')" :title="t('authorizations.title')" :description="t('authorizations.description')" />
  <Message v-if="operation.error.value" severity="error">{{ operation.error.value }}</Message>
  <div v-if="grants.length" class="collection-grid">
    <article v-for="grant in grants" :key="grant.authorizationId" class="panel authorization-card">
      <div class="authorization-icon"><KeyRound :size="21" /></div><div><h2>{{ grant.clientName }}</h2><p class="muted">{{ t('authorizations.createdAt', { value1: new Date(grant.createdAt).toLocaleString() }) }}</p><div class="scope-tags"><Tag v-for="scope in grant.scopes" :key="scope" :value="scope" severity="secondary" /></div></div>
      <Button text severity="danger" :aria-label="t('authorizations.revoke')" @click="revoking = grant; revokeVisible = true"><Trash2 :size="18" /></Button>
    </article>
  </div>
  <section v-else class="panel empty-state"><h2>{{ t('authorizations.empty') }}</h2><p class="muted">{{ t('authorizations.emptyHint') }}</p></section>
  <ConfirmAction v-model:visible="revokeVisible" :title="t('authorizations.revokeTitle')" :description="t('authorizations.revokeMessage', { value1: revoking?.clientName ?? '' })" @confirm="revoke" />
</template>
