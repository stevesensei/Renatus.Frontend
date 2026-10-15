<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { z } from 'zod';
import { useRoute } from 'vue-router';
import { connectInteractionSchema, decideConnectInteraction, loadConnectInteraction } from '../api/connect';
import ConnectInteractionCard from '../components/ConnectInteractionCard.vue';
import PageHeading from '../components/PageHeading.vue';
import { useOperation } from '../composables/operation';
import { t } from '../i18n';

type ConnectInteraction = z.infer<typeof connectInteractionSchema>;

const route = useRoute();
const operation = useOperation();
const interaction = ref<ConnectInteraction | null>(null);
const interactionId = computed(() => (typeof route.query['interaction'] === 'string' ? route.query['interaction'] : ''));

/** Sends the user's explicit choice and navigates to the server completion endpoint without exposing the frontend JWT. */
async function decide(approve: boolean, playerId?: string): Promise<void> {
  if (!interactionId.value) return;
  await operation.run(async () => {
    const result = await decideConnectInteraction(interactionId.value, approve, playerId);
    window.location.assign(result.completionUrl);
  });
}

onMounted(() => operation.run(async () => {
  if (interactionId.value) interaction.value = await loadConnectInteraction(interactionId.value);
}));
</script>

<template>
  <div class="consent-wrap">
    <PageHeading :eyebrow="t('connect.consentEyebrow')" :title="t('connect.consentTitle')" :description="t('connect.consentDescription')" />
    <ConnectInteractionCard v-if="interaction" :interaction="interaction" :pending="operation.pending.value" @decide="decide" />
    <Message v-else-if="!interactionId" severity="error">{{ t('consent.missingInteraction') }}</Message>
    <Message v-if="operation.error.value" severity="error">{{ operation.error.value }}</Message>
  </div>
</template>
