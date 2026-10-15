<script setup lang="ts">
import { ShieldCheck } from '@lucide/vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { decideUnionInteraction, loadUnionInteraction } from '../api/union';
import PageHeading from '../components/PageHeading.vue';
import { useOperation } from '../composables/operation';
import { t } from '../i18n';

const route = useRoute();
const operation = useOperation();
const ready = ref(false);
const expiresAt = ref('');
const interactionId = computed(() => (typeof route.query['interaction'] === 'string' ? route.query['interaction'] : ''));

/** Completes the server-held interaction and follows only the validated continuation returned by the API. */
async function decide(approve: boolean): Promise<void> {
  if (!interactionId.value) return;
  await operation.run(async () => {
    const result = await decideUnionInteraction(interactionId.value, approve);
    window.location.assign(result.redirectUri);
  });
}

onMounted(() => operation.run(async () => {
  if (!interactionId.value) return;
  const result = await loadUnionInteraction(interactionId.value);
  expiresAt.value = result.expiresAt;
  ready.value = true;
}));
</script>

<template>
  <div class="consent-wrap">
    <PageHeading :eyebrow="t('consent.unionEyebrow')" :title="t('consent.unionTitle')" :description="t('consent.unionDescription')" />
    <section v-if="ready" class="panel consent-card form-stack">
      <div class="consent-icon"><ShieldCheck :size="32" /></div>
      <div><h2>{{ t('consent.shareIdentity') }}</h2><p class="muted">{{ t('consent.unionFields') }}</p></div>
      <ul class="scope-list"><li>{{ t('consent.nickname') }}</li><li>{{ t('consent.email') }}</li></ul>
      <p class="muted small">{{ t('consent.expiresAt', { value1: new Date(expiresAt).toLocaleString() }) }}</p>
      <div class="consent-actions"><Button outlined severity="secondary" :disabled="operation.pending.value" @click="decide(false)">{{ t('consent.deny') }}</Button><Button :loading="operation.pending.value" @click="decide(true)">{{ t('consent.approve') }}</Button></div>
    </section>
    <Message v-else-if="!interactionId" severity="error">{{ t('consent.missingInteraction') }}</Message>
    <Message v-if="operation.error.value" severity="error">{{ operation.error.value }}</Message>
  </div>
</template>
